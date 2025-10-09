import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe/stripe';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import ActiveUserSubscriptionService from '@/lib/firebase/activeUserSubscriptionService';
import PaymentDetailsService from '@/lib/firebase/paymentDetailsService';
import StripeSubscriptionService from '@/lib/stripe/subscriptionService';
import StripeCustomerService from '@/lib/stripe/customerService';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Received webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('=== Handling Checkout Session Completed ===');
    console.log('Session ID:', session.id);
    console.log('Customer ID:', session.customer);
    console.log('Subscription ID:', session.subscription);
    console.log('Payment status:', session.payment_status);
    
    if (session.mode === 'subscription' && session.subscription && session.payment_status === 'paid') {
      console.log('Processing successful subscription checkout');
      
      // The subscription creation will be handled by the subscription.created webhook
      // But we can log this for tracking
      console.log('✅ Subscription checkout completed successfully');
      console.log('Subscription will be processed in subscription.created webhook');
    }
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('=== Handling Stripe Subscription Created ===');
    console.log('Stripe subscription ID:', subscription.id);
    console.log('Stripe customer ID:', subscription.customer);
    console.log('Subscription status:', subscription.status);
    console.log('Subscription metadata:', subscription.metadata);
    
    // Try to find Firebase subscription in multiple ways
    let firebaseSubscription = null;
    
    // Method 1: Look for existing subscription by Stripe ID (for existing flow)
    firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (!firebaseSubscription && subscription.metadata?.firebaseSubscriptionId) {
      // Method 2: Look up by Firebase subscription ID from metadata
      console.log('Looking up Firebase subscription by metadata ID:', subscription.metadata.firebaseSubscriptionId);
      firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionById(subscription.metadata.firebaseSubscriptionId);
    }
    
    if (!firebaseSubscription && subscription.metadata?.userId) {
      // Method 3: Look for recent subscription by userId (fallback)
      console.log('Looking up subscription by userId:', subscription.metadata.userId);
      const userSubscription = await FirebaseUserSubscriptionService.getUserSubscription(subscription.metadata.userId);
      if (userSubscription && !userSubscription.stripeSubscriptionId) {
        firebaseSubscription = userSubscription;
      }
    }
    
    if (firebaseSubscription) {
      console.log('Found Firebase subscription:', firebaseSubscription.id);
      
      // 1. Update main subscription record with Stripe data
      const updateData = {
        stripeSubscriptionId: subscription.id, // Link to Stripe
        status: StripeSubscriptionService.mapStripeStatusToOurStatus(subscription.status),
        stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      };
      
      await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, updateData);
      console.log('✅ 1. Updated main subscription record with Stripe data');
      
      // Get the updated subscription
      const updatedSubscription = await FirebaseUserSubscriptionService.getSubscriptionById(firebaseSubscription.id);
      
      if (updatedSubscription && ['active', 'trialing'].includes(updatedSubscription.status)) {
        // 2. Update active subscription table
        try {
          await ActiveUserSubscriptionService.setActiveSubscription(updatedSubscription.userId, updatedSubscription);
          console.log('✅ 2. Updated active_user_subscriptions table for user:', updatedSubscription.userId);
        } catch (activeError) {
          console.error('❌ Error updating active subscription:', activeError);
        }
        
        // 3. Create payment record
        try {
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;
          const currency = subscription.items.data[0]?.price?.currency || 'usd';
          
          const paymentRecord = await PaymentDetailsService.createPayment({
            userId: updatedSubscription.userId,
            subscriptionId: updatedSubscription.id,
            paymentAmount: amount / 100, // Convert from cents
            currency,
            modeOfPayment: 'card',
            paymentStatus: 'completed',
            stripePaymentIntentId: subscription.latest_invoice as string,
            userDetails: updatedSubscription.userDetails,
            planName: updatedSubscription.planName,
            billingCycle: updatedSubscription.billingCycle,
            description: `Stripe subscription payment: ${updatedSubscription.planName}`,
          });
          
          console.log('✅ 3. Created payment record:', paymentRecord.id);
        } catch (paymentError) {
          console.error('❌ Error creating payment record:', paymentError);
        }
      }
      
      console.log('🎉 Successfully processed Stripe subscription creation');
    } else {
      console.warn('⚠️ No Firebase subscription found for Stripe ID:', subscription.id);
    }
  } catch (error) {
    console.error('❌ Error handling subscription created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Handling subscription updated:', subscription.id);
    
    const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (firebaseSubscription) {
      const updateData: any = {
        status: StripeSubscriptionService.mapStripeStatusToOurStatus(subscription.status),
        stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };

      // Update end date if subscription is canceled
      if (subscription.canceled_at) {
        updateData.cancelledAt = new Date(subscription.canceled_at * 1000);
        updateData.endDate = new Date(subscription.current_period_end * 1000);
      }

      // Update payment method if available
      if (subscription.default_payment_method) {
        const paymentMethodId = typeof subscription.default_payment_method === 'string' 
          ? subscription.default_payment_method 
          : subscription.default_payment_method.id;
        
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        const paymentInfo = StripeCustomerService.extractPaymentMethodInfo(paymentMethod);
        
        if (paymentInfo) {
          updateData.paymentMethod = paymentInfo;
        }
      }

      await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, updateData);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Handling subscription deleted:', subscription.id);
    
    const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (firebaseSubscription) {
      await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
        status: 'cancelled',
        endDate: new Date(),
        cancelledAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    console.log('Handling trial will end:', subscription.id);
    
    // You can implement logic here to notify users about trial ending
    // For example, send an email notification or in-app notification
    
    const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (firebaseSubscription) {
      // You could update subscription to mark that trial is ending soon
      console.log(`Trial ending soon for user: ${firebaseSubscription.userId}`);
    }
  } catch (error) {
    console.error('Error handling trial will end:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Handling payment succeeded:', invoice.id);
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
      
      const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscriptionId);
      
      if (firebaseSubscription) {
        // Update subscription to active status and extend end date
        await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
          status: 'active',
          nextBillingDate: new Date(invoice.period_end * 1000),
          endDate: new Date(invoice.period_end * 1000),
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Handling payment failed:', invoice.id);
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
      
      const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscriptionId);
      
      if (firebaseSubscription) {
        // Update subscription to past_due status
        await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
          status: 'past_due',
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log('Handling customer created:', customer.id);
    // You can implement additional logic here if needed
  } catch (error) {
    console.error('Error handling customer created:', error);
    throw error;
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  try {
    console.log('Handling customer updated:', customer.id);
    // You can implement additional logic here if needed
  } catch (error) {
    console.error('Error handling customer updated:', error);
    throw error;
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe/stripe';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import PaymentDetailsService from '@/lib/firebase/paymentDetailsService';
import StripeSubscriptionService from '@/lib/stripe/subscriptionService';
import StripeCustomerService from '@/lib/stripe/customerService';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
}

export async function POST(request: NextRequest) {
  console.log('🚀 Webhook received at:', new Date().toISOString());
  
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    console.log('📝 Webhook signature present:', !!signature);

    if (!signature) {
      console.log('❌ Missing stripe signature');
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📨 Received webhook event: ${event.type} at ${new Date().toISOString()}`);
    console.log('📋 Event ID:', event.id);
    console.log('📋 Event data keys:', Object.keys(event.data.object));

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
    console.log('Session metadata:', session.metadata);
    
    if (session.mode === 'subscription' && session.subscription && session.payment_status === 'paid') {
      console.log('Processing successful subscription checkout');
      
      // For immediate payments (trialDays: 0), we need to update payment status here
      // because this is when the payment actually completes
      if (session.metadata?.firebaseSubscriptionId) {
        console.log('Found Firebase subscription ID in metadata:', session.metadata.firebaseSubscriptionId);
        
        try {
          // Find and update the pending payment record
          const existingPayment = await PaymentDetailsService.findPendingPaymentForSubscription(
            session.metadata.firebaseSubscriptionId
          );
          
          if (existingPayment) {
            console.log('Found pending payment record, updating to completed:', existingPayment.id);
            
            // Get payment details from session
            const paymentIntentId = session.payment_intent as string;
            
            await PaymentDetailsService.markPaymentCompleted(
              existingPayment.id,
              paymentIntentId,
              undefined, // stripeChargeId - might be available in payment intent
              undefined, // stripeInvoiceId - will be set later from invoice webhook
              undefined  // cardDetails - could extract from payment method if needed
            );
            
            console.log('✅ Payment status updated to completed via checkout session');
          } else {
            console.log('No pending payment record found for subscription:', session.metadata.firebaseSubscriptionId);
          }
        } catch (paymentError) {
          console.error('❌ Error updating payment record from checkout session:', paymentError);
        }
      } else {
        console.log('No Firebase subscription ID found in session metadata');
      }
      
      console.log('✅ Subscription checkout completed successfully');
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
        // 2. Handle payment record based on plan type
        try {
          const existingPayment = await PaymentDetailsService.findPendingPaymentForSubscription(updatedSubscription.id);
          
          if (existingPayment) {
            // Update existing payment record (for trial plans that had pending payment)
            console.log('Found existing pending payment record, updating to completed:', existingPayment.id);
            await PaymentDetailsService.markPaymentCompleted(
              existingPayment.id,
              subscription.latest_invoice as string,
              undefined, // stripeChargeId - will be set from invoice webhook
              undefined, // stripeInvoiceId - will be set from invoice webhook
              undefined  // cardDetails - will be set from invoice webhook
            );
            console.log('✅ 2. Updated existing payment record to completed');
          } else {
            // Create new payment record for immediate payment plans (trialDays: 0) or legacy handling
            console.log('No existing payment record found, creating completed payment record');
            const amount = subscription.items.data[0]?.price?.unit_amount || 0;
            const currency = subscription.items.data[0]?.price?.currency || 'usd';
            
            const paymentRecord = await PaymentDetailsService.createPayment({
              userId: updatedSubscription.userId,
              subscriptionId: updatedSubscription.id,
              paymentAmount: amount / 100, // Convert from cents
              currency,
              modeOfPayment: 'card',
              paymentStatus: 'completed', // Direct payment is completed by the time webhook fires
              stripePaymentIntentId: subscription.latest_invoice as string,
              userDetails: updatedSubscription.userDetails,
              subscriptionDetails: {
                planName: updatedSubscription.planName,
                billingCycle: updatedSubscription.billingCycle,
                startDate: updatedSubscription.startDate,
                endDate: updatedSubscription.endDate,
                status: updatedSubscription.status,
              },
              planName: updatedSubscription.planName,
              billingCycle: updatedSubscription.billingCycle,
              description: `Payment for ${updatedSubscription.planName} subscription (immediate payment)`,
            });
            
            console.log('✅ 2. Created completed payment record for immediate payment:', paymentRecord.id);
          }
        } catch (paymentError) {
          console.error('❌ Error handling payment record:', paymentError);
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
      const updateData: Record<string, unknown> = {
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
    console.log('=== Handling Trial Will End ===');
    console.log('Subscription ID:', subscription.id);
    console.log('Trial end date:', new Date(subscription.trial_end! * 1000));
    
    const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (firebaseSubscription) {
      console.log('Found Firebase subscription:', firebaseSubscription.id);
      console.log('Current status:', firebaseSubscription.status);
      
      // Update subscription to indicate trial is ending soon
      await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
        isTrialActive: false,
        trialEndDate: new Date(subscription.trial_end! * 1000),
      });
      
      console.log('✅ Updated subscription with trial ending information');
      console.log(`Trial ending soon for user: ${firebaseSubscription.userId}`);
      
      // You could add notification logic here
      // For example, send an email or push notification about trial ending
      
    } else {
      console.warn('⚠️ No Firebase subscription found for Stripe subscription:', subscription.id);
    }
  } catch (error) {
    console.error('❌ Error handling trial will end:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('=== Handling Payment Succeeded ===');
    console.log('Invoice ID:', invoice.id);
    console.log('Payment status:', invoice.status);
    console.log('Amount paid:', invoice.amount_paid / 100, invoice.currency);
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
      
      console.log('Processing payment for subscription:', subscriptionId);
      
      const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscriptionId);
      
      if (firebaseSubscription) {
        console.log('Found Firebase subscription:', firebaseSubscription.id);
        console.log('Plan name:', firebaseSubscription.planName);
        console.log('Is trial period:', firebaseSubscription.isTrialPeriod);
        
        // Get Stripe subscription details for trial check
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const isInTrialPeriod = stripeSubscription.status === 'trialing';
        
        console.log('Stripe subscription status:', stripeSubscription.status);
        console.log('Is currently in trial:', isInTrialPeriod);
        
        // 1. Handle payment record - update existing or create new
        try {
          const existingPayment = await PaymentDetailsService.findPendingPaymentForSubscription(firebaseSubscription.id);
          
          if (existingPayment) {
            // Update existing payment record
            console.log('Found existing pending payment record, updating to completed:', existingPayment.id);
            await PaymentDetailsService.markPaymentCompleted(
              existingPayment.id,
              invoice.payment_intent as string,
              invoice.charge as string,
              invoice.id
            );
            console.log('✅ Updated existing payment record to completed');
          } else {
            // Create new payment record for recurring payments or if none exists
            console.log('No existing payment record found, creating new payment record');
            const paymentRecord = await PaymentDetailsService.createPayment({
              userId: firebaseSubscription.userId,
              subscriptionId: firebaseSubscription.id,
              paymentAmount: invoice.amount_paid / 100, // Convert from cents
              currency: invoice.currency,
              modeOfPayment: 'card',
              paymentStatus: invoice.status === 'paid' ? 'completed' : 'failed',
              stripePaymentIntentId: invoice.payment_intent as string,
              stripeChargeId: invoice.charge as string,
              stripeInvoiceId: invoice.id,
              userDetails: firebaseSubscription.userDetails,
              subscriptionDetails: {
                planName: firebaseSubscription.planName,
                billingCycle: firebaseSubscription.billingCycle,
                startDate: firebaseSubscription.startDate,
                endDate: firebaseSubscription.endDate,
                status: firebaseSubscription.status,
              },
              planName: firebaseSubscription.planName,
              billingCycle: firebaseSubscription.billingCycle,
              description: `Payment for ${firebaseSubscription.planName} subscription`,
            });
            
            console.log('✅ Created new payment record:', paymentRecord.id);
          }
          console.log('Payment details stored with all required information');
        } catch (paymentError) {
          console.error('❌ Error creating payment record:', paymentError);
        }
        
        // 2. For paid plans (non-trial), update subscription status
        if (!isInTrialPeriod && firebaseSubscription.planName !== 'Free Plan') {
          console.log('Processing paid plan payment (non-trial)');
          
          // Update main subscription record
          const subscriptionUpdateData = {
            status: 'active',
            nextBillingDate: new Date(invoice.period_end * 1000),
            endDate: new Date(invoice.period_end * 1000),
            lastPaymentDate: new Date(),
            isTrialPeriod: false,
          };
          
          await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, subscriptionUpdateData);
          console.log('✅ Updated main subscription status to active');
        } else if (isInTrialPeriod) {
          console.log('Subscription is in trial period - maintaining trial status');
          
          // For trial periods, just update the billing date but keep trial status
          await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
            nextBillingDate: new Date(invoice.period_end * 1000),
            endDate: new Date(invoice.period_end * 1000),
          });
          console.log('✅ Updated trial subscription billing dates');
        } else {
          console.log('Free plan payment processed - no status change needed');
        }
        
        console.log('🎉 Payment success handling completed successfully');
      } else {
        console.warn('⚠️ No Firebase subscription found for Stripe subscription:', subscriptionId);
      }
    } else {
      console.log('Payment not associated with a subscription - skipping');
    }
  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('=== Handling Payment Failed ===');
    console.log('Invoice ID:', invoice.id);
    console.log('Payment attempt failed for amount:', invoice.amount_due / 100, invoice.currency);
    
    if (invoice.subscription) {
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
      
      console.log('Processing failed payment for subscription:', subscriptionId);
      
      const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscriptionId);
      
      if (firebaseSubscription) {
        console.log('Found Firebase subscription:', firebaseSubscription.id);
        
        // 1. Handle failed payment record - update existing or create new
        try {
          const existingPayment = await PaymentDetailsService.findPendingPaymentForSubscription(firebaseSubscription.id);
          
          if (existingPayment) {
            // Update existing payment record to failed
            console.log('Found existing pending payment record, marking as failed:', existingPayment.id);
            await PaymentDetailsService.markPaymentFailed(
              existingPayment.id,
              `Payment failed for invoice ${invoice.id}`
            );
            console.log('✅ Updated existing payment record to failed');
          } else {
            // Create new failed payment record
            console.log('No existing payment record found, creating failed payment record');
            const paymentRecord = await PaymentDetailsService.createPayment({
              userId: firebaseSubscription.userId,
              subscriptionId: firebaseSubscription.id,
              paymentAmount: invoice.amount_due / 100, // Convert from cents
              currency: invoice.currency,
              modeOfPayment: 'card',
              paymentStatus: 'failed',
              stripePaymentIntentId: invoice.payment_intent as string,
              stripeChargeId: invoice.charge as string,
              stripeInvoiceId: invoice.id,
              userDetails: firebaseSubscription.userDetails,
              subscriptionDetails: {
                planName: firebaseSubscription.planName,
                billingCycle: firebaseSubscription.billingCycle,
                startDate: firebaseSubscription.startDate,
                endDate: firebaseSubscription.endDate,
                status: firebaseSubscription.status,
              },
              planName: firebaseSubscription.planName,
              billingCycle: firebaseSubscription.billingCycle,
              description: `Failed payment for ${firebaseSubscription.planName} subscription`,
            });
            
            console.log('✅ Created failed payment record:', paymentRecord.id);
          }
        } catch (paymentError) {
          console.error('❌ Error creating failed payment record:', paymentError);
        }
        
        // 2. Update subscription to past_due status
        await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
          status: 'past_due',
        });
        console.log('✅ Updated subscription status to past_due');
        
        console.log('🔴 Payment failure handling completed');
      } else {
        console.warn('⚠️ No Firebase subscription found for Stripe subscription:', subscriptionId);
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
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
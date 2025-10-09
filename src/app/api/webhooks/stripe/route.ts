import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe/stripe';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
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

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('Handling subscription created:', subscription.id);
    
    // Update Firebase subscription with Stripe data
    const firebaseSubscription = await FirebaseUserSubscriptionService.getSubscriptionByStripeId(subscription.id);
    
    if (firebaseSubscription) {
      await FirebaseUserSubscriptionService.updateSubscription(firebaseSubscription.id, {
        status: StripeSubscriptionService.mapStripeStatusToOurStatus(subscription.status),
        stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      });
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
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
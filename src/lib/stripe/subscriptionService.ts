import Stripe from 'stripe';
import stripe from './stripe';
import { Plan } from '@/lib/firebase/subscriptionService';
import { UserSubscription } from '@/types/subscription';

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  paymentMethodId?: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  paymentMethodId?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

export class StripeSubscriptionService {
  // Create a new subscription
  static async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata || {},
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent', 'customer'],
      };

      // Add trial period if specified
      if (params.trialPeriodDays && params.trialPeriodDays > 0) {
        subscriptionParams.trial_period_days = params.trialPeriodDays;
      }

      // Add payment method if provided
      if (params.paymentMethodId) {
        subscriptionParams.default_payment_method = params.paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);
      return subscription;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }

  // Get subscription by ID
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'default_payment_method'],
      });
      return subscription;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      console.error('Error getting Stripe subscription:', error);
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(params: UpdateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (params.priceId) {
        // Get current subscription to update the item
        const currentSub = await stripe.subscriptions.retrieve(params.subscriptionId);
        updateParams.items = [
          {
            id: currentSub.items.data[0].id,
            price: params.priceId,
          },
        ];
      }

      if (params.paymentMethodId) {
        updateParams.default_payment_method = params.paymentMethodId;
      }

      if (params.cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = params.cancelAtPeriodEnd;
      }

      if (params.metadata) {
        updateParams.metadata = params.metadata;
      }

      const subscription = await stripe.subscriptions.update(params.subscriptionId, updateParams);
      return subscription;
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      throw error;
    }
  }

  // Cancel subscription at period end
  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    } catch (error) {
      console.error('Error cancelling Stripe subscription:', error);
      throw error;
    }
  }

  // Immediately cancel subscription
  static async cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error immediately cancelling Stripe subscription:', error);
      throw error;
    }
  }

  // Resume a cancelled subscription
  static async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      return subscription;
    } catch (error) {
      console.error('Error resuming Stripe subscription:', error);
      throw error;
    }
  }

  // Create price for a plan
  static async createPrice(plan: Plan, billingCycle: 'monthly' | 'annual'): Promise<Stripe.Price> {
    try {
      const amount = billingCycle === 'monthly' 
        ? Math.round(plan.monthlyPrice * 100) // Convert to cents
        : Math.round(plan.monthlyPrice * 12 * (1 - (plan.annualDiscountPct || 0) / 100) * 100);

      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: 'usd',
        recurring: {
          interval: billingCycle === 'monthly' ? 'month' : 'year',
        },
        product_data: {
          name: `${plan.name} - ${billingCycle}`,
          metadata: {
            planId: plan.id,
            billingCycle,
          },
        },
        metadata: {
          planId: plan.id,
          billingCycle,
        },
      });

      return price;
    } catch (error) {
      console.error('Error creating Stripe price:', error);
      throw error;
    }
  }

  // Create or get price for a plan
  static async getOrCreatePrice(plan: Plan, billingCycle: 'monthly' | 'annual'): Promise<string> {
    try {
      // First, try to find existing price
      const existingPrices = await stripe.prices.list({
        product: plan.stripeProductId, // You'll need to add this to your Plan interface
        active: true,
      });

      const existingPrice = existingPrices.data.find(
        price => price.metadata?.planId === plan.id && price.metadata?.billingCycle === billingCycle
      );

      if (existingPrice) {
        return existingPrice.id;
      }

      // If no existing price, create a new one
      const newPrice = await this.createPrice(plan, billingCycle);
      return newPrice.id;
    } catch (error) {
      console.error('Error getting or creating Stripe price:', error);
      throw error;
    }
  }

  // Convert Stripe subscription status to our status
  static mapStripeStatusToOurStatus(stripeStatus: Stripe.Subscription.Status): UserSubscription['status'] {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'trialing':
        return 'trialing';
      case 'past_due':
        return 'past_due';
      case 'canceled':
        return 'cancelled';
      case 'incomplete':
        return 'incomplete';
      case 'incomplete_expired':
        return 'incomplete_expired';
      case 'unpaid':
        return 'past_due';
      case 'paused':
        return 'cancelled';
      default:
        return 'expired';
    }
  }

  // Get upcoming invoice for subscription
  static async getUpcomingInvoice(subscriptionId: string): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        subscription: subscriptionId,
      });
      return invoice;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'invoice_upcoming_none') {
        return null;
      }
      console.error('Error getting upcoming invoice:', error);
      throw error;
    }
  }

  // Get subscription invoices
  static async getSubscriptionInvoices(
    subscriptionId: string, 
    limit: number = 10
  ): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      console.error('Error getting subscription invoices:', error);
      throw error;
    }
  }

  // Create payment method and attach to customer
  static async createPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      // Attach payment method to customer
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw error;
    }
  }

  // Handle trial ending logic
  static async handleTrialEnding(subscription: Stripe.Subscription): Promise<void> {
    try {
      // If no payment method is attached, cancel the subscription
      if (!subscription.default_payment_method) {
        await this.cancelSubscriptionImmediately(subscription.id);
        return;
      }

      // Otherwise, the subscription will automatically transition to active
      // and Stripe will attempt to charge the default payment method
      console.log(`Trial ending for subscription ${subscription.id}, attempting payment`);
    } catch (error) {
      console.error('Error handling trial ending:', error);
      throw error;
    }
  }
}

export default StripeSubscriptionService;
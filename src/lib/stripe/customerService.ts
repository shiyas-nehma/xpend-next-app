import Stripe from 'stripe';
import stripe from './stripe';
import { UserSubscription } from '@/types/subscription';

export interface StripeCustomerData {
  email: string;
  name?: string;
  userId: string;
  phone?: string;
}

export class StripeCustomerService {
  // Create a new Stripe customer
  static async createCustomer(customerData: StripeCustomerData): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          userId: customerData.userId,
        },
        phone: customerData.phone,
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Get or create a Stripe customer by user ID
  static async getOrCreateCustomer(customerData: StripeCustomerData): Promise<Stripe.Customer> {
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerData.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        
        // Update metadata if userId is missing
        if (!customer.metadata?.userId) {
          await stripe.customers.update(customer.id, {
            metadata: {
              ...customer.metadata,
              userId: customerData.userId,
            },
          });
        }
        
        return customer;
      }

      // If no existing customer, create a new one
      return await this.createCustomer(customerData);
    } catch (error) {
      console.error('Error getting or creating Stripe customer:', error);
      throw error;
    }
  }

  // Get customer by Stripe customer ID
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return null;
      }
      
      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      console.error('Error getting Stripe customer:', error);
      throw error;
    }
  }

  // Update customer information
  static async updateCustomer(
    customerId: string, 
    updateData: Partial<StripeCustomerData>
  ): Promise<Stripe.Customer> {
    try {
      const updateParams: Stripe.CustomerUpdateParams = {};
      
      if (updateData.email) updateParams.email = updateData.email;
      if (updateData.name) updateParams.name = updateData.name;
      if (updateData.phone) updateParams.phone = updateData.phone;
      if (updateData.userId) {
        updateParams.metadata = { userId: updateData.userId };
      }

      const customer = await stripe.customers.update(customerId, updateParams);
      return customer;
    } catch (error) {
      console.error('Error updating Stripe customer:', error);
      throw error;
    }
  }

  // Attach payment method to customer
  static async attachPaymentMethod(
    customerId: string, 
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return paymentMethod;
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw error;
    }
  }

  // Set default payment method for customer
  static async setDefaultPaymentMethod(
    customerId: string, 
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      // First attach the payment method if not already attached
      await this.attachPaymentMethod(customerId, paymentMethodId);

      // Then set it as the default
      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return customer;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  // Get customer's payment methods
  static async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // Delete a payment method
  static async deletePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Create a setup intent for adding payment methods
  static async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session', // For future payments
      });

      return setupIntent;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw error;
    }
  }

  // Extract payment method information for display
  static extractPaymentMethodInfo(paymentMethod: Stripe.PaymentMethod): UserSubscription['paymentMethod'] | null {
    if (paymentMethod.type !== 'card' || !paymentMethod.card) {
      return null;
    }

    return {
      type: 'card',
      last4: paymentMethod.card.last4,
      expiryMonth: paymentMethod.card.exp_month,
      expiryYear: paymentMethod.card.exp_year,
      brand: paymentMethod.card.brand,
    };
  }
}

export default StripeCustomerService;
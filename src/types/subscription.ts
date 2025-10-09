export interface UserSubscription {
  id: string;
  userId: string;
  
  // Plan information
  planId: string;
  planName: string;
  monthlyPrice: number;
  annualPrice?: number;
  
  // User details
  userDetails: {
    email: string;
    firstName?: string;
    lastName?: string;
    userId: string;
  };
  
  // Plan details snapshot (stored to maintain history even if plan changes)
  planDetails: {
    name: string;
    features: string[];
    featureLimits: {
      maxCategories: number;
      maxAccounts: number;
      maxExpenses: number;
      maxIncomes: number;
    };
    monthlyPrice: number;
    annualDiscountPct?: number;
    trialDays: number;
  };
  
  // Subscription dates and status
  startDate: Date;
  endDate: Date;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | 'incomplete' | 'incomplete_expired';
  
  // Trial information
  trialEndDate?: Date;
  isTrialActive: boolean;
  
  // Stripe integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCurrentPeriodStart?: Date;
  stripeCurrentPeriodEnd?: Date;
  
  // Payment information
  paymentMethod?: {
    type: 'card';
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    brand: string; // visa, mastercard, etc.
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Billing information
  nextBillingDate?: Date;
  billingCycle: 'monthly' | 'annual';
  
  // Cancellation information
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface SubscriptionCreateData {
  userId: string;
  planId: string;
  userDetails: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  billingCycle: 'monthly' | 'annual';
  paymentMethodId?: string; // Stripe payment method ID
}

export interface SubscriptionUpdateData {
  status?: UserSubscription['status'];
  endDate?: Date;
  nextBillingDate?: Date;
  paymentMethod?: UserSubscription['paymentMethod'];
  stripeSubscriptionId?: string;
  stripeCurrentPeriodStart?: Date;
  stripeCurrentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
}
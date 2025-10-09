import { UserSubscription } from '@/types/subscription';
import { Plan } from '@/lib/firebase/subscriptionService';

export class SubscriptionUtils {
  // Check if subscription is active
  static isActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    return (
      ['active', 'trialing'].includes(subscription.status) &&
      subscription.endDate > now
    );
  }

  // Check if subscription is in trial period
  static isInTrial(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    return (
      subscription.status === 'trialing' &&
      subscription.isTrialActive &&
      subscription.trialEndDate &&
      subscription.trialEndDate > now
    );
  }

  // Get remaining trial days
  static getTrialDaysRemaining(subscription: UserSubscription | null): number {
    if (!this.isInTrial(subscription)) return 0;
    
    const now = new Date();
    const trialEnd = subscription!.trialEndDate!;
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Get days until subscription expires
  static getDaysUntilExpiry(subscription: UserSubscription | null): number {
    if (!subscription) return 0;
    
    const now = new Date();
    const diffTime = subscription.endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Check if subscription is expiring soon (within 7 days)
  static isExpiringSoon(subscription: UserSubscription | null): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry(subscription);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }

  // Check if subscription is past due
  static isPastDue(subscription: UserSubscription | null): boolean {
    return subscription?.status === 'past_due';
  }

  // Check if subscription is cancelled but still active
  static isCancelledButActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    return (
      subscription.cancelAtPeriodEnd === true &&
      subscription.status === 'active' &&
      this.isActive(subscription)
    );
  }

  // Get subscription status display text
  static getStatusDisplayText(subscription: UserSubscription | null): string {
    if (!subscription) return 'No active subscription';
    
    if (this.isInTrial(subscription)) {
      const daysRemaining = this.getTrialDaysRemaining(subscription);
      return `Trial (${daysRemaining} days remaining)`;
    }
    
    if (this.isCancelledButActive(subscription)) {
      return 'Cancelled (active until period end)';
    }
    
    switch (subscription.status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      case 'incomplete':
        return 'Payment Required';
      case 'incomplete_expired':
        return 'Payment Failed';
      default:
        return 'Unknown';
    }
  }

  // Get subscription status color for UI
  static getStatusColor(subscription: UserSubscription | null): string {
    if (!subscription) return 'gray';
    
    if (this.isInTrial(subscription)) return 'blue';
    if (this.isCancelledButActive(subscription)) return 'orange';
    
    switch (subscription.status) {
      case 'active':
        return 'green';
      case 'trialing':
        return 'blue';
      case 'past_due':
        return 'red';
      case 'cancelled':
      case 'expired':
        return 'gray';
      case 'incomplete':
      case 'incomplete_expired':
        return 'red';
      default:
        return 'gray';
    }
  }

  // Check if user can access feature based on subscription
  static canAccessFeature(
    subscription: UserSubscription | null,
    featureType: 'categories' | 'accounts' | 'expenses' | 'incomes',
    currentCount: number
  ): boolean {
    if (!subscription || !this.isActive(subscription)) {
      // For free users, implement basic limits
      const freeLimits = {
        categories: 5,
        accounts: 2,
        expenses: 50,
        incomes: 20,
      };
      return currentCount < freeLimits[featureType];
    }
    
    const limit = subscription.planDetails.featureLimits[`max${featureType.charAt(0).toUpperCase() + featureType.slice(1)}` as keyof typeof subscription.planDetails.featureLimits];
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return currentCount < limit;
  }

  // Get remaining feature usage
  static getRemainingFeatureUsage(
    subscription: UserSubscription | null,
    featureType: 'categories' | 'accounts' | 'expenses' | 'incomes',
    currentCount: number
  ): number {
    if (!subscription || !this.isActive(subscription)) {
      const freeLimits = {
        categories: 5,
        accounts: 2,
        expenses: 50,
        incomes: 20,
      };
      return Math.max(0, freeLimits[featureType] - currentCount);
    }
    
    const limit = subscription.planDetails.featureLimits[`max${featureType.charAt(0).toUpperCase() + featureType.slice(1)}` as keyof typeof subscription.planDetails.featureLimits];
    
    if (limit === -1) return Infinity;
    
    return Math.max(0, limit - currentCount);
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  // Calculate annual savings
  static calculateAnnualSavings(plan: Plan): number {
    if (!plan.annualDiscountPct || plan.annualDiscountPct <= 0) return 0;
    
    const monthlyAnnual = plan.monthlyPrice * 12;
    const discountedAnnual = monthlyAnnual * (1 - plan.annualDiscountPct / 100);
    
    return monthlyAnnual - discountedAnnual;
  }

  // Get next billing date display
  static getNextBillingDateDisplay(subscription: UserSubscription | null): string {
    if (!subscription || !this.isActive(subscription)) return 'N/A';
    
    if (this.isInTrial(subscription) && subscription.trialEndDate) {
      return `Trial ends ${subscription.trialEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`;
    }
    
    if (subscription.nextBillingDate) {
      return subscription.nextBillingDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    return subscription.endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Check if plan requires payment
  static requiresPayment(plan: Plan): boolean {
    return plan.monthlyPrice > 0;
  }

  // Get plan price for billing cycle
  static getPlanPrice(plan: Plan, billingCycle: 'monthly' | 'annual'): number {
    if (billingCycle === 'monthly') {
      return plan.monthlyPrice;
    }
    
    const annualBase = plan.monthlyPrice * 12;
    return plan.annualDiscountPct 
      ? annualBase * (1 - plan.annualDiscountPct / 100)
      : annualBase;
  }

  // Validate subscription data
  static isValidSubscription(subscription: unknown): subscription is UserSubscription {
    if (!subscription || typeof subscription !== 'object') return false;
    
    const sub = subscription as Record<string, unknown>;
    
    return (
      typeof sub.id === 'string' &&
      typeof sub.userId === 'string' &&
      typeof sub.planId === 'string' &&
      typeof sub.status === 'string' &&
      sub.startDate instanceof Date &&
      sub.endDate instanceof Date
    );
  }
}

export default SubscriptionUtils;
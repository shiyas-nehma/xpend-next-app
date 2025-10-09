import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { UserSubscription, SubscriptionCreateData, SubscriptionUpdateData } from '@/types/subscription';
import { Plan } from './subscriptionService';

const COLLECTION_NAME = 'user_subscriptions';

class FirebaseUserSubscriptionService {
  // Convert Firestore timestamp to Date
  private static firestoreToSubscription(data: Record<string, unknown>, id: string): UserSubscription {
    return {
      ...data,
      id,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      trialEndDate: data.trialEndDate?.toDate() || undefined,
      stripeCurrentPeriodStart: data.stripeCurrentPeriodStart?.toDate() || undefined,
      stripeCurrentPeriodEnd: data.stripeCurrentPeriodEnd?.toDate() || undefined,
      nextBillingDate: data.nextBillingDate?.toDate() || undefined,
      cancelledAt: data.cancelledAt?.toDate() || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  // Convert Date to Firestore timestamp
  private static subscriptionToFirestore(subscription: Partial<UserSubscription>): Record<string, unknown> {
    const data: Record<string, unknown> = {
      ...subscription,
      updatedAt: serverTimestamp(),
    };

    // Convert dates to Firestore timestamps, omitting undefined values
    if (subscription.startDate) {
      data.startDate = Timestamp.fromDate(subscription.startDate);
    }
    if (subscription.endDate) {
      data.endDate = Timestamp.fromDate(subscription.endDate);
    }
    if (subscription.trialEndDate) {
      data.trialEndDate = Timestamp.fromDate(subscription.trialEndDate);
    }
    if (subscription.stripeCurrentPeriodStart) {
      data.stripeCurrentPeriodStart = Timestamp.fromDate(subscription.stripeCurrentPeriodStart);
    }
    if (subscription.stripeCurrentPeriodEnd) {
      data.stripeCurrentPeriodEnd = Timestamp.fromDate(subscription.stripeCurrentPeriodEnd);
    }
    if (subscription.nextBillingDate) {
      data.nextBillingDate = Timestamp.fromDate(subscription.nextBillingDate);
    }
    if (subscription.cancelledAt) {
      data.cancelledAt = Timestamp.fromDate(subscription.cancelledAt);
    }

    return data;
  }

  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'trialing', 'past_due'])
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Return the first active subscription (should only be one)
      const doc = querySnapshot.docs[0];
      return this.firestoreToSubscription(doc.data(), doc.id);
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  // Create new subscription
  static async createSubscription(
    subscriptionData: SubscriptionCreateData, 
    planDetails: Plan
  ): Promise<UserSubscription> {
    try {
      const subscriptionId = doc(collection(db, COLLECTION_NAME)).id;
      
      const now = new Date();
      const trialEndDate = planDetails.trialDays > 0 ? 
        new Date(now.getTime() + planDetails.trialDays * 24 * 60 * 60 * 1000) : 
        null;
      
      const subscription: UserSubscription = {
        id: subscriptionId,
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        planName: planDetails.name,
        monthlyPrice: planDetails.monthlyPrice,
        annualPrice: planDetails.annualDiscountPct ? 
          planDetails.monthlyPrice * 12 * (1 - planDetails.annualDiscountPct / 100) : 
          planDetails.monthlyPrice * 12,
        userDetails: {
          ...subscriptionData.userDetails,
          userId: subscriptionData.userId,
        },
        planDetails: {
          name: planDetails.name,
          features: planDetails.features,
          featureLimits: planDetails.featureLimits,
          monthlyPrice: planDetails.monthlyPrice,
          annualDiscountPct: planDetails.annualDiscountPct,
          trialDays: planDetails.trialDays,
        },
        startDate: now,
        endDate: trialEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        status: planDetails.trialDays > 0 ? 'trialing' : 'active',
        trialEndDate: trialEndDate, // Will be null if no trial
        isTrialActive: planDetails.trialDays > 0,
        billingCycle: subscriptionData.billingCycle,
        nextBillingDate: trialEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      };

      const firestoreData = this.subscriptionToFirestore(subscription);
      firestoreData.createdAt = serverTimestamp();
      
      await setDoc(doc(db, COLLECTION_NAME, subscriptionId), firestoreData);
      
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(
    subscriptionId: string, 
    updateData: SubscriptionUpdateData
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, subscriptionId);
      const firestoreData = this.subscriptionToFirestore(updateData);
      
      await updateDoc(docRef, firestoreData);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription (mark for cancellation at period end)
  static async cancelSubscription(
    subscriptionId: string, 
    reason?: string
  ): Promise<void> {
    try {
      await this.updateSubscription(subscriptionId, {
        cancelAtPeriodEnd: true,
        cancellationReason: reason,
        cancelledAt: new Date(),
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Immediately cancel subscription
  static async immediatelyCancelSubscription(
    subscriptionId: string, 
    reason?: string
  ): Promise<void> {
    try {
      await this.updateSubscription(subscriptionId, {
        status: 'cancelled',
        endDate: new Date(),
        cancelAtPeriodEnd: false,
        cancellationReason: reason,
        cancelledAt: new Date(),
      });
    } catch (error) {
      console.error('Error immediately cancelling subscription:', error);
      throw error;
    }
  }

  // Get subscription by ID
  static async getSubscriptionById(subscriptionId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, subscriptionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.firestoreToSubscription(docSnap.data(), docSnap.id);
    } catch (error) {
      console.error('Error getting subscription by ID:', error);
      throw error;
    }
  }

  // Get subscription by Stripe subscription ID
  static async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('stripeSubscriptionId', '==', stripeSubscriptionId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return this.firestoreToSubscription(doc.data(), doc.id);
    } catch (error) {
      console.error('Error getting subscription by Stripe ID:', error);
      throw error;
    }
  }

  // Real-time subscription listener
  static onSubscriptionChange(
    userId: string, 
    callback: (subscription: UserSubscription | null) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'trialing', 'past_due'])
    );

    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
        return;
      }
      
      const doc = querySnapshot.docs[0];
      const subscription = this.firestoreToSubscription(doc.data(), doc.id);
      callback(subscription);
    }, (error) => {
      console.error('Error in subscription listener:', error);
      callback(null);
    });
  }

  // Utility function to check if subscription is active
  static isSubscriptionActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    return (
      ['active', 'trialing'].includes(subscription.status) &&
      subscription.endDate > now
    );
  }

  // Utility function to check if subscription is in trial
  static isSubscriptionInTrial(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    return (
      subscription.status === 'trialing' &&
      subscription.isTrialActive &&
      subscription.trialEndDate &&
      subscription.trialEndDate > now
    );
  }

  // Get trial days remaining
  static getTrialDaysRemaining(subscription: UserSubscription | null): number {
    if (!subscription || !this.isSubscriptionInTrial(subscription)) return 0;
    
    const now = new Date();
    const trialEnd = subscription.trialEndDate!;
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
}

export default FirebaseUserSubscriptionService;
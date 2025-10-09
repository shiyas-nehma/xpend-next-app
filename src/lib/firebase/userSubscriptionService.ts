import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { UserSubscription, SubscriptionCreateData, SubscriptionUpdateData } from '@/types/subscription';
import { Plan } from './subscriptionService';
import ActiveUserSubscriptionService from './activeUserSubscriptionService';
import PaymentDetailsService from './paymentDetailsService';

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
      updatedAt: serverTimestamp(),
    };

    // Copy non-date fields, filtering out undefined values
    Object.entries(subscription).forEach(([key, value]) => {
      if (value !== undefined && !['startDate', 'endDate', 'trialEndDate', 'stripeCurrentPeriodStart', 'stripeCurrentPeriodEnd', 'nextBillingDate', 'cancelledAt', 'createdAt', 'updatedAt'].includes(key)) {
        data[key] = value;
      }
    });

    // Convert dates to Firestore timestamps, only if they exist and are not null/undefined
    if (subscription.startDate instanceof Date) {
      data.startDate = Timestamp.fromDate(subscription.startDate);
    }
    if (subscription.endDate instanceof Date) {
      data.endDate = Timestamp.fromDate(subscription.endDate);
    }
    if (subscription.trialEndDate instanceof Date) {
      data.trialEndDate = Timestamp.fromDate(subscription.trialEndDate);
    } else if (subscription.trialEndDate === null) {
      data.trialEndDate = null; // Explicitly set null for no trial
    }
    if (subscription.stripeCurrentPeriodStart instanceof Date) {
      data.stripeCurrentPeriodStart = Timestamp.fromDate(subscription.stripeCurrentPeriodStart);
    }
    if (subscription.stripeCurrentPeriodEnd instanceof Date) {
      data.stripeCurrentPeriodEnd = Timestamp.fromDate(subscription.stripeCurrentPeriodEnd);
    }
    if (subscription.nextBillingDate instanceof Date) {
      data.nextBillingDate = Timestamp.fromDate(subscription.nextBillingDate);
    }
    if (subscription.cancelledAt instanceof Date) {
      data.cancelledAt = Timestamp.fromDate(subscription.cancelledAt);
    }
    if (subscription.createdAt instanceof Date) {
      data.createdAt = Timestamp.fromDate(subscription.createdAt);
    }

    return data;
  }

    // Get user's current/latest subscription (most recent one)
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      console.log('Getting latest subscription for user:', userId);
      
      // First try to get from active_user_subscriptions (most efficient)
      const activeSubscription = await ActiveUserSubscriptionService.getActiveSubscription(userId);
      if (activeSubscription) {
        console.log('Found active subscription:', activeSubscription.id);
        return activeSubscription;
      }
      
      // Fallback: Query all user subscriptions and get the most recent one
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
        // Removed orderBy to avoid index requirement - we'll sort in memory
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No subscriptions found for user:', userId);
        return null;
      }
      
      // Filter and sort in memory to get the latest subscription
      const subscriptions = querySnapshot.docs
        .map(doc => this.firestoreToSubscription(doc.data(), doc.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const latestSubscription = subscriptions[0];
      
      console.log('Found latest subscription from query (memory sorted):', latestSubscription.id);
      
      // If this subscription is active but not in active_user_subscriptions, sync it
      if (['active', 'trialing'].includes(latestSubscription.status)) {
        try {
          await ActiveUserSubscriptionService.setActiveSubscription(userId, latestSubscription);
          console.log('Synced latest subscription to active_user_subscriptions');
        } catch (syncError) {
          console.warn('Could not sync to active_user_subscriptions:', syncError);
        }
      }
      
      return latestSubscription;
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
      console.log('Creating subscription for user:', subscriptionData.userId);
      
      // First, ensure we clean up any existing active subscriptions for this user
      await this.ensureUserHasOnlyOneActiveSubscription(subscriptionData.userId);
      
      // Also deactivate any existing active subscription in the active_user_subscriptions table
      try {
        const existingActiveSubscription = await ActiveUserSubscriptionService.getActiveSubscription(subscriptionData.userId);
        if (existingActiveSubscription) {
          console.log('Found existing active subscription, will be replaced with new one');
          // The new subscription will automatically replace it since we use userId as document ID
        }
      } catch (activeCheckError) {
        console.warn('Could not check existing active subscription:', activeCheckError);
      }
      
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
      
      // 1. Create subscription in main user_subscriptions table
      await setDoc(doc(db, COLLECTION_NAME, subscriptionId), firestoreData);
      console.log('✅ 1. Created subscription in user_subscriptions table:', subscriptionId);
      
      // 2. Update active_user_subscriptions table (unique userId with latest subscription)
      try {
        if (['active', 'trialing'].includes(subscription.status)) {
          await ActiveUserSubscriptionService.setActiveSubscription(subscription.userId, subscription);
          console.log('✅ 2. Updated active_user_subscriptions table with LATEST subscription for userId:', subscription.userId);
          console.log('   - New active subscription ID:', subscription.id);
          console.log('   - Plan:', subscription.planName);
          console.log('   - Status:', subscription.status);
        }
      } catch (activeError) {
        console.error('❌ Error updating active subscription collection:', activeError);
        // Don't fail the main subscription creation if active collection update fails
      }
      
      // 3. Create payment record in payment_details table
      try {
        const paymentAmount = planDetails.monthlyPrice || 0; // Free plans have 0 amount
        const paymentRecord = await PaymentDetailsService.createPayment({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          paymentAmount,
          currency: 'usd',
          modeOfPayment: paymentAmount === 0 ? 'other' : 'pending', // 'pending' for paid plans until Stripe processes
          paymentStatus: paymentAmount === 0 ? 'completed' : 'pending',
          userDetails: subscription.userDetails,
          planName: planDetails.name,
          billingCycle: subscription.billingCycle,
          description: `Subscription created: ${planDetails.name}`,
        });
        console.log('✅ 3. Created payment record in payment_details table:', paymentRecord.id);
      } catch (paymentError) {
        console.error('❌ Error creating payment record:', paymentError);
        // Don't fail the main subscription creation if payment record creation fails
      }
      
      console.log('🎉 Successfully created subscription with all 3 tables updated:', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        planName: subscription.planName,
        status: subscription.status
      });
      
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
      
      // 1. Update main subscription record
      await updateDoc(docRef, firestoreData);
      console.log('✅ Updated subscription in user_subscriptions table:', subscriptionId);
      
      // 2. Update active subscription table based on status change
      try {
        const updatedDoc = await getDoc(docRef);
        if (updatedDoc.exists()) {
          const updatedSubscription = this.firestoreToSubscription(updatedDoc.data(), updatedDoc.id);
          
          // Update active subscription collection based on status
          if (['active', 'trialing'].includes(updatedSubscription.status)) {
            await ActiveUserSubscriptionService.setActiveSubscription(updatedSubscription.userId, updatedSubscription);
            console.log('✅ Updated active subscription collection for user:', updatedSubscription.userId);
          } else if (['cancelled', 'expired'].includes(updatedSubscription.status)) {
            await ActiveUserSubscriptionService.removeActiveSubscription(updatedSubscription.userId);
            console.log('✅ Removed active subscription for user:', updatedSubscription.userId);
          }
        }
      } catch (activeError) {
        console.error('❌ Error updating active subscription collection:', activeError);
        // Don't fail the main update if active collection update fails
      }
      
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
    // Simplified query to avoid composite index requirement
    // We'll filter by userId first, then sort in memory
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
      // Removed orderBy and status filter to avoid composite index requirement
    );

    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
        return;
      }
      
      // Filter and sort in memory to get the latest active subscription
      const subscriptions = querySnapshot.docs
        .map(doc => this.firestoreToSubscription(doc.data(), doc.id))
        .filter(sub => ['active', 'trialing', 'past_due'].includes(sub.status))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const latestSubscription = subscriptions[0] || null;
      
      if (latestSubscription) {
        console.log('Latest subscription from listener (memory filtered):', {
          id: latestSubscription.id,
          planName: latestSubscription.planName,
          createdAt: latestSubscription.createdAt,
          status: latestSubscription.status
        });
      }
      
      callback(latestSubscription);
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

  // Ensure user has only one active subscription (cleanup utility)
  static async ensureUserHasOnlyOneActiveSubscription(userId: string): Promise<void> {
    try {
      console.log('Ensuring user has only one active subscription:', userId);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'trialing'])
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.docs.length <= 1) {
        console.log(`User ${userId} has ${querySnapshot.docs.length} active subscription(s) - no cleanup needed`);
        return;
      }
      
      console.log(`User ${userId} has ${querySnapshot.docs.length} active subscriptions - cleaning up duplicates`);
      
      // Keep the most recent subscription, cancel the others
      const subscriptions = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
      
      const keepSubscription = subscriptions[0];
      const cancelSubscriptions = subscriptions.slice(1);
      
      console.log(`Keeping subscription ${keepSubscription.id}, cancelling ${cancelSubscriptions.length} others`);
      
      // Cancel older subscriptions
      for (const sub of cancelSubscriptions) {
        await this.updateSubscription(sub.id, {
          status: 'cancelled',
          endDate: new Date(),
          cancellationReason: 'Duplicate subscription cleanup - newer subscription created',
          cancelledAt: new Date(),
        });
      }
      
      // Update active_user_subscriptions table with the latest subscription
      if (keepSubscription && ['active', 'trialing'].includes(keepSubscription.status)) {
        try {
          const latestSubscription = await this.getSubscriptionById(keepSubscription.id);
          if (latestSubscription) {
            await ActiveUserSubscriptionService.setActiveSubscription(userId, latestSubscription);
            console.log(`Updated active_user_subscriptions table with latest subscription: ${keepSubscription.id}`);
          }
        } catch (activeUpdateError) {
          console.error('Error updating active subscription table during cleanup:', activeUpdateError);
        }
      }
      
      console.log(`Cleanup completed for user ${userId}`);
    } catch (error) {
      console.error('Error in cleanup:', error);
      // Don't throw error as this is a cleanup utility
    }
  }
}

export default FirebaseUserSubscriptionService;
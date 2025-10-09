import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { UserSubscription, SubscriptionUpdateData } from '@/types/subscription';

const COLLECTION_NAME = 'active_user_subscriptions';

/**
 * ActiveUserSubscriptionService
 * 
 * Manages the active_user_subscriptions collection where:
 * - Document ID = userId (ensures unique constraint)
 * - Contains only the user's currently active subscription
 * - Automatically synced when main subscription changes
 */
class ActiveUserSubscriptionService {
  
  // Convert Firestore data to UserSubscription object
  private static firestoreToSubscription(data: Record<string, unknown>, id: string): UserSubscription {
    return {
      id,
      userId: data.userId,
      planId: data.planId,
      planName: data.planName,
      monthlyPrice: data.monthlyPrice,
      annualPrice: data.annualPrice,
      userDetails: data.userDetails,
      planDetails: data.planDetails,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      status: data.status,
      trialEndDate: data.trialEndDate?.toDate() || null,
      isTrialActive: data.isTrialActive || false,
      billingCycle: data.billingCycle || 'monthly',
      nextBillingDate: data.nextBillingDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCurrentPeriodStart: data.stripeCurrentPeriodStart?.toDate() || null,
      stripeCurrentPeriodEnd: data.stripeCurrentPeriodEnd?.toDate() || null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      cancellationReason: data.cancellationReason,
      cancelledAt: data.cancelledAt?.toDate() || null,
    };
  }

  // Convert UserSubscription to Firestore data
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

  // Get user's active subscription (only one per user)
  static async getActiveSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.firestoreToSubscription(docSnap.data(), docSnap.id);
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  }

  // Set/Update user's active subscription (replaces any existing)
  static async setActiveSubscription(userId: string, subscription: UserSubscription): Promise<void> {
    try {
      console.log('Setting active subscription for user:', userId);
      
      const firestoreData = this.subscriptionToFirestore({
        ...subscription,
        userId, // Ensure userId is set
      });
      
      // Only set createdAt if it's a new document
      const docRef = doc(db, COLLECTION_NAME, userId);
      const existingDoc = await getDoc(docRef);
      
      if (!existingDoc.exists()) {
        firestoreData.createdAt = serverTimestamp();
      }
      
      // Use userId as document ID for unique constraint
      await setDoc(docRef, firestoreData, { merge: true });
      
      console.log('Active subscription set successfully for user:', userId);
    } catch (error) {
      console.error('Error setting active subscription:', error);
      throw error;
    }
  }

  // Update user's active subscription
  static async updateActiveSubscription(userId: string, updateData: SubscriptionUpdateData): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const firestoreData = this.subscriptionToFirestore(updateData);
      
      await updateDoc(docRef, firestoreData);
      
      console.log('Active subscription updated for user:', userId);
    } catch (error) {
      console.error('Error updating active subscription:', error);
      throw error;
    }
  }

  // Remove user's active subscription
  static async removeActiveSubscription(userId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      await deleteDoc(docRef);
      
      console.log('Active subscription removed for user:', userId);
    } catch (error) {
      console.error('Error removing active subscription:', error);
      throw error;
    }
  }

  // Real-time listener for user's active subscription
  static onActiveSubscriptionChange(
    userId: string, 
    callback: (subscription: UserSubscription | null) => void
  ): () => void {
    console.log('Setting up active subscription listener for userId:', userId);
    
    const docRef = doc(db, COLLECTION_NAME, userId);
    
    return onSnapshot(docRef, (docSnapshot) => {
      console.log('Active subscription listener fired for user:', userId);
      
      if (!docSnapshot.exists()) {
        console.log('No active subscription found for user:', userId);
        callback(null);
        return;
      }
      
      const subscription = this.firestoreToSubscription(docSnapshot.data(), docSnapshot.id);
      
      console.log('Found active subscription:', {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        userId: subscription.userId
      });
      
      callback(subscription);
    }, (error) => {
      console.error('Error in active subscription listener:', error);
      callback(null);
    });
  }

  // Check if user has an active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      return subscription !== null && ['active', 'trialing'].includes(subscription.status);
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  // Get subscription status for user
  static async getSubscriptionStatus(userId: string): Promise<string | null> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      return subscription?.status || null;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }
}

export default ActiveUserSubscriptionService;
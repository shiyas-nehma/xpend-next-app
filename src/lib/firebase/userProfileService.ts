import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config.js';
import { getCurrentUser } from './auth';
import FirebaseUserSubscriptionService from './userSubscriptionService';

export interface UserExtraProfile {
  userId: string;
  username: string;
  currency: string;        // e.g. 'USD'
  currencySymbol: string;  // e.g. '$'
  bio: string;
  updatedAt: string;
  createdAt: string;
}

const collectionName = 'user_profiles';

export const getUserExtraProfile = async (): Promise<UserExtraProfile | null> => {
  const user = getCurrentUser();
  if (!user) return null;
  const ref = doc(db, collectionName, user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserExtraProfile;
};

export const upsertUserExtraProfile = async (data: Partial<UserExtraProfile>): Promise<UserExtraProfile> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const ref = doc(db, collectionName, user.uid);
  const now = new Date().toISOString();
  const existingSnap = await getDoc(ref);
  if (existingSnap.exists()) {
    const update = { ...data, updatedAt: now };
    await updateDoc(ref, update as any);
    return { ...(existingSnap.data() as UserExtraProfile), ...update };
  } else {
    const base: UserExtraProfile = {
      userId: user.uid,
      username: data.username || `@${user.displayName?.toLowerCase().replace(/\s+/g,'') || 'user'}`,
      currency: data.currency || 'USD',
      currencySymbol: data.currencySymbol || '$',
      bio: data.bio || '',
      createdAt: now,
      updatedAt: now
    };
    await setDoc(ref, base);
    return base;
  }
};

// Function to update subscription fields in the users collection
// This runs on the client side with proper authentication
export const updateUserSubscriptionFields = async (subscriptionData: {
  subscription_plan_id: string;
  subscription_status: string;
  expiry_date: string;
}): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  console.log('Updating user subscription fields for user:', user.uid);
  console.log('Subscription data:', subscriptionData);
  
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  
  const updateData = {
    subscription_plan_id: subscriptionData.subscription_plan_id,
    subscription_status: subscriptionData.subscription_status,
    expiry_date: subscriptionData.expiry_date,
    updatedAt: now
  };
  
  await updateDoc(userRef, updateData);
  console.log('✅ Successfully updated user subscription fields');
};

// Function to sync user table with current subscription data
// This should be called after payment completion to ensure user table is updated
export const syncUserTableWithCurrentSubscription = async (): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  console.log('Syncing user table with current subscription data for user:', user.uid);
  
  try {
    // Get current subscription
    const currentSubscription = await FirebaseUserSubscriptionService.getUserSubscription(user.uid);
    
    if (!currentSubscription) {
      console.log('No subscription found, clearing subscription data from users table');
      
      // Clear subscription data from users table
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        subscription_plan_id: '',
        subscription_status: '',
        expiry_date: '',
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updateData);
      console.log('✅ Cleared subscription data from users table');
      return;
    }
    
    // Update users table with current subscription data
    const subscriptionData = {
      subscription_plan_id: currentSubscription.planId,
      subscription_status: currentSubscription.status,
      expiry_date: currentSubscription.endDate.toISOString(),
    };
    
    await updateUserSubscriptionFields(subscriptionData);
    console.log('✅ Successfully synced user table with current subscription data');
    
  } catch (error) {
    console.error('❌ Error syncing user table with current subscription:', error);
    throw error;
  }
};

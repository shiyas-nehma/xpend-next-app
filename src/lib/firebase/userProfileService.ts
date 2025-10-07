import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config.js';
import { getCurrentUser } from './auth';

export interface UserExtraProfile {
  uid: string;
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
      uid: user.uid,
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

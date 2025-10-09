// Server-side subscription service using Firebase Client SDK
// For development - uses client SDK on server side to bypass rules

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, query, orderBy, getDocs } from 'firebase/firestore';
import type { Plan, PlanCreateInput } from './subscriptionService';

// Firebase config for server-side usage
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for server-side if not already initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig, 'server');
} else {
  app = getApps().find(a => a.name === 'server') || getApps()[0];
}

const db = getFirestore(app);
const COLLECTION = 'subscription_plans';

// Convert Firestore document to Plan object
function toPlan(id: string, data: any): Plan {
  return {
    id,
    name: data.name,
    monthlyPrice: data.monthlyPrice,
    annualDiscountPct: data.annualDiscountPct || 0,
    features: data.features || [],
    featureLimits: data.featureLimits,
    status: data.status,
    subscribers: data.subscribers || 0,
    trialDays: data.trialDays || 0,
    maxDuration: data.maxDuration,
    durationType: data.durationType,
    highlight: data.highlight,
    sortOrder: data.sortOrder || 0,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
}

export const AdminSubscriptionPlanService = {
  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      console.log('Admin: getPlanById called with planId:', planId);
      
      const docRef = doc(db, COLLECTION, planId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('Admin: Plan not found for ID:', planId);
        return null;
      }
      
      const plan = toPlan(docSnap.id, docSnap.data());
      console.log('Admin: Plan found:', plan.name);
      return plan;
    } catch (error) {
      console.error('Admin: Error in getPlanById:', error);
      throw error;
    }
  },

  async createPlan(input: PlanCreateInput): Promise<string> {
    try {
      console.log('Admin: Creating plan:', input.name);
      
      const docRef = doc(collection(db, COLLECTION));
      
      const data = {
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(docRef, data);
      
      console.log('Admin: Plan created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Admin: Error creating plan:', error);
      throw error;
    }
  },

  async listPlans(): Promise<Plan[]> {
    try {
      console.log('Admin: Listing all plans');
      
      const q = query(collection(db, COLLECTION), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      
      const plans = snapshot.docs.map(doc => toPlan(doc.id, doc.data()));
      
      console.log('Admin: Found plans:', plans.length);
      return plans;
    } catch (error) {
      console.error('Admin: Error listing plans:', error);
      throw error;
    }
  },
};
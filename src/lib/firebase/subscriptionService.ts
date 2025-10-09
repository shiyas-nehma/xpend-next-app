"use client";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './config.js';

// Types mirrored from existing subscription page
export interface FeatureLimits {
  maxCategories: number;
  maxIncomes: number;
  maxExpenses: number;
  maxAccounts: number;
  maxBudgets: number;
  analyticsAccess: boolean;
  reportGeneration: boolean;
  dataExport: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
}

export interface Plan {
  id: string; // Firestore document id
  name: string;
  monthlyPrice: number;
  annualDiscountPct?: number;
  features: string[];
  featureLimits: FeatureLimits;
  status: 'active' | 'draft' | 'deprecated';
  subscribers: number; // current active subscribers count (denormalized)
  trialDays: number;
  maxDuration: number; // numeric duration tied to durationType
  durationType: 'days' | 'months' | 'years';
  highlight?: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PlanCreateInput = Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>> & { name: string };
export type PlanUpdateInput = Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>>;

const COLLECTION = 'subscription_plans';

// Default feature limits (mirrors previous modal defaults)
export const defaultFeatureLimits: FeatureLimits = {
  maxCategories: 10,
  maxIncomes: 50,
  maxExpenses: 50,
  maxAccounts: 5,
  maxBudgets: 10,
  analyticsAccess: false,
  reportGeneration: true,
  dataExport: false,
  apiAccess: false,
  prioritySupport: false,
  customIntegrations: false,
};

const toPlan = (id: string, data: any): Plan => ({
  id,
  name: data.name,
  monthlyPrice: data.monthlyPrice,
  annualDiscountPct: data.annualDiscountPct,
  features: data.features || [],
  featureLimits: data.featureLimits || defaultFeatureLimits,
  status: data.status || 'draft',
  subscribers: data.subscribers ?? 0,
  trialDays: data.trialDays ?? 0,
  maxDuration: data.maxDuration ?? 30,
  durationType: data.durationType || 'days',
  highlight: data.highlight,
  sortOrder: data.sortOrder ?? 0,
  createdAt: data.createdAt?.toDate?.() || undefined,
  updatedAt: data.updatedAt?.toDate?.() || undefined,
});

export const SubscriptionPlanService = {
  onPlansChange(callback: (plans: Plan[]) => void) {
    const q = query(collection(db, COLLECTION), orderBy('sortOrder', 'asc'));
    return onSnapshot(q, snap => {
      const results: Plan[] = [];
      snap.forEach(d => {
        try { results.push(toPlan(d.id, d.data())); } catch (e) { /* swallow bad doc */ }
      });
      // Fallback sort if field missing
      results.sort((a,b) => a.sortOrder - b.sortOrder);
      callback(results);
    }, err => {
      console.error('[SubscriptionPlanService] listener error', err);
      callback([]);
    });
  },

  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      console.log('getPlanById called with planId:', planId);
      console.log('Using collection:', COLLECTION);
      
      const docRef = doc(db, COLLECTION, planId);
      console.log('Document reference created');
      
      const docSnap = await getDoc(docRef);
      console.log('Document fetch completed, exists:', docSnap.exists());
      
      if (!docSnap.exists()) {
        console.log('Plan not found for ID:', planId);
        return null;
      }
      
      const plan = toPlan(docSnap.id, docSnap.data());
      console.log('Plan converted successfully:', plan?.name);
      return plan;
    } catch (error) {
      console.error('Error in getPlanById:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error code:', (error as any)?.code);
      throw error; // Re-throw to propagate the error
    }
  },

  async createPlan(input: PlanCreateInput): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: input.name,
      monthlyPrice: input.monthlyPrice ?? 0,
      annualDiscountPct: input.annualDiscountPct ?? 0,
      features: input.features || [],
      featureLimits: input.featureLimits || defaultFeatureLimits,
      status: input.status || 'draft',
      subscribers: input.subscribers ?? 0,
      trialDays: input.trialDays ?? 0,
      maxDuration: input.maxDuration ?? 30,
      durationType: input.durationType || 'days',
      highlight: !!input.highlight,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updatePlan(id: string, input: PlanUpdateInput): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    const update: any = { updatedAt: Timestamp.now() };
    for (const [k,v] of Object.entries(input)) {
      if (v !== undefined) update[k] = v;
    }
    await updateDoc(ref, update);
  },

  async deletePlan(id: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
  },
};

// Optional seeding helper (call manually if needed)
export const seedDefaultPlans = async () => {
  const base: PlanCreateInput[] = [
    {
      name: 'Basic', monthlyPrice: 9.99, annualDiscountPct: 20,
      features: ['Up to 5 categories','Up to 50 transactions/month','Basic reports','Email support'],
      featureLimits: { ...defaultFeatureLimits, maxCategories: 5, maxAccounts: 3, maxIncomes: 25, maxExpenses: 25, analyticsAccess: false, dataExport: false, prioritySupport: false },
      status: 'active', subscribers: 0, trialDays: 7, maxDuration: 30, durationType: 'days', sortOrder: 1
    },
    {
      name: 'Pro', monthlyPrice: 19.99, annualDiscountPct: 25,
      features: ['Unlimited categories','Unlimited transactions','Advanced analytics','Priority support','Data export'],
      featureLimits: { ...defaultFeatureLimits, maxCategories: -1, maxIncomes: -1, maxExpenses: -1, maxAccounts: 10, maxBudgets: -1, analyticsAccess: true, dataExport: true, prioritySupport: true },
      status: 'active', subscribers: 0, trialDays: 14, maxDuration: 12, durationType: 'months', sortOrder: 2, highlight: true
    },
    {
      name: 'Enterprise', monthlyPrice: 59, annualDiscountPct: 30,
      features: ['All Pro features','API access','Custom integrations','24/7 phone support','Dedicated account manager'],
      featureLimits: { ...defaultFeatureLimits, maxCategories: -1, maxIncomes: -1, maxExpenses: -1, maxAccounts: -1, maxBudgets: -1, analyticsAccess: true, dataExport: true, apiAccess: true, customIntegrations: true, prioritySupport: true },
      status: 'draft', subscribers: 0, trialDays: 21, maxDuration: 1, durationType: 'years', sortOrder: 3
    }
  ];
  for (const p of base) await SubscriptionPlanService.createPlan(p);
};

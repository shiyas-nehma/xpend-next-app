"use client";

import { useState } from 'react';
import { SubscriptionPlanService, seedDefaultPlans, PlanCreateInput } from '@/lib/firebase/subscriptionService';

export default function PlansDebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const createFreePlan = async () => {
    setLoading(true);
    try {
      const freePlan: PlanCreateInput = {
        name: 'Free',
        monthlyPrice: 0,
        annualDiscountPct: 0,
        features: ['Up to 3 categories', 'Up to 10 transactions/month', 'Basic reports'],
        featureLimits: {
          maxCategories: 3,
          maxIncomes: 5,
          maxExpenses: 5,
          maxAccounts: 1,
          maxBudgets: 1,
          analyticsAccess: false,
          reportGeneration: false,
          dataExport: false,
          apiAccess: false,
          prioritySupport: false,
          customIntegrations: false,
        },
        status: 'active' as const,
        subscribers: 0,
        trialDays: 0,
        maxDuration: 365,
        durationType: 'days' as const,
        sortOrder: 0,
      };

      const planId = await SubscriptionPlanService.createPlan(freePlan);
      setResult(`Free plan created with ID: ${planId}`);
    } catch (error) {
      setResult(`Error creating free plan: ${error}`);
    }
    setLoading(false);
  };

  const seedAllPlans = async () => {
    setLoading(true);
    try {
      // First create the free plan
      await createFreePlan();
      
      // Then seed the default plans
      await seedDefaultPlans();
      setResult('All plans seeded successfully!');
    } catch (error) {
      setResult(`Error seeding plans: ${error}`);
    }
    setLoading(false);
  };

  const listPlans = async () => {
    setLoading(true);
    try {
      const plans = await new Promise((resolve, reject) => {
        const unsubscribe = SubscriptionPlanService.onPlansChange(
          (plans) => {
            unsubscribe();
            resolve(plans);
          },
          (error) => {
            unsubscribe();
            reject(error);
          }
        );
      });
      
      setResult(`Found ${(plans as any[]).length} plans: ${JSON.stringify(plans, null, 2)}`);
    } catch (error) {
      setResult(`Error listing plans: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Plans Debug Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={createFreePlan}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Create Free Plan
        </button>
        
        <button
          onClick={seedAllPlans}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Seed All Plans
        </button>
        
        <button
          onClick={listPlans}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          List Plans
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
}
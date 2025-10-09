"use client";

import { useState, useEffect } from 'react';
import { SubscriptionPlanService, PlanCreateInput } from '@/lib/firebase/subscriptionService';

export default function APITestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    // Load plans on component mount
    const unsubscribe = SubscriptionPlanService.onPlansChange(
      (loadedPlans) => {
        console.log('Plans loaded:', loadedPlans);
        setPlans(loadedPlans);
      },
      (error) => {
        console.error('Error loading plans:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const createTestPlans = async () => {
    setLoading(true);
    try {
      console.log('Creating test plans...');
      
      // Create a free plan
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
      console.log('Free plan created with ID:', planId);
      
      setResult(`Free plan created with ID: ${planId}`);
    } catch (error) {
      console.error('Error creating plans:', error);
      setResult(`Error creating plans: ${error}`);
    }
    setLoading(false);
  };

  const testAPIWithFirstPlan = async () => {
    if (plans.length === 0) {
      setResult('No plans available. Create plans first.');
      return;
    }

    setLoading(true);
    try {
      const firstPlan = plans[0];
      console.log('=== Testing API with plan ===');
      console.log('Using plan:', firstPlan);
      
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          userId: 'test-user-' + Date.now(),
          planId: firstPlan.id,
          billingCycle: 'monthly',
          userDetails: {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response text:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        data = { error: 'Invalid JSON response', rawResponse: text };
      }
      
      console.log('Parsed response data:', data);
      
      setResult(`Status: ${response.status}\nHeaders: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}\nType: ${typeof error}\nStack: ${error instanceof Error ? error.stack : 'No stack'}`);
    }
    setLoading(false);
  };

  const listPlans = async () => {
    setResult(`Found ${plans.length} plans:\n${JSON.stringify(plans, null, 2)}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current plans: {plans.length}</p>
        {plans.map((plan, idx) => (
          <div key={plan.id} className="text-xs text-gray-500">
            {idx + 1}. {plan.name} (${plan.monthlyPrice}) - {plan.id}
          </div>
        ))}
      </div>
      
      <div className="space-y-4">
        <button
          onClick={createTestPlans}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Create Test Plans
        </button>
        
        <button
          onClick={listPlans}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Show Plans Details
        </button>
        
        <button
          onClick={testAPIWithFirstPlan}
          disabled={loading || plans.length === 0}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Test Subscription API
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-xs max-h-96 overflow-y-auto">{result}</pre>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
}
import { NextRequest, NextResponse } from 'next/server';
import { AdminSubscriptionPlanService } from '@/lib/firebase/adminSubscriptionService';

export async function GET() {
  try {
    console.log('=== Health Check API Called ===');
    console.log('Server is responding!');
    
    // Test listing plans with admin service
    const plans = await AdminSubscriptionPlanService.listPlans();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      plansCount: plans.length,
      plans: plans.map(p => ({ id: p.id, name: p.name, price: p.monthlyPrice }))
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('=== Test Plan Creation API Called ===');
    
    // First try to list existing plans
    try {
      const existingPlans = await AdminSubscriptionPlanService.listPlans();
      console.log('Existing plans found:', existingPlans.length);
      
      if (existingPlans.length > 0) {
        return NextResponse.json({
          status: 'plans_exist',
          plansCount: existingPlans.length,
          plans: existingPlans.map(p => ({ id: p.id, name: p.name, price: p.monthlyPrice })),
          message: 'Plans already exist, no need to create'
        });
      }
    } catch (listError) {
      console.log('Could not list plans (expected due to permissions):', String(listError));
    }
    
    // Create a test plan
    const planId = await AdminSubscriptionPlanService.createPlan({
      name: 'API Test Plan',
      monthlyPrice: 0,
      annualDiscountPct: 0,
      features: ['API created', 'Test feature'],
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
    });
    
    return NextResponse.json({
      status: 'created',
      planId: planId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Plan creation error:', error);
    return NextResponse.json({
      status: 'error',
      error: String(error),
      errorCode: (error as any)?.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
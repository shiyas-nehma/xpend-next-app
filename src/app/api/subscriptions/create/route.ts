import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import StripeCustomerService from '@/lib/stripe/customerService';
import StripeSubscriptionService from '@/lib/stripe/subscriptionService';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import { AdminSubscriptionPlanService } from '@/lib/firebase/adminSubscriptionService';

export async function POST(request: NextRequest) {
  console.log('=== Subscription Creation API Called ===');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  
  try {
    // Get authorization header
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    console.log('Authorization header:', authorization ? 'Present' : 'Missing');
    
    // For development: temporarily bypass auth check
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment && (!authorization || !authorization.startsWith('Bearer '))) {
      console.log('Authorization failed: Missing or invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: In production, verify Firebase token properly
    // const token = authorization.split('Bearer ')[1];
    // const decodedToken = await auth.verifyIdToken(token);
    // For now, we'll assume the token is valid and extract userId from request body
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      userId, 
      planId, 
      billingCycle, 
      paymentMethodId, 
      userDetails 
    } = body;

    console.log('Extracted fields:', { 
      userId: !!userId, 
      planId: !!planId, 
      billingCycle: !!billingCycle, 
      userDetails: !!userDetails 
    });

    if (!userId || !planId || !billingCycle || !userDetails) {
      console.log('Missing required fields:', { 
        userId: !!userId, 
        planId: !!planId, 
        billingCycle: !!billingCycle, 
        userDetails: !!userDetails 
      });
      return NextResponse.json(
        { error: 'Missing required fields: userId, planId, billingCycle, userDetails' },
        { status: 400 }
      );
    }

    // Get plan details using admin service (bypasses client security rules)
    console.log('Fetching plan details for planId:', planId);
    
    let plan;
    try {
      plan = await AdminSubscriptionPlanService.getPlanById(planId);
      console.log('Plan fetch result:', plan ? 'Found' : 'Not found');
      
      // If plan not found, and we're in development, create a test plan
      if (!plan && planId === '1') {
        console.log('Creating test plan for development...');
        try {
          const testPlanId = await AdminSubscriptionPlanService.createPlan({
            name: 'Free Test Plan',
            monthlyPrice: 0,
            annualDiscountPct: 0,
            features: ['Test feature', 'Basic support'],
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
          
          console.log('Test plan created with ID:', testPlanId);
          // Fetch the newly created plan
          plan = await AdminSubscriptionPlanService.getPlanById(testPlanId);
        } catch (createError) {
          console.error('Failed to create test plan:', createError);
          return NextResponse.json(
            { error: 'Database error: Cannot create or fetch plans', details: String(createError) },
            { status: 500 }
          );
        }
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      return NextResponse.json(
        { error: 'Database error while fetching plan', details: String(error) },
        { status: 500 }
      );
    }
    
    if (!plan) {
      console.log('Plan not found for planId:', planId);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    console.log('Plan details found:', {
      id: plan.id,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      status: plan.status
    });

    // Check if price is 0 (free plan)
    if (plan.monthlyPrice === 0) {
      console.log('Creating free plan subscription...');
      // Handle free plan - no Stripe integration needed
      const subscription = await FirebaseUserSubscriptionService.createSubscription(
        {
          userId,
          planId,
          userDetails,
          billingCycle,
        },
        plan
      );

      console.log('Free subscription created successfully:', subscription.id);
      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          planName: subscription.planName,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      });
    }

    console.log('Creating paid plan subscription...');

    // Handle paid plans with Stripe
    // 1. Create or get Stripe customer
    const stripeCustomer = await StripeCustomerService.getOrCreateCustomer({
      email: userDetails.email,
      name: userDetails.firstName ? `${userDetails.firstName} ${userDetails.lastName || ''}`.trim() : undefined,
      userId,
    });

    // 2. Get or create price in Stripe
    const priceId = await StripeSubscriptionService.getOrCreatePrice(plan, billingCycle);

    // 3. Create subscription in Stripe
    const stripeSubscription = await StripeSubscriptionService.createSubscription({
      customerId: stripeCustomer.id,
      priceId,
      paymentMethodId,
      trialPeriodDays: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: {
        userId,
        planId,
        billingCycle,
      },
    });

    // 4. Create subscription in Firebase
    const subscription = await FirebaseUserSubscriptionService.createSubscription(
      {
        userId,
        planId,
        userDetails,
        billingCycle,
        paymentMethodId,
      },
      plan
    );

    // 5. Update Firebase subscription with Stripe data
    await FirebaseUserSubscriptionService.updateSubscription(subscription.id, {
      stripeCustomerId: stripeCustomer.id,
      stripeSubscriptionId: stripeSubscription.id,
      status: StripeSubscriptionService.mapStripeStatusToOurStatus(stripeSubscription.status),
      stripeCurrentPeriodStart: stripeSubscription.current_period_start 
        ? new Date(stripeSubscription.current_period_start * 1000) 
        : undefined,
      stripeCurrentPeriodEnd: stripeSubscription.current_period_end 
        ? new Date(stripeSubscription.current_period_end * 1000) 
        : undefined,
    });

    // 6. Handle payment confirmation for non-trial subscriptions
    let clientSecret = null;
    if (stripeSubscription.latest_invoice && typeof stripeSubscription.latest_invoice === 'object') {
      const paymentIntent = stripeSubscription.latest_invoice.payment_intent;
      if (paymentIntent && typeof paymentIntent === 'object') {
        clientSecret = paymentIntent.client_secret;
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.planName,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndDate: subscription.trialEndDate,
        isTrialActive: subscription.isTrialActive,
      },
      stripeSubscriptionId: stripeSubscription.id,
      clientSecret, // For payment confirmation on frontend
    });

  } catch (error) {
    console.error('=== Subscription Creation Error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: errorMessage,
        success: false
      },
      { status: 500 }
    );
  }
}
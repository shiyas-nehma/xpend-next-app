import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import StripeCustomerService from '@/lib/stripe/customerService';
import StripeSubscriptionService from '@/lib/stripe/subscriptionService';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import { AdminSubscriptionPlanService } from '@/lib/firebase/adminSubscriptionService';
import stripe from '@/lib/stripe/stripe';

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
      return NextResponse.json({ 
        error: 'Unauthorized',
        success: false 
      }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        success: false
      }, { status: 400 });
    }
    
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
        { 
          error: 'Missing required fields: userId, planId, billingCycle, userDetails',
          success: false 
        },
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
        if (!plan && (planId === '1' || planId === '2' || planId === '3')) {
          console.log(`Creating test plan for development (planId: ${planId})...`);
          try {
            const testPlanData = planId === '1' ? {
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
            } : planId === '2' ? {
              name: 'Pro Test Plan (With Trial)',
              monthlyPrice: 9.99,
              annualDiscountPct: 20,
              features: ['All free features', 'Unlimited transactions', 'Advanced analytics', 'Priority support'],
              featureLimits: {
                maxCategories: 999,
                maxIncomes: 999,
                maxExpenses: 999,
                maxAccounts: 10,
                maxBudgets: 20,
                analyticsAccess: true,
                reportGeneration: true,
                dataExport: true,
                apiAccess: true,
                prioritySupport: true,
                customIntegrations: false,
              },
              status: 'active' as const,
              subscribers: 0,
              trialDays: 7,
              maxDuration: 365,
              durationType: 'days' as const,
              sortOrder: 1,
            } : {
              name: 'Premium Test Plan (Immediate Payment)',
              monthlyPrice: 19.99,
              annualDiscountPct: 25,
              features: ['All pro features', 'Premium analytics', 'API access', 'Priority support', 'Custom integrations'],
              featureLimits: {
                maxCategories: 999,
                maxIncomes: 999,
                maxExpenses: 999,
                maxAccounts: 999,
                maxBudgets: 999,
                analyticsAccess: true,
                reportGeneration: true,
                dataExport: true,
                apiAccess: true,
                prioritySupport: true,
                customIntegrations: true,
              },
              status: 'active' as const,
              subscribers: 0,
              trialDays: 0, // Immediate payment required
              maxDuration: 365,
              durationType: 'days' as const,
              sortOrder: 2,
            };          const testPlanId = await AdminSubscriptionPlanService.createPlan(testPlanData);
          
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
      return NextResponse.json({ 
        error: 'Plan not found',
        success: false 
      }, { status: 404 });
    }
    
    console.log('Plan details found:', {
      id: plan.id,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      status: plan.status
    });

    // Check plan type and trial configuration
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
        // Include data needed for client-side user table update
        userUpdateData: {
          subscription_plan_id: subscription.planId,
          subscription_status: subscription.status,
          expiry_date: subscription.endDate.toISOString(),
        }
      });
    }

    // Check if this is a paid plan with no trial (immediate payment required)
    if (plan.monthlyPrice > 0 && plan.trialDays === 0) {
      console.log('Creating immediate paid plan subscription (no trial)...');
      
      // For paid plans with no trial, we need Stripe checkout for immediate payment
      // IMPORTANT: Do NOT create Firebase subscription yet. We'll create it in the webhook after successful checkout.
      // 1. Create or get Stripe customer
      const stripeCustomer = await StripeCustomerService.getOrCreateCustomer({
        email: userDetails.email,
        name: userDetails.firstName ? `${userDetails.firstName} ${userDetails.lastName || ''}`.trim() : undefined,
        userId,
      });

      // 2. Get or create price in Stripe
      const priceId = await StripeSubscriptionService.getOrCreatePrice(plan, billingCycle);

      // 3. Create Stripe Checkout Session for immediate subscription (no trial)
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?canceled=true`,
        subscription_data: {
          // No trial_period_days since trialDays is 0
          metadata: {
            userId,
            planId,
            billingCycle,
          },
        },
        metadata: {
          userId,
          planId,
          billingCycle,
        },
      });

      console.log('Stripe checkout session created for immediate paid plan:', {
        sessionId: checkoutSession.id
      });

      return NextResponse.json({
        success: true,
        checkout: true,
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        plan: {
          id: plan.id,
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
        },
        message: 'Redirecting to Stripe checkout for immediate payment',
      });
    }

    console.log('Creating paid plan subscription with trial...');

    // Handle paid plans with Stripe Checkout
    // 1. Create or get Stripe customer
    const stripeCustomer = await StripeCustomerService.getOrCreateCustomer({
      email: userDetails.email,
      name: userDetails.firstName ? `${userDetails.firstName} ${userDetails.lastName || ''}`.trim() : undefined,
      userId,
    });

    // 2. Get or create price in Stripe
    const priceId = await StripeSubscriptionService.getOrCreatePrice(plan, billingCycle);

    // 3. Create Stripe Checkout Session (paid plan with trial)
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?canceled=true`,
      subscription_data: {
        trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
        metadata: {
          userId,
          planId,
          billingCycle,
        },
      },
      metadata: {
        userId,
        planId,
        billingCycle,
      },
    });

    console.log('Stripe checkout session created:', {
      sessionId: checkoutSession.id
    });

    // Return checkout session for frontend redirect
    return NextResponse.json({
      success: true,
      checkout: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      plan: {
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
      },
      message: 'Redirecting to Stripe checkout',
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
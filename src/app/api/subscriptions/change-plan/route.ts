import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import { AdminSubscriptionPlanService } from '@/lib/firebase/adminSubscriptionService';

export async function POST(request: NextRequest) {
  console.log('=== Subscription Plan Change API Called ===');
  
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
      newPlanId, 
      billingCycle = 'monthly'
    } = body;

    console.log('Extracted fields:', { 
      userId: !!userId, 
      newPlanId: !!newPlanId, 
      billingCycle 
    });

    if (!userId || !newPlanId) {
      console.log('Missing required fields:', { 
        userId: !!userId, 
        newPlanId: !!newPlanId
      });
      return NextResponse.json(
        { 
          error: 'Missing required fields: userId, newPlanId',
          success: false 
        },
        { status: 400 }
      );
    }

    // Get new plan details
    console.log('Fetching new plan details for planId:', newPlanId);
    
    let newPlan;
    try {
      newPlan = await AdminSubscriptionPlanService.getPlanById(newPlanId);
      console.log('Plan fetch result:', newPlan ? 'Found' : 'Not found');
    } catch (error) {
      console.error('Error fetching plan:', error);
      return NextResponse.json(
        { error: 'Database error while fetching plan', details: String(error) },
        { status: 500 }
      );
    }
    
    if (!newPlan) {
      console.log('Plan not found for planId:', newPlanId);
      return NextResponse.json({ 
        error: 'Plan not found',
        success: false 
      }, { status: 404 });
    }
    
    console.log('New plan details found:', {
      id: newPlan.id,
      name: newPlan.name,
      monthlyPrice: newPlan.monthlyPrice,
      status: newPlan.status
    });

    // Check if new plan is a paid plan that requires Stripe
    if (newPlan.monthlyPrice > 0) {
      console.log('New plan is paid - redirect to Stripe checkout creation');
      return NextResponse.json({
        success: false,
        requiresStripeCheckout: true,
        message: 'Paid plans require Stripe checkout. Use /api/subscriptions/create endpoint instead.',
        plan: {
          id: newPlan.id,
          name: newPlan.name,
          monthlyPrice: newPlan.monthlyPrice,
        }
      }, { status: 400 });
    }

    console.log('Changing to free plan...');

    // Handle free plan change
    const newSubscription = await FirebaseUserSubscriptionService.changeSubscriptionPlan(
      userId,
      newPlanId,
      newPlan,
      billingCycle
    );

    console.log('Plan change completed successfully:', newSubscription.id);
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: newSubscription.id,
        status: newSubscription.status,
        planName: newSubscription.planName,
        startDate: newSubscription.startDate,
        endDate: newSubscription.endDate,
        monthlyPrice: newSubscription.monthlyPrice,
      },
      message: 'Plan changed successfully',
    });

  } catch (error) {
    console.error('=== Subscription Plan Change Error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to change subscription plan',
        details: errorMessage,
        success: false
      },
      { status: 500 }
    );
  }
}
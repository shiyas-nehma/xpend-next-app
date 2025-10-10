import { NextRequest, NextResponse } from 'next/server';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';
import { AdminSubscriptionPlanService } from '@/lib/firebase/adminSubscriptionService';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Debug: Testing webhook subscription creation ===');
    
    const body = await request.json();
    const { userId, planId, billingCycle = 'monthly' } = body;
    
    if (!userId || !planId) {
      return NextResponse.json({ 
        error: 'Missing userId or planId' 
      }, { status: 400 });
    }
    
    // Get plan details
    const plan = await AdminSubscriptionPlanService.getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ 
        error: 'Plan not found' 
      }, { status: 404 });
    }
    
    console.log('Plan found:', plan.name);
    
    // Mock userDetails
    const userDetails = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      userId,
    };
    
    // Create subscription
    const createData = {
      userId,
      planId,
      userDetails,
      billingCycle: billingCycle as 'monthly' | 'annual',
    };
    
    console.log('Creating subscription with data:', createData);
    
    const subscription = await FirebaseUserSubscriptionService.createSubscription(createData, plan);
    
    console.log('Subscription created successfully:', subscription.id);
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        userId: subscription.userId,
      }
    });
    
  } catch (error) {
    console.error('Debug webhook test error:', error);
    return NextResponse.json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
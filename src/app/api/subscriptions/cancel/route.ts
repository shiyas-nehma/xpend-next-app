import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import StripeSubscriptionService from '@/lib/stripe/subscriptionService';
import FirebaseUserSubscriptionService from '@/lib/firebase/userSubscriptionService';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    // Get subscription from Firebase
    const subscription = await FirebaseUserSubscriptionService.getSubscriptionById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Cancel in Stripe if it's a paid subscription
    if (subscription.stripeSubscriptionId) {
      await StripeSubscriptionService.cancelSubscription(subscription.stripeSubscriptionId);
    }

    // Update subscription in Firebase
    await FirebaseUserSubscriptionService.cancelSubscription(subscriptionId, reason);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get authorization header
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    // Get subscription from Firebase
    const subscription = await FirebaseUserSubscriptionService.getSubscriptionById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Resume in Stripe if it's a paid subscription
    if (subscription.stripeSubscriptionId) {
      await StripeSubscriptionService.resumeSubscription(subscription.stripeSubscriptionId);
    }

    // Update subscription in Firebase
    await FirebaseUserSubscriptionService.updateSubscription(subscriptionId, {
      cancelAtPeriodEnd: false,
      cancelledAt: undefined,
      cancellationReason: undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully',
    });

  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}
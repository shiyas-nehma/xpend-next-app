import { NextRequest, NextResponse } from 'next/server';
import StripeCustomerService from '@/lib/stripe/customerService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required field: customerId' },
        { status: 400 }
      );
    }

    // Create setup intent for adding new payment method
    const setupIntent = await StripeCustomerService.createSetupIntent(customerId);

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
}
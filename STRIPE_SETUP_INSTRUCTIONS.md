# Stripe Subscription Setup Instructions

This guide will help you set up Stripe subscriptions for your XPend app with proper trial periods, recurring billing, and webhook handling.

## Prerequisites

1. **Stripe Account**: Sign up at [https://stripe.com](https://stripe.com)
2. **Stripe CLI**: Install from [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

## Step 1: Get Stripe API Keys

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. Update your `.env.local` file:

```bash
# Replace with your actual keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

## Step 2: Create Products and Prices in Stripe

### Option A: Using Stripe Dashboard
1. Go to [Products](https://dashboard.stripe.com/products) in your Stripe dashboard
2. Create products for each plan (Basic, Pro, Enterprise, etc.)
3. For each product, create prices for:
   - Monthly subscription
   - Annual subscription (with discount)

### Option B: Using Stripe CLI or API
The app will automatically create prices when users select plans, but you can pre-create them:

```bash
# Example: Create a product
stripe products create \
  --name "Pro Plan" \
  --description "Professional expense tracking"

# Create monthly price
stripe prices create \
  --unit-amount 1999 \
  --currency usd \
  --recurring interval=month \
  --product prod_xxx

# Create annual price with discount
stripe prices create \
  --unit-amount 19900 \
  --currency usd \
  --recurring interval=year \
  --product prod_xxx
```

## Step 3: Set Up Webhooks

### Local Development

1. Install Stripe CLI and login:
```bash
stripe login
```

2. Forward events to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Copy the webhook signing secret from the CLI output and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Production Setup

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks) in Stripe Dashboard
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
   - `customer.updated`

5. Copy the webhook signing secret and add to your production environment variables.

## Step 4: Configure Firebase Collections

Ensure your Firebase Firestore has the following collections:

### subscription_plans
```javascript
{
  id: "plan_basic",
  name: "Basic Plan",
  description: "Perfect for personal use",
  monthlyPrice: 0, // Free plan
  annualDiscountPct: 0,
  trialDays: 0,
  status: "active",
  highlight: false,
  features: [
    "5 categories",
    "2 accounts", 
    "50 expenses per month",
    "Basic reporting"
  ],
  featureLimits: {
    maxCategories: 5,
    maxAccounts: 2,
    maxExpenses: 50,
    maxIncomes: 20
  }
}
```

### user_subscriptions
This collection is automatically managed by the app, but here's the structure:
```javascript
{
  id: "auto_generated",
  userId: "firebase_user_id",
  planId: "plan_pro",
  planName: "Pro Plan",
  status: "active", // active, trialing, past_due, cancelled, expired, incomplete
  startDate: timestamp,
  endDate: timestamp,
  trialEndDate: timestamp, // if applicable
  isTrialActive: boolean,
  stripeCustomerId: "cus_xxx",
  stripeSubscriptionId: "sub_xxx",
  billingCycle: "monthly", // or "annual"
  // ... other fields
}
```

## Step 5: Update Plan Schema

Add `stripeProductId` to your plans if you want to use pre-created Stripe products:

```javascript
// In your subscription_plans collection
{
  // ... existing fields
  stripeProductId: "prod_xxx", // Optional: pre-created Stripe product ID
  stripePriceIds: {
    monthly: "price_xxx",
    annual: "price_yyy"
  }
}
```

## Step 6: Test the Integration

### Testing Free Plans
1. Create a plan with `monthlyPrice: 0`
2. Users should be able to subscribe without payment

### Testing Paid Plans with Trial
1. Create a plan with `trialDays: 7` and `monthlyPrice: 19.99`
2. Users should get 7 days free, then auto-billed

### Testing Paid Plans without Trial
1. Create a plan with `trialDays: 0` and `monthlyPrice: 19.99`
2. Users should be charged immediately

### Test Cards (Stripe Test Mode)
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Requires 3D Secure: `4000002500003155`

## Step 7: Handle Edge Cases

### Trial Ending
- Webhook `customer.subscription.trial_will_end` fires 3 days before trial ends
- If no payment method attached, subscription cancels automatically
- Send email notifications to users about trial ending

### Payment Failures
- Webhook `invoice.payment_failed` fires when payment fails
- Stripe automatically retries failed payments
- Update subscription status to `past_due`
- Send notification to user to update payment method

### Cancellations
- Users can cancel anytime via the UI
- Subscription remains active until period end (unless immediate cancellation)
- Webhook `customer.subscription.updated` with `cancel_at_period_end: true`

## Step 8: Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Auth Tokens**: Validate Firebase auth tokens in API routes
3. **Rate Limiting**: Implement rate limiting on subscription endpoints
4. **Data Validation**: Validate all input data
5. **HTTPS**: Use HTTPS in production for webhook endpoints

## Step 9: Monitoring and Analytics

1. **Stripe Dashboard**: Monitor subscriptions, revenue, and churn
2. **Firebase Analytics**: Track subscription events
3. **Error Logging**: Log all subscription-related errors
4. **Webhook Logs**: Monitor webhook delivery and failures

## Environment Variables Summary

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000" # or your production URL

# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
# ... other Firebase config
```

## Troubleshooting

### Common Issues

1. **Webhook not firing**: Check endpoint URL and selected events
2. **Payment not processing**: Verify Stripe keys and test cards
3. **Trial not working**: Check `trialDays` in plan configuration
4. **User not found**: Ensure Firebase auth token is valid

### Debug Mode

Set up logging to debug subscription flow:

```javascript
// In your API routes
console.log('Creating subscription for user:', userId);
console.log('Plan details:', plan);
console.log('Stripe customer:', stripeCustomer);
```

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Configure production webhook endpoint
- [ ] Set up proper error monitoring
- [ ] Test subscription flow end-to-end
- [ ] Configure email notifications
- [ ] Set up customer support for billing issues
- [ ] Monitor subscription metrics
- [ ] Implement dunning management for failed payments

This setup provides a complete subscription system with:
- Free and paid plans
- Trial periods
- Recurring billing
- Subscription management
- Webhook handling
- Real-time status updates
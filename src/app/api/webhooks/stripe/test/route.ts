// Test webhook endpoint
// This can be used to test if webhooks are working properly

export async function GET() {
  return new Response(JSON.stringify({
    status: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Present' : 'Missing'
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
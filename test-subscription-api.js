const { default: fetch } = require('node-fetch');

async function testSubscriptionAPI() {
  try {
    console.log('Testing subscription API...');
    
    const response = await fetch('http://localhost:3001/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        userId: 'test-user-' + Date.now(),
        planId: '1',
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
      console.log('Parsed response:', data);
    } catch (parseError) {
      console.log('Failed to parse JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSubscriptionAPI();
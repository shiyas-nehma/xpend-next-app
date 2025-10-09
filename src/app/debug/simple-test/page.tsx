"use client";

import { useState } from 'react';

export default function SimpleAPITestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('=== Starting API Test ===');
      
      const requestData = {
        userId: 'test-user-' + Date.now(),
        planId: '1',
        billingCycle: 'monthly',
        userDetails: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };
      
      console.log('Request data:', requestData);
      
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify(requestData),
      });

      console.log('=== Response Details ===');
      console.log('Status:', response.status);
      console.log('Status text:', response.statusText);
      console.log('OK:', response.ok);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      console.log('Response text length:', responseText.length);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed JSON:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        data = { error: 'Invalid JSON', rawResponse: responseText };
      }
      
      const resultText = `
Status: ${response.status} ${response.statusText}
OK: ${response.ok}
Content-Type: ${response.headers.get('content-type')}
Response Length: ${responseText.length}

Raw Response:
${responseText}

Parsed Data:
${JSON.stringify(data, null, 2)}
      `.trim();
      
      setResult(resultText);
      
    } catch (error) {
      console.error('Fetch error:', error);
      setResult(`Fetch Error: ${error}\nType: ${typeof error}\nStack: ${error instanceof Error ? error.stack : 'No stack'}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple API Test</h1>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded disabled:bg-gray-400 mb-4"
      >
        {loading ? 'Testing...' : 'Test Subscription API'}
      </button>
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-xs max-h-96 overflow-y-auto border">
            {result}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Check the browser console for detailed logs.</p>
        <p>This will test the subscription API and show the exact response.</p>
      </div>
    </div>
  );
}
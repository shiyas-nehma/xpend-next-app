'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase/config.js';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const FirebaseDebugger: React.FC = () => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    // Check Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
    setConfig(firebaseConfig);

    // Monitor auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setAuthUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const runTests = async () => {
    const results: any[] = [];

    // Test 1: Basic Firestore connection
    try {
      console.log('Testing Firestore connection...');
      const testCollection = collection(db, 'debug-test');
      results.push({ test: 'Firestore Connection', status: 'SUCCESS', details: 'Connected to Firestore' });
    } catch (error: any) {
      console.error('Firestore connection error:', error);
      results.push({ test: 'Firestore Connection', status: 'ERROR', details: error.message });
    }

    // Test 2: Read operation
    try {
      console.log('Testing read operation...');
      const testQuery = query(collection(db, 'categories'), limit(1));
      const snapshot = await getDocs(testQuery);
      results.push({ 
        test: 'Read Operation', 
        status: 'SUCCESS', 
        details: `Read ${snapshot.size} documents from categories collection` 
      });
    } catch (error: any) {
      console.error('Read operation error:', error);
      results.push({ test: 'Read Operation', status: 'ERROR', details: error.message });
    }

    // Test 3: Write operation
    try {
      console.log('Testing write operation...');
      const testDoc = await addDoc(collection(db, 'debug-test'), {
        message: 'Debug test document',
        timestamp: new Date(),
        user: authUser?.uid || 'anonymous'
      });
      results.push({ 
        test: 'Write Operation', 
        status: 'SUCCESS', 
        details: `Created document with ID: ${testDoc.id}` 
      });
    } catch (error: any) {
      console.error('Write operation error:', error);
      results.push({ test: 'Write Operation', status: 'ERROR', details: error.message });
    }

    setTestResults(results);
  };

  const configStatus = Object.entries(config).map(([key, value]) => ({
    key,
    value: value ? '✓ Set' : '✗ Missing',
    actual: value || 'undefined'
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Debug Dashboard</h1>
      
      {/* Configuration Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Firebase Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {configStatus.map(({ key, value, actual }) => (
            <div key={key} className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm font-mono">{key}:</span>
              <span className={`text-sm ${value.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Status */}
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Authentication Status</h2>
        {authLoading ? (
          <p>Loading auth state...</p>
        ) : authUser ? (
          <div>
            <p className="text-green-600">✓ User authenticated</p>
            <p className="text-sm">UID: {authUser.uid}</p>
            <p className="text-sm">Email: {authUser.email}</p>
          </div>
        ) : (
          <p className="text-red-600">✗ Not authenticated</p>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <button
          onClick={runTests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={authLoading}
        >
          Run Firebase Tests
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="p-3 bg-white rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{result.test}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.status === 'SUCCESS' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{result.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseDebugger;
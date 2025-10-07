import React, { useState } from 'react';
import { testFirestoreConnection, getAccounts, addAccount } from '@/lib/firebase/accountService';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const FirestoreDebug: React.FC = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testFirestoreConnection();
      setTestResult(`Connection test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAccountFetch = async () => {
    if (!user?.uid) {
      setTestResult('No user UID available for account fetch test');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Starting account fetch test...');
      const accounts = await getAccounts(user.uid);
      setTestResult(`Account fetch test: SUCCESS - Found ${accounts.length} accounts\n${JSON.stringify(accounts, null, 2)}`);
    } catch (error) {
      console.error('Account fetch test failed:', error);
      setTestResult(`Account fetch test: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFirestoreWrite = async () => {
    if (!user?.uid) {
      setTestResult('No user UID available for direct Firestore test');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Testing direct Firestore write...');
      
      // Try to write directly to Firestore
      const testDoc = {
        test: true,
        userId: user.uid,
        timestamp: new Date(),
        message: 'Direct Firestore test'
      };
      
      console.log('Attempting to write test document:', testDoc);
      const docRef = await addDoc(collection(db, 'test'), testDoc);
      console.log('Test document written successfully:', docRef.id);
      
      // Try to read it back
      const querySnapshot = await getDocs(collection(db, 'test'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setTestResult(`Direct Firestore test: SUCCESS\nDocument ID: ${docRef.id}\nAll test docs: ${JSON.stringify(docs, null, 2)}`);
    } catch (error) {
      console.error('Direct Firestore test failed:', error);
      
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details
      };
      
      setTestResult(`Direct Firestore test: FAILED\nError: ${errorDetails.message}\nCode: ${errorDetails.code || 'N/A'}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestAccount = async () => {
    if (!user?.uid) {
      setTestResult('No user UID available for creating test account');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Creating test account...');
      console.log('User UID:', user.uid);
      console.log('User object:', user);
      
      const testAccountData = {
        name: 'Test Checking Account',
        type: 'Checking' as const,
        balance: 1000,
        institution: 'Test Bank',
        description: 'Test account created by debug tool',
        userId: user.uid,
      };
      
      console.log('Test account data:', testAccountData);
      
      const newAccount = await addAccount(testAccountData);
      setTestResult(`Test account created: SUCCESS\n${JSON.stringify(newAccount, null, 2)}`);
    } catch (error) {
      console.error('Test account creation failed:', error);
      
      // Show more detailed error information
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details,
        stack: error instanceof Error ? error.stack : 'No stack'
      };
      
      setTestResult(`Test account creation: FAILED\nError: ${errorDetails.message}\nCode: ${errorDetails.code || 'N/A'}\nDetails: ${JSON.stringify(errorDetails, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-brand-surface rounded-lg border border-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Firestore Debug</h3>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-brand-text-secondary">
          <strong>User authenticated:</strong> {user ? 'Yes' : 'No'}
        </p>
        {user && (
          <p className="text-sm text-brand-text-secondary">
            <strong>User UID:</strong> {user.uid}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <button
            onClick={runConnectionTest}
            disabled={loading}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-2 mb-2"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            onClick={testAccountFetch}
            disabled={loading || !user}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 mr-2 mb-2"
          >
            {loading ? 'Testing...' : 'Test Fetch'}
          </button>
        </div>
        
        <div>
          <button
            onClick={testDirectFirestoreWrite}
            disabled={loading || !user}
            className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 mr-2 mb-2"
          >
            {loading ? 'Testing...' : 'Test Direct Write'}
          </button>

          <button
            onClick={createTestAccount}
            disabled={loading || !user}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 mb-2"
          >
            {loading ? 'Creating...' : 'Create Test Account'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <pre>{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default FirestoreDebug;
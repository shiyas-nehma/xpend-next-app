import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getAccounts, 
  addAccount, 
  updateAccount, 
  deleteAccount,
  testFirestoreConnection,
  type AccountData 
} from '@/lib/firebase/accountService';
import type { Account } from '@/types';

export const useAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user UID available, skipping account fetch');
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('User authenticated, fetching accounts for:', user.uid);
      
      // Test Firestore connection first
      const connectionTest = await testFirestoreConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection test failed: ${connectionTest.message}`);
      }
      
      const userAccounts = await getAccounts(user.uid);
      console.log('Successfully fetched accounts:', userAccounts);
      setAccounts(userAccounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accounts';
      console.error('Error in fetchAccounts:', {
        error: err,
        message: errorMessage,
        userUid: user?.uid
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load accounts on mount and when user changes
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Add new account
  const handleAddAccount = useCallback(async (accountData: Omit<Account, 'id' | 'lastUpdated'>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const accountDataWithUser: AccountData = {
        ...accountData,
        userId: user.uid,
      };
      
      const newAccount = await addAccount(accountDataWithUser);
      setAccounts(prev => [newAccount, ...prev]);
      return newAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.uid]);

  // Update account
  const handleUpdateAccount = useCallback(async (accountId: number, accountData: Partial<Omit<Account, 'id' | 'lastUpdated'>>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const updateData: Partial<AccountData> = {
        ...accountData,
        userId: user.uid,
      };
      
      await updateAccount(accountId, updateData);
      
      setAccounts(prev => 
        prev.map(account => 
          account.id === accountId 
            ? { ...account, ...accountData, lastUpdated: new Date().toISOString() }
            : account
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.uid]);

  // Delete account
  const handleDeleteAccount = useCallback(async (accountId: number) => {
    try {
      setError(null);
      await deleteAccount(accountId);
      setAccounts(prev => prev.filter(account => account.id !== accountId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Refresh accounts
  const refreshAccounts = useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    addAccount: handleAddAccount,
    updateAccount: handleUpdateAccount,
    deleteAccount: handleDeleteAccount,
    refreshAccounts,
  };
};
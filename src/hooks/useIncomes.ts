'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Income, Category } from '@/types';
import { IncomeService } from '@/lib/firebase/incomeService';
import { isSuperAdmin } from '@/lib/firebase/auth';
import { useToast } from './useToast';
import { useAuth } from '@/context/AuthContext';

const FALLBACK_DEMO_USER_ID = 'demo-user-unauth';

export const useIncomes = (categories: Category[]) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid || FALLBACK_DEMO_USER_ID;
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadIncomes = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setIncomes([]);
      setLoading(false);
      return;
    }

    // Skip data fetching if user is a superadmin
    try {
      const isAdmin = await isSuperAdmin();
      if (isAdmin) {
        setIncomes([]);
        setLoading(false);
        return;
      }
    } catch (adminCheckError) {
      // If admin check fails, continue with regular flow
      console.log('Admin check failed, continuing with regular user flow');
    }

    try {
      setLoading(true);
      setError(null);
      const data = await IncomeService.getIncomes(userId, categories);
      // Ensure data is always an array
      const safeData = Array.isArray(data) ? data : [];
      // De-duplicate by docId to avoid duplicate React keys in case of race conditions
      const seen = new Set<string>();
      const unique = safeData.filter(i => {
        if (!i || !i.docId) return true; // keep if no docId
        if (seen.has(i.docId)) return false;
        seen.add(i.docId);
        return true;
      });
      setIncomes(unique);
    } catch (e) {
      console.error('Error loading incomes', e);
      const message = e instanceof Error ? e.message : 'Failed to load incomes';
      setError(message);
      // Don't show toast for superadmin users or during auth transitions
      if (user && !authLoading) {
        addToast(message, 'error');
      }
      // Ensure incomes is always an array even on error
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, [categories, addToast, authLoading, user, userId]);

  const addIncome = useCallback(async (incomeData: Omit<Income, 'id' | 'docId'>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const created = await IncomeService.addIncome(incomeData, userId);
      setIncomes(prev => {
        // Remove any existing with same docId
        return [created, ...prev.filter(p => p.docId !== created.docId)];
      });
      addToast('Income added successfully', 'success');
      return created;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add income';
      addToast(message, 'error');
      throw e;
    }
  }, [addToast, user, userId, categories]);

  const updateIncome = useCallback(async (income: Income) => {
    try {
      const firestoreId = income.docId || IncomeService.getFirestoreId(income.id);
      await IncomeService.updateIncome(firestoreId, income);
      setIncomes(prev => prev.map(i => (i.docId && income.docId && i.docId === income.docId) ? income : i));
      addToast('Income updated', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update income';
      addToast(message, 'error');
      throw e;
    }
  }, [addToast]);

  const deleteIncome = useCallback(async (id: number) => {
    try {
      const firestoreId = IncomeService.getFirestoreId(id);
      await IncomeService.deleteIncome(firestoreId);
      setIncomes(prev => prev.filter(i => i.id !== id));
      addToast('Income deleted', 'info');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete income';
      addToast(message, 'error');
      throw e;
    }
  }, [addToast]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes, userId]);

  // Real-time listener
  useEffect(() => {
    if (authLoading || !user) return;

    // Skip real-time listener for superadmins
    const checkAdminAndSetupListener = async () => {
      try {
        const isAdmin = await isSuperAdmin();
        if (isAdmin) {
          return;
        }
      } catch (adminCheckError) {
        console.log('Admin check failed, continuing with regular user flow');
      }

      try {
        const unsubscribe = IncomeService.onIncomesChange(userId, categories, (updated) => {
          // Ensure updated is always an array
          const safeUpdated = Array.isArray(updated) ? updated : [];
          // Same de-duplication on snapshot
          const seen = new Set<string>();
          const unique = safeUpdated.filter(i => {
            if (!i || !i.docId) return true;
            if (seen.has(i.docId)) return false;
            seen.add(i.docId);
            return true;
          });
          setIncomes(unique);
          setLoading(false);
          setError(null);
        });
        return unsubscribe;
      } catch (listenerError: any) {
        // Handle permission-denied and other listener setup errors silently
        console.log('Failed to set up real-time listener, falling back to one-time load:', listenerError?.message);
        // Fall back to one-time load if real-time listener fails
        loadIncomes();
        return undefined;
      }
    };

    let unsubscribeRef: (() => void) | undefined;
    checkAdminAndSetupListener().then(unsubscribe => {
      unsubscribeRef = unsubscribe;
    }).catch(error => {
      console.log('Real-time listener setup failed:', error?.message);
    });

    return () => {
      if (unsubscribeRef) {
        unsubscribeRef();
      }
    };
  }, [categories, userId, user, authLoading, loadIncomes]);

  return {
    incomes,
    loading,
    error,
    addIncome,
    updateIncome,
    deleteIncome,
    refreshIncomes: loadIncomes,
  };
};
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Income, Category } from '@/types';
import { IncomeService } from '@/lib/firebase/incomeService';
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
    try {
      setLoading(true);
      setError(null);
      const data = await IncomeService.getIncomes(userId, categories);
      // De-duplicate by docId to avoid duplicate React keys in case of race conditions
      const seen = new Set<string>();
      const unique = data.filter(i => {
        if (!i.docId) return true; // keep if no docId
        if (seen.has(i.docId)) return false;
        seen.add(i.docId);
        return true;
      });
      setIncomes(unique);
    } catch (e) {
      console.error('Error loading incomes', e);
      const message = e instanceof Error ? e.message : 'Failed to load incomes';
      setError(message);
      addToast(message, 'error');
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
    const unsubscribe = IncomeService.onIncomesChange(userId, categories, (updated) => {
      // Same de-duplication on snapshot
      const seen = new Set<string>();
      const unique = updated.filter(i => {
        if (!i.docId) return true;
        if (seen.has(i.docId)) return false;
        seen.add(i.docId);
        return true;
      });
      setIncomes(unique);
      setLoading(false);
      setError(null);
    });
    return () => unsubscribe();
  }, [categories, userId, user, authLoading]);

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
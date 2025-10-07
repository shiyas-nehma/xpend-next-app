'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense, Category } from '@/types';
import { ExpenseService } from '@/lib/firebase/expenseService';
import { useToast } from './useToast';

// TODO: Replace demo user with real authenticated user ID from auth context
const DEMO_USER_ID = 'demo-user-123';

export const useExpenses = (categories: Category[]) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ExpenseService.getExpenses(DEMO_USER_ID, categories);
      // De-duplicate by docId to avoid duplicate React keys in case of race conditions
      const seen = new Set<string>();
      const unique = data.filter(e => {
        if (!e.docId) return true; // keep if no docId
        if (seen.has(e.docId)) return false;
        seen.add(e.docId);
        return true;
      });
      setExpenses(unique);
    } catch (e) {
      console.error('Error loading expenses', e);
      const message = e instanceof Error ? e.message : 'Failed to load expenses';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [categories, addToast]);

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'docId'>) => {
    try {
      const created = await ExpenseService.addExpense(expenseData, DEMO_USER_ID);
      setExpenses(prev => {
        // Remove any existing with same docId
        return [created, ...prev.filter(p => p.docId !== created.docId)];
      });
      addToast('Expense added successfully', 'success');
      return created;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add expense';
      addToast(message, 'error');
      throw e;
    }
  }, [addToast]);

  const updateExpense = useCallback(async (expense: Expense) => {
    try {
      const firestoreId = expense.docId || ExpenseService.getFirestoreId(expense.id);
      await ExpenseService.updateExpense(firestoreId, expense);
  setExpenses(prev => prev.map(e => (e.docId && expense.docId && e.docId === expense.docId) ? expense : e));
      addToast('Expense updated', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update expense';
      addToast(message, 'error');
      throw e;
    }
  }, [addToast]);

  const deleteExpense = useCallback(async (id: number) => {
    try {
      const firestoreId = ExpenseService.getFirestoreId(id);
      await ExpenseService.deleteExpense(firestoreId);
  setExpenses(prev => prev.filter(e => e.id !== id));
      addToast('Expense deleted', 'info');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete expense';
      addToast(message, 'error');
      throw e;
    }
  }, [addToast]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Real-time listener
  useEffect(() => {
    const unsubscribe = ExpenseService.onExpensesChange(DEMO_USER_ID, categories, (updated) => {
      // Same de-duplication on snapshot
      const seen = new Set<string>();
      const unique = updated.filter(e => {
        if (!e.docId) return true;
        if (seen.has(e.docId)) return false;
        seen.add(e.docId);
        return true;
      });
      setExpenses(unique);
      setLoading(false);
      setError(null);
    });
    return () => unsubscribe();
  }, [categories]);

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses: loadExpenses,
  };
};

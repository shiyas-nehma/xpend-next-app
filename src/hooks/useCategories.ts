'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryService } from '@/lib/firebase/categoryService';
import type { Category } from '@/types';
import { useToast } from './useToast';
import { useAuth } from '@/context/AuthContext';

// NOTE: userId now comes from AuthContext; fallback only used for transitional unauthenticated state
const FALLBACK_DEMO_USER_ID = 'demo-user-unauth';

export const useCategories = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid || FALLBACK_DEMO_USER_ID; // ensure a stable string for dependency changes
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Convert Category ID back to Firestore document ID
  const getFirestoreId = useCallback((categoryId: number): string => {
    return CategoryService.getFirestoreId(categoryId);
  }, []);

  // Load categories from Firebase
  const loadCategories = useCallback(async () => {
    if (authLoading) return; // wait until auth resolved
    if (!user) { // user not logged in -> clear categories
      setCategories([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const fetchedCategories = await CategoryService.getCategories(userId);
      setCategories(fetchedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      addToast('Failed to load categories', 'error');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, [addToast, authLoading, user, userId]);

  // Add a new category
  const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const newCategory = await CategoryService.addCategory(categoryData, userId);
      setCategories(prev => [newCategory, ...prev]);
      addToast('Category added successfully', 'success');
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add category';
      addToast(errorMessage, 'error');
      console.error('Error adding category:', err);
      throw err;
    }
  }, [addToast, user, userId]);

  // Update an existing category
  const updateCategory = useCallback(async (updatedCategory: Category) => {
    try {
      const firestoreId = getFirestoreId(updatedCategory.id);
      await CategoryService.updateCategory(firestoreId, updatedCategory);
      
      setCategories(prev => 
        prev.map(c => c.id === updatedCategory.id ? updatedCategory : c)
      );
      addToast('Category updated successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      addToast(errorMessage, 'error');
      console.error('Error updating category:', err);
      throw err;
    }
  }, [addToast, getFirestoreId]);

  // Delete a category
  const deleteCategory = useCallback(async (categoryId: number) => {
    try {
      const firestoreId = getFirestoreId(categoryId);
      await CategoryService.deleteCategory(firestoreId);
      
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      addToast('Category deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      addToast(errorMessage, 'error');
      console.error('Error deleting category:', err);
      throw err;
    }
  }, [addToast, getFirestoreId]);

  // Get categories by type
  const getCategoriesByType = useCallback((type: 'Expense' | 'Income') => {
    return categories.filter(category => category.type === type);
  }, [categories]);

  // Search categories
  const searchCategories = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categories]);

  // Get category statistics
  const getCategoryStats = useCallback(() => {
    const expenseCategories = categories.filter(c => c.type === 'Expense');
    const incomeCategories = categories.filter(c => c.type === 'Income');
    
    const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = expenseCategories.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalEarned = incomeCategories.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    return {
      totalExpenseCategories: expenseCategories.length,
      totalIncomeCategories: incomeCategories.length,
      totalBudget,
      totalSpent,
      totalEarned,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [categories]);

  // Update category amount (when adding transactions)
  const updateCategoryAmount = useCallback(async (categoryId: number, amount: number, increment: boolean = true) => {
    try {
      const firestoreId = getFirestoreId(categoryId);
      await CategoryService.updateCategoryAmount(firestoreId, amount, increment);
      
      // Update local state
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? { ...c, amount: increment ? c.amount + amount : c.amount - amount }
            : c
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category amount';
      addToast(errorMessage, 'error');
      console.error('Error updating category amount:', err);
      throw err;
    }
  }, [addToast, getFirestoreId]);

  // Set up real-time listener for categories
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // When auth state changes, reset ID mappings to ensure isolation per user
    if (!authLoading) {
      CategoryService.clearIdMappings();
      if (!user) {
        setCategories([]);
      }
    }

    if (authLoading || !user) return; // wait for auth or skip if not logged in

    try {
      unsubscribe = CategoryService.onCategoriesChange(userId, (updatedCategories) => {
        setCategories(updatedCategories);
        setLoading(false);
        setError(null);
      });
    } catch (err) {
      console.error('Error setting up real-time listener:', err);
      loadCategories();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, user, authLoading, loadCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    searchCategories,
    getCategoryStats,
    updateCategoryAmount,
    refreshCategories: loadCategories,
  };
};
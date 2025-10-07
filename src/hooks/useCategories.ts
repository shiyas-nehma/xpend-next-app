'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryService } from '@/lib/firebase/categoryService';
import type { Category } from '@/types';
import { useToast } from './useToast';

// For demo purposes, we'll use a mock user ID
// In a real app, this would come from authentication
const DEMO_USER_ID = 'demo-user-123';

export const useCategories = () => {
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
    try {
      setLoading(true);
      setError(null);
      const fetchedCategories = await CategoryService.getCategories(DEMO_USER_ID);
      setCategories(fetchedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      addToast('Failed to load categories', 'error');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Add a new category
  const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    try {
      const newCategory = await CategoryService.addCategory(categoryData, DEMO_USER_ID);
      setCategories(prev => [newCategory, ...prev]);
      addToast('Category added successfully', 'success');
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add category';
      addToast(errorMessage, 'error');
      console.error('Error adding category:', err);
      throw err;
    }
  }, [addToast]);

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

    const setupRealtimeListener = () => {
      try {
        unsubscribe = CategoryService.onCategoriesChange(DEMO_USER_ID, (updatedCategories) => {
          setCategories(updatedCategories);
          setLoading(false);
          setError(null);
        });
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        // Fallback to one-time load if real-time fails
        loadCategories();
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadCategories]);

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
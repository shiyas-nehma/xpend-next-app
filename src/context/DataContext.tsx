'use client';

import React, { createContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Income, Expense, Category } from '@/types';
import { mockIncomes, mockExpenses } from '@/data/mockData';
import { useCategories } from '@/hooks/useCategories';

interface DataContextType {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  addIncome: (income: Income) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: number) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  getCategoriesByType: (type: 'Expense' | 'Income') => Category[];
  searchCategories: (searchTerm: string) => Category[];
  getCategoryStats: () => {
    totalExpenseCategories: number;
    totalIncomeCategories: number;
    totalBudget: number;
    totalSpent: number;
    totalEarned: number;
    budgetUtilization: number;
  };
  refreshCategories: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(mockIncomes);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  
  // Use Firebase-integrated categories hook
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    addCategory: addCategoryToFirebase,
    updateCategory: updateCategoryInFirebase,
    deleteCategory: deleteCategoryFromFirebase,
    getCategoriesByType,
    searchCategories,
    getCategoryStats,
    refreshCategories,
  } = useCategories();

  const addIncome = useCallback((income: Income) => {
    setIncomes(prev => [income, ...prev]);
  }, []);

  const updateIncome = useCallback((updatedIncome: Income) => {
    setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  }, []);

  const deleteIncome = useCallback((id: number) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, []);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }, []);

  const deleteExpense = useCallback((id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const value = useMemo(() => ({
    incomes,
    expenses,
    categories,
    categoriesLoading,
    categoriesError,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory: addCategoryToFirebase,
    updateCategory: updateCategoryInFirebase,
    deleteCategory: deleteCategoryFromFirebase,
    getCategoriesByType,
    searchCategories,
    getCategoryStats,
    refreshCategories,
  }), [
    incomes, 
    expenses, 
    categories,
    categoriesLoading,
    categoriesError,
    addIncome, 
    updateIncome, 
    deleteIncome, 
    addExpense, 
    updateExpense, 
    deleteExpense,
    addCategoryToFirebase,
    updateCategoryInFirebase,
    deleteCategoryFromFirebase,
    getCategoriesByType,
    searchCategories,
    getCategoryStats,
    refreshCategories,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
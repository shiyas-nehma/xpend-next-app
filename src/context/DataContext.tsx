'use client';

import React, { createContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Income, Expense, Category } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncomes } from '@/hooks/useIncomes';

interface DataContextType {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  expensesLoading: boolean;
  expensesError: string | null;
  incomesLoading: boolean;
  incomesError: string | null;
  addIncome: (income: Omit<Income, 'id' | 'docId'> | Income) => Promise<Income> | void; // Promise for async create
  updateIncome: (income: Income) => Promise<void> | void;
  deleteIncome: (id: number) => Promise<void> | void;
  addExpense: (expense: Omit<Expense, 'id' | 'docId'> | Expense) => Promise<Expense> | void; // Promise for async create
  updateExpense: (expense: Expense) => Promise<void> | void;
  deleteExpense: (id: number) => Promise<void> | void;
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
  refreshExpenses: () => Promise<void>;
  refreshIncomes: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  // Expenses Firestore hook (depends on categories for category resolution)
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    addExpense: addExpenseAsync,
    updateExpense: updateExpenseAsync,
    deleteExpense: deleteExpenseAsync,
    refreshExpenses,
  } = useExpenses(categories);

  // Incomes Firestore hook (depends on categories for category resolution)
  const {
    incomes,
    loading: incomesLoading,
    error: incomesError,
    addIncome: addIncomeAsync,
    updateIncome: updateIncomeAsync,
    deleteIncome: deleteIncomeAsync,
    refreshIncomes,
  } = useIncomes(categories);

  // Wrap async income operations so existing UI that doesn't await still works
  const addIncome = useCallback((income: Omit<Income, 'id' | 'docId'> | Income) => {
    // Normalize payload removing any provided id (Firestore will issue its own)
    const { id: _ignoreId, docId: _ignoreDoc, ...rest } = income as Income;
    return addIncomeAsync(rest as Omit<Income, 'id' | 'docId'>);
  }, [addIncomeAsync]);

  const updateIncome = useCallback((income: Income) => {
    return updateIncomeAsync(income);
  }, [updateIncomeAsync]);

  const deleteIncome = useCallback((id: number) => {
    return deleteIncomeAsync(id);
  }, [deleteIncomeAsync]);

  // Wrap async expense operations so existing UI that doesn't await still works
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'docId'> | Expense) => {
    // Normalize payload removing any provided id (Firestore will issue its own)
    const { id: _ignoreId, docId: _ignoreDoc, ...rest } = expense as Expense;
    return addExpenseAsync(rest as Omit<Expense, 'id' | 'docId'>);
  }, [addExpenseAsync]);

  const updateExpense = useCallback((expense: Expense) => {
    return updateExpenseAsync(expense);
  }, [updateExpenseAsync]);

  const deleteExpense = useCallback((id: number) => {
    return deleteExpenseAsync(id);
  }, [deleteExpenseAsync]);

  const value = useMemo(() => ({
    incomes,
    expenses,
    categories,
    categoriesLoading,
    categoriesError,
    expensesLoading,
    expensesError,
    incomesLoading,
    incomesError,
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
    refreshExpenses,
    refreshIncomes,
  }), [
    incomes,
    expenses,
    categories,
    categoriesLoading,
    categoriesError,
    expensesLoading,
    expensesError,
    incomesLoading,
    incomesError,
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
    refreshExpenses,
    refreshIncomes,
  ]);  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
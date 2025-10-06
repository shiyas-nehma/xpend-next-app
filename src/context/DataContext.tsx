import React, { createContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Income, Expense, Category } from '../types';
import { mockIncomes, mockExpenses, mockCategories } from '../data/mockData';

interface DataContextType {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  addIncome: (income: Income) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (id: number) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: number) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: number) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(mockIncomes);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [categories, setCategories] = useState<Category[]>(mockCategories);

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

  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category]);
  }, []);

  const updateCategory = useCallback((updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  }, []);

  const deleteCategory = useCallback((id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const value = useMemo(() => ({
    incomes,
    expenses,
    categories,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
  }), [incomes, expenses, categories, addIncome, updateIncome, deleteIncome, addExpense, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
'use client';

import { CategoryService } from '@/lib/firebase/categoryService';
import type { Category } from '@/types';

const DEMO_USER_ID = 'demo-user-123';

export const seedDemoCategories = async (): Promise<void> => {
  const demoCategories: Omit<Category, 'id'>[] = [
    {
      name: 'Groceries',
      icon: '🛒',
      type: 'Expense',
      transactions: 12,
      amount: 450.75,
      budget: 500,
      description: 'Food and household items from supermarket'
    },
    {
      name: 'Salary',
      icon: '💰',
      type: 'Income',
      transactions: 1,
      amount: 5000,
      budget: 5000,
      description: 'Monthly salary from employer'
    },
    {
      name: 'Dining Out',
      icon: '🍔',
      type: 'Expense',
      transactions: 8,
      amount: 285.50,
      budget: 300,
      description: 'Restaurants, cafes, and food delivery'
    },
    {
      name: 'Gas',
      icon: '⛽',
      type: 'Expense',
      transactions: 4,
      amount: 180.25,
      budget: 200,
      description: 'Vehicle fuel and gas station purchases'
    },
    {
      name: 'Coffee',
      icon: '☕',
      type: 'Expense',
      transactions: 15,
      amount: 67.50,
      budget: 80,
      description: 'Daily coffee and beverage purchases'
    },
    {
      name: 'Utilities',
      icon: '💡',
      type: 'Expense',
      transactions: 3,
      amount: 150.00,
      budget: 200,
      description: 'Electricity, water, and internet bills'
    },
    {
      name: 'Entertainment',
      icon: '🎬',
      type: 'Expense',
      transactions: 6,
      amount: 125.75,
      budget: 150,
      description: 'Movies, streaming services, and games'
    },
    {
      name: 'Freelance',
      icon: '💻',
      type: 'Income',
      transactions: 3,
      amount: 1200,
      budget: 1000,
      description: 'Income from freelance projects'
    },
    {
      name: 'Shopping',
      icon: '👕',
      type: 'Expense',
      transactions: 4,
      amount: 320.90,
      budget: 400,
      description: 'Clothing and personal items'
    },
    {
      name: 'Healthcare',
      icon: '💊',
      type: 'Expense',
      transactions: 2,
      amount: 85.00,
      budget: 150,
      description: 'Medical expenses and prescriptions'
    }
  ];

  try {
    console.log('Seeding demo categories...');
    
    for (const category of demoCategories) {
      await CategoryService.addCategory(category, DEMO_USER_ID);
      console.log(`Added category: ${category.name}`);
    }
    
    console.log('Demo categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding demo categories:', error);
    throw error;
  }
};

export const clearAllCategories = async (): Promise<void> => {
  try {
    const categories = await CategoryService.getCategories(DEMO_USER_ID);
    
    for (const category of categories) {
      const firestoreId = CategoryService.getFirestoreId(category.id);
      await CategoryService.deleteCategory(firestoreId);
      console.log(`Deleted category: ${category.name}`);
    }
    
    console.log('All categories cleared successfully!');
  } catch (error) {
    console.error('Error clearing categories:', error);
    throw error;
  }
};
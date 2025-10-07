'use client';

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config.js';
import type { Category } from '@/types';

export interface FirebaseCategory {
  id?: string;
  name: string;
  icon: string;
  type: 'Expense' | 'Income';
  transactions: number;
  amount: number;
  budget: number;
  description?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COLLECTION_NAME = 'categories';

export class CategoryService {
  // Store mapping between numeric IDs and Firestore IDs
  private static idMapping = new Map<number, string>();
  private static reverseIdMapping = new Map<string, number>();
  private static idCounter = 1000000; // Start from a high number to avoid conflicts
  private static initialized = false;

  // Initialize the service and clear any existing mappings
  private static initialize() {
    if (!this.initialized) {
      this.clearIdMappings();
      this.initialized = true;
    }
  }

  // Generate a unique numeric ID for each Firestore document
  private static getNumericId(firestoreId: string): number {
    this.initialize();
    
    // Return existing mapping if it exists
    if (this.reverseIdMapping.has(firestoreId)) {
      return this.reverseIdMapping.get(firestoreId)!;
    }
    
    // Generate a unique sequential ID
    const numericId = ++this.idCounter;
    
    // Store the mapping
    this.idMapping.set(numericId, firestoreId);
    this.reverseIdMapping.set(firestoreId, numericId);
    
    return numericId;
  }

  static getFirestoreId(numericId: number): string {
    return this.idMapping.get(numericId) || '';
  }

  // Clear ID mappings (for fixing corrupted state)
  static clearIdMappings(): void {
    this.idMapping.clear();
    this.reverseIdMapping.clear();
    this.idCounter = 1000000;
  }

  // Get all categories for a user
  static async getCategories(userId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCategory;
        const numericId = this.getNumericId(doc.id);
        
        categories.push({
          id: numericId,
          docId: doc.id,
          name: data.name,
          icon: data.icon,
          type: data.type,
          transactions: data.transactions || 0,
          amount: data.amount || 0,
          budget: data.budget || 0,
          description: data.description || '',
        });
      });
      
      // Sort by creation time (newer IDs first)
      categories.sort((a, b) => b.id - a.id);
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  // Listen to real-time category updates
  static onCategoriesChange(userId: string, callback: (categories: Category[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const categories: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCategory;
        const numericId = this.getNumericId(doc.id);
        
        categories.push({
          id: numericId,
          docId: doc.id,
          name: data.name,
          icon: data.icon,
          type: data.type,
          transactions: data.transactions || 0,
          amount: data.amount || 0,
          budget: data.budget || 0,
          description: data.description || '',
        });
      });
      
      // Sort by ID (newer IDs first)
      categories.sort((a, b) => b.id - a.id);
      
      callback(categories);
    });
  }

  // Add a new category
  static async addCategory(categoryData: Omit<Category, 'id'>, userId: string): Promise<Category> {
    try {
      const newCategory: Omit<FirebaseCategory, 'id'> = {
        name: categoryData.name,
        icon: categoryData.icon,
        type: categoryData.type,
        transactions: categoryData.transactions || 0,
        amount: categoryData.amount || 0,
        budget: categoryData.budget || 0,
        description: categoryData.description || '',
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newCategory);
      const numericId = this.getNumericId(docRef.id);
      
      return {
        id: numericId,
        docId: docRef.id,
        name: categoryData.name,
        icon: categoryData.icon,
        type: categoryData.type,
        transactions: categoryData.transactions || 0,
        amount: categoryData.amount || 0,
        budget: categoryData.budget || 0,
        description: categoryData.description || '',
      };
    } catch (error) {
      console.error('Error adding category:', error);
      throw new Error('Failed to add category');
    }
  }

  // Update an existing category
  static async updateCategory(categoryId: string, categoryData: Partial<Omit<Category, 'id'>>): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, categoryId);
      
      const updateData: Partial<FirebaseCategory> = {
        ...categoryData,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  // Delete a category
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }

  // Get categories by type
  static async getCategoriesByType(userId: string, type: 'Expense' | 'Income'): Promise<Category[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('type', '==', type)
      );
      
      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCategory;
        const numericId = this.getNumericId(doc.id);
        categories.push({
          id: numericId,
          docId: doc.id,
          name: data.name,
          icon: data.icon,
          type: data.type,
          transactions: data.transactions || 0,
          amount: data.amount || 0,
          budget: data.budget || 0,
          description: data.description || '',
        });
      });
      
      // Sort by ID on client side (newer IDs first)
      categories.sort((a, b) => b.id - a.id);
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      throw new Error('Failed to fetch categories by type');
    }
  }

  // Search categories by name
  static async searchCategories(userId: string, searchTerm: string): Promise<Category[]> {
    try {
      // Note: Firestore doesn't support case-insensitive search natively
      // This is a simple implementation - for better search, consider using Algolia or similar
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCategory;
        if (data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          const numericId = this.getNumericId(doc.id);
          categories.push({
            id: numericId,
            docId: doc.id,
            name: data.name,
            icon: data.icon,
            type: data.type,
            transactions: data.transactions || 0,
            amount: data.amount || 0,
            budget: data.budget || 0,
            description: data.description || '',
          });
        }
      });
      
      return categories;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw new Error('Failed to search categories');
    }
  }

  // Update category amount (for transactions)
  static async updateCategoryAmount(categoryId: string, amount: number, increment: boolean = true): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, categoryId);
      
      // In a real application, you might want to use Firestore transactions for this
      // to ensure data consistency
      const updateData = {
        amount: increment ? amount : -amount,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Error updating category amount:', error);
      throw new Error('Failed to update category amount');
    }
  }

  // Get category statistics
  static async getCategoryStats(userId: string): Promise<{
    totalExpenseCategories: number;
    totalIncomeCategories: number;
    totalBudget: number;
    totalSpent: number;
  }> {
    try {
      const categories = await this.getCategories(userId);
      
      const expenseCategories = categories.filter(c => c.type === 'Expense');
      const incomeCategories = categories.filter(c => c.type === 'Income');
      
      const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
      const totalSpent = expenseCategories.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      return {
        totalExpenseCategories: expenseCategories.length,
        totalIncomeCategories: incomeCategories.length,
        totalBudget,
        totalSpent,
      };
    } catch (error) {
      console.error('Error getting category stats:', error);
      throw new Error('Failed to get category statistics');
    }
  }
}
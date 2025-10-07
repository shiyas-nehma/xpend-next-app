'use client';

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  where,
  query,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config.js';
import type { Expense, Category, Recurrence } from '@/types';
import { CategoryService } from './categoryService';

export interface FirebaseExpense {
  id?: string;
  amount: number;
  description: string;
  date: Timestamp;
  paymentMethod: 'Card' | 'Cash' | 'Bank';
  categoryId: string; // Firestore category document ID
  categoryName: string;
  categoryIcon: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  recurrence?: Recurrence; // Stored as plain object
}

const COLLECTION_NAME = 'expenses';

export class ExpenseService {
  private static idMapping = new Map<number, string>();
  private static reverseIdMapping = new Map<string, number>();
  private static idCounter = 5000000; // separate range from categories
  private static initialized = false;

  private static initialize() {
    if (!this.initialized) {
      this.clearIdMappings();
      this.initialized = true;
    }
  }

  private static getNumericId(firestoreId: string): number {
    this.initialize();
    if (this.reverseIdMapping.has(firestoreId)) {
      return this.reverseIdMapping.get(firestoreId)!;
    }
    const numericId = ++this.idCounter;
    this.idMapping.set(numericId, firestoreId);
    this.reverseIdMapping.set(firestoreId, numericId);
    return numericId;
  }

  static getFirestoreId(numericId: number): string {
    return this.idMapping.get(numericId) || '';
  }

  static clearIdMappings(): void {
    this.idMapping.clear();
    this.reverseIdMapping.clear();
    this.idCounter = 5000000;
  }

  // Build domain Expense from Firebase doc data
  private static buildExpense(docId: string, data: FirebaseExpense, category?: Category): Expense {
    const numericId = this.getNumericId(docId);
    // If category not provided, build minimal from denormalized fields
    const categoryObj: Category = category || {
      id: -1, // placeholder (UI shouldn't rely on numeric category id here)
      name: data.categoryName,
      icon: data.categoryIcon,
      type: 'Expense',
      transactions: 0,
      amount: 0,
      budget: 0,
      docId: data.categoryId,
      description: '',
    };
    return {
      id: numericId,
      docId,
      amount: data.amount,
      description: data.description,
      date: data.date.toDate().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod,
      category: categoryObj,
      recurrence: data.recurrence,
    };
  }

  static async getExpenses(userId: string, categories: Category[]): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const expenses: Expense[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as FirebaseExpense;
        const category = categories.find(c => c.docId === data.categoryId);
        expenses.push(this.buildExpense(docSnap.id, data, category));
      });
      // Sort by date descending
      expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return expenses;
    } catch (e) {
      console.error('Error fetching expenses', e);
      throw new Error('Failed to fetch expenses');
    }
  }

  static onExpensesChange(userId: string, categories: Category[], callback: (expenses: Expense[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const expenses: Expense[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as FirebaseExpense;
        const category = categories.find(c => c.docId === data.categoryId);
        expenses.push(this.buildExpense(docSnap.id, data, category));
      });
      expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(expenses);
    });
  }

  static async addExpense(expenseData: Omit<Expense, 'id' | 'docId'>, userId: string): Promise<Expense> {
    try {
      const categoryFirestoreId = expenseData.category.docId || CategoryService.getFirestoreId(expenseData.category.id);
      if (!categoryFirestoreId) {
        console.error('addExpense: missing categoryFirestoreId', { providedCategory: expenseData.category });
        throw new Error('Invalid category');
      }
      // Build base document data
      const firebaseExpense: any = {
        amount: expenseData.amount,
        description: expenseData.description,
        date: Timestamp.fromDate(new Date(expenseData.date)),
        paymentMethod: expenseData.paymentMethod,
        categoryId: categoryFirestoreId,
        categoryName: expenseData.category.name,
        categoryIcon: expenseData.category.icon,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Only add recurrence field if it's valid (never add undefined)
      if (expenseData.recurrence) {
        const { frequency, end } = expenseData.recurrence;
        if (end.type === 'Never') {
          firebaseExpense.recurrence = { frequency, end: { type: 'Never' } };
        } else if (end.type === 'After' && typeof end.value === 'number') {
          firebaseExpense.recurrence = { frequency, end: { type: 'After', value: end.value } };
        } else if (end.type === 'OnDate' && typeof end.value === 'string' && end.value) {
          firebaseExpense.recurrence = { frequency, end: { type: 'OnDate', value: end.value } };
        }
      }
      if (!userId) {
        console.error('addExpense: userId missing');
        throw new Error('Not authenticated');
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), firebaseExpense);
      return this.buildExpense(docRef.id, { ...firebaseExpense, id: docRef.id } as FirebaseExpense);
    } catch (e) {
      console.error('Error adding expense (detailed)', e);
      if (e instanceof Error) {
        throw e.message === 'Invalid category' || e.message === 'Not authenticated' ? e : new Error('Failed to add expense');
      }
      throw new Error('Failed to add expense');
    }
  }

  static async updateExpense(expenseId: string, updated: Partial<Omit<Expense, 'id' | 'docId'>>): Promise<void> {
    try {
      const expenseRef = doc(db, COLLECTION_NAME, expenseId);
      const updateData: any = { updatedAt: Timestamp.now() };
      
      // Only add fields that are actually being updated
      if (updated.amount !== undefined) updateData.amount = updated.amount;
      if (updated.description !== undefined) updateData.description = updated.description;
      if (updated.paymentMethod !== undefined) updateData.paymentMethod = updated.paymentMethod;
      
      if (updated.date) {
        updateData.date = Timestamp.fromDate(new Date(updated.date));
      }
      if (updated.category) {
        const categoryFirestoreId = updated.category.docId || CategoryService.getFirestoreId(updated.category.id);
        updateData.categoryId = categoryFirestoreId;
        updateData.categoryName = updated.category.name;
        updateData.categoryIcon = updated.category.icon;
      }
      if (updated.recurrence !== undefined) {
        if (updated.recurrence === null) {
          updateData.recurrence = null; // Explicitly remove recurrence
        } else {
          const { frequency, end } = updated.recurrence;
          if (end.type === 'Never') {
            updateData.recurrence = { frequency, end: { type: 'Never' } };
          } else if (end.type === 'After' && typeof end.value === 'number') {
            updateData.recurrence = { frequency, end: { type: 'After', value: end.value } };
          } else if (end.type === 'OnDate' && typeof end.value === 'string' && end.value) {
            updateData.recurrence = { frequency, end: { type: 'OnDate', value: end.value } };
          } else {
            updateData.recurrence = null; // Invalid recurrence, remove it
          }
        }
      }
      
      await updateDoc(expenseRef, updateData);
    } catch (e) {
      console.error('Error updating expense', e);
      throw new Error('Failed to update expense');
    }
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      const expenseRef = doc(db, COLLECTION_NAME, expenseId);
      await deleteDoc(expenseRef);
    } catch (e) {
      console.error('Error deleting expense', e);
      throw new Error('Failed to delete expense');
    }
  }
}

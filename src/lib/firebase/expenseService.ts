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
  recurrenceParentId?: string; // Parent recurring expense doc ID
  generated?: boolean; // Flag for generated instance
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
      recurrenceParentId: data.recurrenceParentId,
      generated: data.generated,
    };
  }

  static async getExpenses(userId: string, categories: Category[]): Promise<Expense[]> {
    try {
      // Ensure categories is always an array
      const safeCategories = Array.isArray(categories) ? categories : [];
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const expenses: Expense[] = [];
      snapshot.forEach(docSnap => {
        try {
          const data = docSnap.data() as FirebaseExpense;
          if (!data) return; // Skip invalid data
          const category = safeCategories.find(c => c && c.docId === data.categoryId);
          expenses.push(this.buildExpense(docSnap.id, data, category));
        } catch (buildError) {
          console.error('Error building expense item:', buildError);
          // Continue processing other items instead of failing completely
        }
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
    try {
      // Ensure categories is always an array
      const safeCategories = Array.isArray(categories) ? categories : [];
      
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        try {
          const expenses: Expense[] = [];
          snapshot.forEach(docSnap => {
            try {
              const data = docSnap.data() as FirebaseExpense;
              if (!data) return; // Skip invalid data
              const category = safeCategories.find(c => c && c.docId === data.categoryId);
              expenses.push(this.buildExpense(docSnap.id, data, category));
            } catch (buildError) {
              console.error('Error building expense item:', buildError);
              // Continue processing other items instead of failing completely
            }
          });
          expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          callback(expenses);
        } catch (snapshotError: any) {
          const msg = snapshotError instanceof Error ? snapshotError.message : 'unknown error';
          console.log('Error processing expense snapshot:', msg);
          callback([]); // Return empty array on error
        }
      }, (error) => {
        console.log('Expense real-time listener error:', error?.message);
        callback([]); // Return empty array on error
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      console.log('Error setting up expense listener:', msg);
      // Return a no-op unsubscribe function
      return () => {};
    }
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
      // Allow explicit clearing of recurrenceParentId / generated to detach an instance
      if ((updated as any).recurrenceParentId === null) {
        updateData.recurrenceParentId = null;
      }
      if ((updated as any).generated === false) {
        updateData.generated = false;
      }
      if (updated.recurrence !== undefined) {
        if (updated.recurrence === null) {
          updateData.recurrence = null; // Explicitly remove recurrence
        } else {
          const { frequency, end } = updated.recurrence;
          const status = updated.recurrence.status || 'Active';
          if (end.type === 'Never') {
            updateData.recurrence = { frequency, end: { type: 'Never' }, status };
          } else if (end.type === 'After' && typeof end.value === 'number') {
            updateData.recurrence = { frequency, end: { type: 'After', value: end.value }, status };
          } else if (end.type === 'OnDate' && typeof end.value === 'string' && end.value) {
            updateData.recurrence = { frequency, end: { type: 'OnDate', value: end.value }, status };
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

  /** Stop a recurrence on a parent expense (remove its recurrence definition). */
  static async stopRecurrence(expenseId: string): Promise<void> {
    try {
      const expenseRef = doc(db, COLLECTION_NAME, expenseId);
      await updateDoc(expenseRef, { recurrence: null, updatedAt: Timestamp.now() });
    } catch (e) {
      console.error('Error stopping recurrence', e);
      throw new Error('Failed to stop recurrence');
    }
  }

  /** Detach a generated instance so it no longer belongs to the parent recurrence. */
  static async detachInstance(expenseId: string): Promise<void> {
    try {
      const expenseRef = doc(db, COLLECTION_NAME, expenseId);
      await updateDoc(expenseRef, { recurrenceParentId: null, generated: false, updatedAt: Timestamp.now() });
    } catch (e) {
      console.error('Error detaching expense instance', e);
      throw new Error('Failed to detach instance');
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

  /**
   * Generate missing recurring expense instances up to (and including) today.
   * This is a client-triggered catch-up mechanism; in production a backend scheduler is preferable.
   */
  static async generateMissingRecurringExpenses(userId: string): Promise<void> {
    try {
      const qAll = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const snapshot = await getDocs(qAll);
      const parentExpenses: { docId: string; data: FirebaseExpense }[] = [];
      const all: { docId: string; data: FirebaseExpense }[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as FirebaseExpense;
        all.push({ docId: docSnap.id, data });
  if (data.recurrence && data.recurrence.status !== 'Paused' && !data.generated) {
          parentExpenses.push({ docId: docSnap.id, data });
        }
      });

      if (!parentExpenses.length) return; // Nothing to do

      const existingByParentAndDate = new Map<string, Set<string>>(); // key parentId -> set(dateStr)
      all.forEach(({ data, docId }) => {
        const parentId = data.recurrenceParentId || docId; // parent has no recurrenceParentId
        const dateStr = data.date.toDate().toISOString().split('T')[0];
        if (!existingByParentAndDate.has(parentId)) existingByParentAndDate.set(parentId, new Set());
        existingByParentAndDate.get(parentId)!.add(dateStr);
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr + 'T00:00:00');

      const adds: Omit<FirebaseExpense, 'id'>[] = [];

      const addDays = (date: Date, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
      const addMonths = (date: Date, months: number) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; };
      const addYears = (date: Date, years: number) => { const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d; };

      for (const { docId, data } of parentExpenses) {
        const rec = data.recurrence;
        if (!rec) continue;

        const baseDate = data.date.toDate();
        let cursor = new Date(baseDate);
        const parentDates = existingByParentAndDate.get(docId) || new Set();

        // Determine limits
        let occurrenceLimit: number | undefined;
        let endDateLimit: Date | undefined;
        if (rec.end.type === 'After' && typeof rec.end.value === 'number') {
          occurrenceLimit = rec.end.value; // total occurrences including parent
        } else if (rec.end.type === 'OnDate' && typeof rec.end.value === 'string') {
          endDateLimit = new Date(rec.end.value + 'T00:00:00');
        }

        // Count existing occurrences
        const existingCount = Array.from(parentDates).length; // includes parent and generated instances
        if (occurrenceLimit && existingCount >= occurrenceLimit) continue; // already satisfied

        // Generate forward
        let safety = 0;
        while (safety < 730) { // cap 2 years of forward gen safeguard
          safety++;
          // Move cursor to next occurrence (first loop: advance once)
          switch (rec.frequency) {
            case 'Daily': cursor = addDays(cursor, 1); break;
            case 'Weekly': cursor = addDays(cursor, 7); break;
            case 'Monthly': cursor = addMonths(cursor, 1); break;
            case 'Yearly': cursor = addYears(cursor, 1); break;
          }
          const cursorStr = cursor.toISOString().split('T')[0];

            // Stop if beyond today
          if (cursor > today) break;
          // Stop if end date limit
          if (endDateLimit && cursor > endDateLimit) break;
          // Stop if occurrence limit would be exceeded ( +1 prospective )
          const projectedCount = (existingCount + adds.filter(a => a.recurrenceParentId === docId).length) + 1;
          if (occurrenceLimit && projectedCount > occurrenceLimit) break;
          // Skip if already exists
          if (parentDates.has(cursorStr) || adds.some(a => a.recurrenceParentId === docId && a.date.toDate().toISOString().startsWith(cursorStr))) {
            continue;
          }
          // Queue generation
          adds.push({
            amount: data.amount,
            description: data.description,
            date: Timestamp.fromDate(new Date(cursorStr + 'T00:00:00')),
            paymentMethod: data.paymentMethod,
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            categoryIcon: data.categoryIcon,
            userId: data.userId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            recurrenceParentId: docId,
            generated: true,
            // Do NOT copy recurrence onto generated instances to prevent cascading; parent holds the rule
          });
        }
      }

      // Batch add (sequential for simplicity)
      for (const exp of adds) {
        await addDoc(collection(db, COLLECTION_NAME), exp);
      }
    } catch (e) {
      console.error('generateMissingRecurringExpenses failed', e);
    }
  }
}

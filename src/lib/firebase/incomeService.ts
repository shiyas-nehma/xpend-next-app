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
import type { Income, Category, Recurrence } from '@/types';
import { CategoryService } from './categoryService';

export interface FirebaseIncome {
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
  recurrenceParentId?: string; // Parent recurring income doc ID
  generated?: boolean; // Flag for generated instance
}

const COLLECTION_NAME = 'incomes';

export class IncomeService {
  private static idMapping = new Map<number, string>();
  private static reverseIdMapping = new Map<string, number>();
  private static idCounter = 6000000; // separate range from categories/expenses
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
    this.idCounter = 6000000;
  }

  // Build domain Income from Firebase doc data
  private static buildIncome(docId: string, data: FirebaseIncome, category?: Category): Income {
    const numericId = this.getNumericId(docId);
    // If category not provided, build minimal from denormalized fields
    const categoryObj: Category = category || {
      id: -1, // placeholder (UI shouldn't rely on numeric category id here)
      name: data.categoryName,
      icon: data.categoryIcon,
      type: 'Income',
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

  static async getIncomes(userId: string, categories: Category[]): Promise<Income[]> {
    try {
      // Ensure categories is always an array
      const safeCategories = Array.isArray(categories) ? categories : [];
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const incomes: Income[] = [];
      snapshot.forEach(docSnap => {
        try {
          const data = docSnap.data() as FirebaseIncome;
          if (!data) return; // Skip invalid data
          const category = safeCategories.find(c => c && c.docId === data.categoryId);
          incomes.push(this.buildIncome(docSnap.id, data, category));
        } catch (buildError) {
          console.error('Error building income item:', buildError);
          // Continue processing other items instead of failing completely
        }
      });
      // Sort by date descending
      incomes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return incomes;
    } catch (e) {
      console.error('Error fetching incomes', e);
      throw new Error('Failed to fetch incomes');
    }
  }

  static onIncomesChange(userId: string, categories: Category[], callback: (incomes: Income[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const incomes: Income[] = [];
      // Ensure categories is always an array
      const safeCategories = Array.isArray(categories) ? categories : [];
      
      snapshot.forEach(docSnap => {
        try {
          const data = docSnap.data() as FirebaseIncome;
          if (!data) return; // Skip invalid data
          const category = safeCategories.find(c => c && c.docId === data.categoryId);
          incomes.push(this.buildIncome(docSnap.id, data, category));
        } catch (buildError) {
          console.error('Error building income item in snapshot:', buildError);
          // Continue processing other items instead of failing completely
        }
      });
      incomes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(incomes);
    }, (error) => {
      // Handle permission-denied and other listener errors silently
      console.log('Income real-time listener error:', error?.message);
      // Return empty array on listener error to prevent app crashes
      callback([]);
    });
  }

  static async addIncome(incomeData: Omit<Income, 'id' | 'docId'>, userId: string): Promise<Income> {
    try {
      const categoryFirestoreId = incomeData.category.docId || CategoryService.getFirestoreId(incomeData.category.id);
      if (!categoryFirestoreId) {
        console.error('addIncome: missing categoryFirestoreId', { providedCategory: incomeData.category });
        throw new Error('Invalid category');
      }
      
      // Build base document data
      const firebaseIncome: any = {
        amount: incomeData.amount,
        description: incomeData.description,
        date: Timestamp.fromDate(new Date(incomeData.date)),
        paymentMethod: incomeData.paymentMethod,
        categoryId: categoryFirestoreId,
        categoryName: incomeData.category.name,
        categoryIcon: incomeData.category.icon,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Only add recurrence field if it's valid (never add undefined)
      if (incomeData.recurrence) {
        const { frequency, end } = incomeData.recurrence;
        if (end.type === 'Never') {
          firebaseIncome.recurrence = { frequency, end: { type: 'Never' } };
        } else if (end.type === 'After' && typeof end.value === 'number') {
          firebaseIncome.recurrence = { frequency, end: { type: 'After', value: end.value } };
        } else if (end.type === 'OnDate' && typeof end.value === 'string' && end.value) {
          firebaseIncome.recurrence = { frequency, end: { type: 'OnDate', value: end.value } };
        }
      }
      
      if (!userId) {
        console.error('addIncome: userId missing');
        throw new Error('Not authenticated');
      }
      const docRef = await addDoc(collection(db, COLLECTION_NAME), firebaseIncome);
      return this.buildIncome(docRef.id, { ...firebaseIncome, id: docRef.id } as FirebaseIncome);
    } catch (e) {
      console.error('Error adding income (detailed)', e);
      if (e instanceof Error) {
        throw e.message === 'Invalid category' || e.message === 'Not authenticated' ? e : new Error('Failed to add income');
      }
      throw new Error('Failed to add income');
    }
  }

  static async updateIncome(incomeId: string, updated: Partial<Omit<Income, 'id' | 'docId'>>): Promise<void> {
    try {
      const incomeRef = doc(db, COLLECTION_NAME, incomeId);
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
      // Allow explicit clearing / detaching
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
      
      await updateDoc(incomeRef, updateData);
    } catch (e) {
      console.error('Error updating income', e);
      throw new Error('Failed to update income');
    }
  }

  static async stopRecurrence(incomeId: string): Promise<void> {
    try {
      const incomeRef = doc(db, COLLECTION_NAME, incomeId);
      await updateDoc(incomeRef, { recurrence: null, updatedAt: Timestamp.now() });
    } catch (e) {
      console.error('Error stopping recurrence (income)', e);
      throw new Error('Failed to stop recurrence');
    }
  }

  static async detachInstance(incomeId: string): Promise<void> {
    try {
      const incomeRef = doc(db, COLLECTION_NAME, incomeId);
      await updateDoc(incomeRef, { recurrenceParentId: null, generated: false, updatedAt: Timestamp.now() });
    } catch (e) {
      console.error('Error detaching income instance', e);
      throw new Error('Failed to detach instance');
    }
  }

  static async deleteIncome(incomeId: string): Promise<void> {
    try {
      const incomeRef = doc(db, COLLECTION_NAME, incomeId);
      await deleteDoc(incomeRef);
    } catch (e) {
      console.error('Error deleting income', e);
      throw new Error('Failed to delete income');
    }
  }

  /** Generate missing recurring income instances up to today (client-side catch-up). */
  static async generateMissingRecurringIncomes(userId: string): Promise<void> {
    try {
      const qAll = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const snapshot = await getDocs(qAll);
      const parentIncomes: { docId: string; data: FirebaseIncome }[] = [];
      const all: { docId: string; data: FirebaseIncome }[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as FirebaseIncome;
        all.push({ docId: docSnap.id, data });
  if (data.recurrence && data.recurrence.status !== 'Paused' && !data.generated) parentIncomes.push({ docId: docSnap.id, data });
      });
      if (!parentIncomes.length) return;

      const existingByParentAndDate = new Map<string, Set<string>>();
      all.forEach(({ docId, data }) => {
        const parentId = data.recurrenceParentId || docId;
        const dateStr = data.date.toDate().toISOString().split('T')[0];
        if (!existingByParentAndDate.has(parentId)) existingByParentAndDate.set(parentId, new Set());
        existingByParentAndDate.get(parentId)!.add(dateStr);
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr + 'T00:00:00');
      const adds: Omit<FirebaseIncome, 'id'>[] = [];

      const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
      const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
      const addYears = (d: Date, n: number) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x; };

      for (const { docId, data } of parentIncomes) {
        const rec = data.recurrence; if (!rec) continue;
        let cursor = new Date(data.date.toDate());
        const parentDates = existingByParentAndDate.get(docId) || new Set();
        let occurrenceLimit: number | undefined;
        let endDateLimit: Date | undefined;
        if (rec.end.type === 'After' && typeof rec.end.value === 'number') occurrenceLimit = rec.end.value;
        else if (rec.end.type === 'OnDate' && typeof rec.end.value === 'string') endDateLimit = new Date(rec.end.value + 'T00:00:00');
        const existingCount = Array.from(parentDates).length;
        if (occurrenceLimit && existingCount >= occurrenceLimit) continue;
        let safety = 0;
        while (safety < 730) {
          safety++;
            switch (rec.frequency) {
              case 'Daily': cursor = addDays(cursor, 1); break;
              case 'Weekly': cursor = addDays(cursor, 7); break;
              case 'Monthly': cursor = addMonths(cursor, 1); break;
              case 'Yearly': cursor = addYears(cursor, 1); break;
            }
          const cursorStr = cursor.toISOString().split('T')[0];
          if (cursor > today) break;
          if (endDateLimit && cursor > endDateLimit) break;
          const projectedCount = (existingCount + adds.filter(a => a.recurrenceParentId === docId).length) + 1;
          if (occurrenceLimit && projectedCount > occurrenceLimit) break;
          if (parentDates.has(cursorStr) || adds.some(a => a.recurrenceParentId === docId && a.date.toDate().toISOString().startsWith(cursorStr))) continue;
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
          });
        }
      }
      for (const inc of adds) await addDoc(collection(db, COLLECTION_NAME), inc);
    } catch (e) {
      console.error('generateMissingRecurringIncomes failed', e);
    }
  }
}
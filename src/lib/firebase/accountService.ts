import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Account } from '@/types';

const COLLECTION_NAME = 'accounts';

export interface AccountData extends Omit<Account, 'id' | 'lastUpdated'> {
  userId: string;
  lastUpdated?: Date;
}

export interface FirestoreAccount extends AccountData {
  firestoreId: string;
  lastUpdated: Date;
}

// Store mapping between numeric IDs and Firestore document IDs
const idMappings = new Map<number, string>();
let nextId = 1;

// Helper function to check if Firestore is properly initialized
const checkFirestoreConnection = () => {
  if (!db) {
    throw new Error('Firestore database is not initialized');
  }
};

// Test function to verify Firestore connection
export const testFirestoreConnection = async () => {
  try {
    checkFirestoreConnection();
    console.log('Testing Firestore connection...');
    
    // Try to access the accounts collection
    const accountsRef = collection(db, COLLECTION_NAME);
    console.log('Accounts collection reference created successfully');
    
    return { success: true, message: 'Firestore connection is working' };
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown connection error' 
    };
  }
};

// Get all accounts for a user
export const getAccounts = async (userId: string): Promise<Account[]> => {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    checkFirestoreConnection();
    console.log('Fetching accounts for user:', userId);
    
    const accountsRef = collection(db, COLLECTION_NAME);
    // Simplified query without orderBy to avoid index issues
    const q = query(
      accountsRef, 
      where('userId', '==', userId)
    );
    
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot received, docs count:', querySnapshot.size);
    
    const accounts: Account[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      console.log('Processing document:', docSnapshot.id, data);
      
      const numericId = nextId++;
      idMappings.set(numericId, docSnapshot.id);
      
      accounts.push({
        id: numericId,
        name: data.name,
        type: data.type,
        balance: data.balance,
        institution: data.institution,
        description: data.description,
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    // Sort accounts by lastUpdated in JavaScript instead of Firestore
    accounts.sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());
    
    console.log('Returning accounts:', accounts);
    return accounts;
  } catch (error) {
    console.error('Detailed error in getAccounts:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      errorDetails: (error as any)?.details,
      userId
    });
    throw new Error('Failed to fetch accounts');
  }
};

// Add a new account
export const addAccount = async (accountData: AccountData): Promise<Account> => {
  try {
    checkFirestoreConnection();
    console.log('Adding account - Input data:', accountData);
    console.log('Database object:', db);
    console.log('Collection name:', COLLECTION_NAME);
    
    // Create clean document data without undefined fields
    const docData = {
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance,
      institution: accountData.institution || '',
      description: accountData.description || '',
      userId: accountData.userId,
      lastUpdated: Timestamp.now(),
    };
    
    console.log('Document data to be saved:', docData);
    console.log('About to call addDoc...');
    
    const accountsCollection = collection(db, COLLECTION_NAME);
    console.log('Collection reference:', accountsCollection);
    
    const docRef = await addDoc(accountsCollection, docData);
    console.log('Document added successfully with ID:', docRef.id);
    
    const numericId = nextId++;
    idMappings.set(numericId, docRef.id);
    
    console.log('Account added successfully with ID:', docRef.id);
    
    return {
      id: numericId,
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance,
      institution: accountData.institution,
      description: accountData.description,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error adding account - Full error object:', error);
    console.error('Error adding account - Details:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      errorStack: error instanceof Error ? error.stack : 'No stack',
      accountData
    });
    
    // More specific error message based on the error type
    let errorMessage = 'Failed to add account';
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Permission denied: Check Firestore security rules';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error: Check internet connection';
      } else if (error.message.includes('quota')) {
        errorMessage = 'Quota exceeded: Check Firestore limits';
      } else if (error.message.includes('invalid-argument')) {
        errorMessage = `Invalid data: ${error.message}`;
      } else {
        errorMessage = `Failed to add account: ${error.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

// Update an existing account
export const updateAccount = async (accountId: number, accountData: Partial<AccountData>): Promise<void> => {
  try {
    const firestoreId = idMappings.get(accountId);
    if (!firestoreId) {
      throw new Error('Account not found');
    }
    
    const docRef = doc(db, COLLECTION_NAME, firestoreId);
    const updateData = {
      ...accountData,
      lastUpdated: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating account:', error);
    throw new Error('Failed to update account');
  }
};

// Delete an account
export const deleteAccount = async (accountId: number): Promise<void> => {
  try {
    const firestoreId = idMappings.get(accountId);
    if (!firestoreId) {
      throw new Error('Account not found');
    }
    
    const docRef = doc(db, COLLECTION_NAME, firestoreId);
    await deleteDoc(docRef);
    idMappings.delete(accountId);
  } catch (error) {
    console.error('Error deleting account:', error);
    throw new Error('Failed to delete account');
  }
};

// Get account by ID
export const getAccountById = async (accountId: number, userId: string): Promise<Account | null> => {
  try {
    const accounts = await getAccounts(userId);
    return accounts.find(account => account.id === accountId) || null;
  } catch (error) {
    console.error('Error fetching account by ID:', error);
    throw new Error('Failed to fetch account');
  }
};
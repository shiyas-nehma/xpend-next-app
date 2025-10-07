export interface Account {
  id: number;
  name: string;
  type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Loan';
  balance: number;
  institution?: string;
  lastUpdated?: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  type: 'Expense' | 'Income';
  transactions: number;
  amount: number;
  budget: number;
  description?: string;
  /** Firestore document ID (string) for stable identification */
  docId?: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: Category;
  date: string;
  account?: Account;
  paymentMethod: 'Card' | 'Cash' | 'Bank';
  recurrence?: Recurrence;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string; // ISO string for simplicity
  paymentMethod: 'Card' | 'Cash' | 'Bank';
  category: Category;
  recurrence?: Recurrence;
}

export interface Income {
  id: number;
  amount: number;
  description: string;
  category: Category;
  date: string;
  account?: Account;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  deadline: string;
  description?: string;
  icon?: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  category: string;
  coverImage: string;
  excerpt: string;
  content: string;
}
export interface Recurrence {
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  end: {
    type: 'Never' | 'After' | 'OnDate';
    value?: number | string; // Occurrences or date string
  };
}


export interface Campaign {
  name: string;
  followers: string;
  change: string;
  avatars: string[];
}

export interface PopularCampaign {
  rank: number;
  name: string;
  admin: { name: string; avatar: string; isYou?: boolean };
  dateAdded: string;
  business: string;
  followers: { avatars: string[]; count: string };
  status: 'Public' | 'Private';
  operation: 'Join' | 'Request';
}


export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}



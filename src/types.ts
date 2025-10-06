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
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: Category;
  date: string;
  account?: Account;
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
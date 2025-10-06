

import type { Expense, Category, Income, Goal, Account } from '../types';

export const mockCategories: Category[] = [
  { id: 1, name: 'Groceries', icon: '🛒', type: 'Expense', transactions: 12, amount: 450.75, budget: 600, description: 'Weekly food and household supplies.' },
  { id: 2, name: 'Salary', icon: '💰', type: 'Income', transactions: 1, amount: 5000, budget: 0, description: 'Primary monthly income source.' },
  { id: 3, name: 'Utilities', icon: '💡', type: 'Expense', transactions: 3, amount: 180.50, budget: 200, description: 'Electricity, water, and internet bills.' },
  { id: 4, name: 'Freelance', icon: '💻', type: 'Income', transactions: 5, amount: 1200, budget: 2500, description: '' },
  { id: 5, name: 'Entertainment', icon: '🎬', type: 'Expense', transactions: 8, amount: 250, budget: 200, description: 'Movies, concerts, and dining out.' },
  { id: 6, name: 'Investments', icon: '📈', type: 'Income', transactions: 2, amount: 750, budget: 1000, description: 'Contributions to investment portfolio.' },
  { id: 7, name: 'Transport', icon: '🚗', type: 'Expense', transactions: 15, amount: 120.00, budget: 150, description: 'Public transport and ride-sharing.' },
  { id: 8, name: 'Shopping', icon: '👕', type: 'Expense', transactions: 4, amount: 320.00, budget: 400, description: 'Clothing and personal items.' },

];

// Find categories to link to expenses
const groceriesCategory = mockCategories.find(c => c.name === 'Groceries')!;
const utilitiesCategory = mockCategories.find(c => c.name === 'Utilities')!;
const entertainmentCategory = mockCategories.find(c => c.name === 'Entertainment')!;
const transportCategory = mockCategories.find(c => c.name === 'Transport')!;

const expensesData: Omit<Expense, 'id'>[] = [
    { description: 'Weekly grocery run', amount: 112.50, date: '2024-07-22', paymentMethod: 'Card', category: groceriesCategory },
    { description: 'Movie night tickets', amount: 35.00, date: '2024-07-21', paymentMethod: 'Card', category: entertainmentCategory },
    { description: 'Electricity Bill', amount: 85.70, date: '2024-07-20', paymentMethod: 'Bank', category: utilitiesCategory, recurrence: { frequency: 'Monthly', end: { type: 'Never' } } },
    { description: 'Morning Coffee', amount: 5.25, date: '2024-07-22', paymentMethod: 'Cash', category: groceriesCategory },
    { description: 'Bus fare', amount: 2.75, date: '2024-07-19', paymentMethod: 'Cash', category: transportCategory },
    { description: 'Dinner with friends', amount: 78.90, date: '2024-07-18', paymentMethod: 'Card', category: entertainmentCategory },
];

export const mockExpenses: Expense[] = expensesData.map((e, index) => ({...e, id: Date.now() + index }));


// Find income categories to link to incomes
const salaryCategory = mockCategories.find(c => c.name === 'Salary')!;
const freelanceCategory = mockCategories.find(c => c.name === 'Freelance')!;
const investmentsCategory = mockCategories.find(c => c.name === 'Investments')!;

const incomeData: Omit<Income, 'id'>[] = [
    { description: 'Monthly Salary', amount: 5000.00, date: '2024-07-01', paymentMethod: 'Bank', category: salaryCategory, recurrence: { frequency: 'Monthly', end: { type: 'Never' } } },
    { description: 'Freelance Project - Web Design', amount: 850.00, date: '2024-07-15', paymentMethod: 'Bank', category: freelanceCategory },
    { description: 'Stock Dividends', amount: 125.50, date: '2024-07-10', paymentMethod: 'Bank', category: investmentsCategory, recurrence: { frequency: 'Yearly', end: { type: 'Never' } } },
    { description: 'Sold old laptop', amount: 300.00, date: '2024-07-18', paymentMethod: 'Cash', category: investmentsCategory },
    { description: 'Client payment - Logo design', amount: 450.00, date: '2024-07-22', paymentMethod: 'Card', category: freelanceCategory },
];

export const mockIncomes: Income[] = incomeData.map((i, index) => ({...i, id: Date.now() + 100 + index }));

export const mockGoals: Goal[] = [
  {
    id: 1,
    title: 'Launch New Website',
    description: 'Complete the final design, development, and deployment of the new company website.',
    progress: 75,
    status: 'Active',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(), // Due in 15 days
    tags: ['Marketing', 'Web', 'Q3'],
  },
  {
    id: 2,
    title: 'Develop Q4 Marketing Plan',
    description: 'Create a comprehensive marketing strategy for the upcoming quarter, including budget and KPIs.',
    progress: 20,
    status: 'Active',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(), // Due in 45 days
    tags: ['Marketing', 'Strategy'],
  },
  {
    id: 3,
    title: 'Hire a New Frontend Developer',
    description: 'Post job descriptions, conduct interviews, and hire a skilled frontend developer for the team.',
    progress: 100,
    status: 'Completed',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), // Completed 10 days ago
    tags: ['Hiring', 'HR', 'Development'],
  },
  {
    id: 4,
    title: 'Organize Team Offsite Event',
    description: 'Plan and execute a team-building offsite event for all employees.',
    progress: 50,
    status: 'Paused',
    priority: 'Low',
    deadline: null,
    tags: ['HR', 'Team'],
  },
  {
    id: 5,
    title: 'Update Mobile App UI',
    description: 'Redesign the user interface for the mobile application based on user feedback.',
    progress: 10,
    status: 'Active',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // Overdue by 5 days
    tags: ['Mobile', 'UI/UX', 'Design'],
  },
  {
    id: 6,
    title: 'Research Competitor Landscape',
    description: 'Conduct a thorough analysis of key competitors and their product offerings.',
    progress: 90,
    status: 'Active',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), // Due soon
    tags: ['Strategy', 'Research'],
  },
];

export const mockAccounts: Account[] = [
    { id: 1, name: 'Chase Checking', type: 'Checking', balance: 12540.50, institution: 'Chase Bank', lastUpdated: '2024-07-22T10:00:00Z' },
    { id: 2, name: 'High-Yield Savings', type: 'Savings', balance: 55210.00, institution: 'Ally Bank', lastUpdated: '2024-07-22T10:05:00Z' },
    { id: 3, name: 'Sapphire Preferred', type: 'Credit Card', balance: -1230.75, institution: 'Chase Bank', lastUpdated: '2024-07-21T15:30:00Z' },
    { id: 4, name: 'Robinhood Portfolio', type: 'Investment', balance: 23500.00, institution: 'Robinhood', lastUpdated: '2024-07-22T11:00:00Z' },
    { id: 5, name: 'Student Loan', type: 'Loan', balance: -25000.00, institution: 'FedLoan Servicing', lastUpdated: '2024-07-01T00:00:00Z' },
    { id: 6, name: 'Personal Savings', type: 'Savings', balance: 5000.00, institution: 'Bank of America', lastUpdated: '2024-07-20T09:00:00Z' },
];
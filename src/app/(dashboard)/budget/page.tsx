'use client';

import React, { useMemo, useState, useCallback } from 'react';
import type { Category } from '@/types';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';
import { ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon, CalendarIcon, BellIcon } from '@/components/icons/NavIcons';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar
} from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { useCurrency } from '@/context/CurrencyContext';

// Custom icons for trending
const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 13 4-4L12 14l8-8m0 0v6m0-6h-6" />
  </svg>
);

const TrendingDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 8 4 4 4-4 8 8m0 0v-6m0 6h-6" />
  </svg>
);

const AdjustmentsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30
    }
  }
};

const statsVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      delay: 0.1
    }
  }
};


interface BudgetStatusCardProps {
    category: Category;
    currentAmount: number;
    onUpdateBudget: (category: Category, newBudget: number) => Promise<void>;
    editable: boolean;
}

const getBudgetStatusStyles = (amount: number, budget: number, type: 'Expense' | 'Income') => {
    if (budget === 0) return { bar: 'bg-brand-surface-2', text: 'text-brand-text-secondary', progress: 0 };
    
    const percentage = (amount / budget) * 100;
    const progress = Math.min(percentage, 100);

    if (type === 'Expense') {
        if (percentage > 90) return { bar: 'bg-red-500', text: 'text-red-400', progress };
        if (percentage > 75) return { bar: 'bg-yellow-500', text: 'text-yellow-400', progress };
        return { bar: 'bg-green-500', text: 'text-green-400', progress };
    } else { // Income
        if (percentage >= 100) return { bar: 'bg-green-500', text: 'text-green-400', progress };
        if (percentage > 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400', progress };
        return { bar: 'bg-red-500', text: 'text-red-400', progress };
    }
};

const BudgetStatusCard: React.FC<BudgetStatusCardProps> = ({ category, currentAmount, onUpdateBudget, editable }) => {
    const { format } = useCurrency();
    const { bar, text, progress } = getBudgetStatusStyles(currentAmount, category.budget, category.type);
    const remaining = category.budget - currentAmount;
    const isOver = remaining < 0;
    const [isEditing, setIsEditing] = useState(false);
    const [draftBudget, setDraftBudget] = useState<string>(category.budget.toString());
    const [saving, setSaving] = useState(false);
    const formatCurrency = (value: number) => format(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleSave = async () => {
        const parsed = parseFloat(draftBudget);
        if (isNaN(parsed) || parsed < 0) return;
        setSaving(true);
        try {
            await onUpdateBudget(category, parsed);
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div 
            className={`group bg-brand-surface rounded-2xl p-5 relative border border-brand-border cursor-pointer
                                bg-clip-padding before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                                before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
              y: -8,
              scale: 1.02,
              borderColor: category.type === 'Expense' ? "rgb(239 68 68)" : "rgb(59 130 246)",
              boxShadow: category.type === 'Expense' 
                ? "0 25px 50px -12px rgba(239, 68, 68, 0.25)" 
                : "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
              }
            }}
            whileTap={{
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
            layout
            layoutId={`budget-${category.id}`}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <motion.div 
                        className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden shrink-0 ${category.type === 'Expense' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}
                        whileHover={{ 
                            scale: 1.1,
                            rotate: 5,
                            backgroundColor: category.type === 'Expense' ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)"
                        }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <div className={`absolute inset-0 rounded-lg ${category.type === 'Expense' ? 'bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]'}`}></div>
                        <span className="relative z-10">{category.icon}</span>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <p className="font-semibold text-base text-brand-text-primary flex items-center gap-2">
                            {category.name}
                            {isOver && (
                                <motion.span 
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    Over
                                </motion.span>
                            )}
                            {!isOver && remaining / (category.budget || 1) < 0.1 && category.type === 'Expense' && (
                                <motion.span 
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    Low
                                </motion.span>
                            )}
                        </p>
                        <p className={`text-xs font-medium ${category.type === 'Expense' ? 'text-red-400' : 'text-blue-400'}`}>{category.type === 'Expense' ? 'Budget' : 'Goal'}</p>
                    </motion.div>
                </div>
                <div className="text-right">
                    <motion.p 
                        className={`font-bold text-lg ${text}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        key={currentAmount}
                    >
                        {formatCurrency(currentAmount)}
                    </motion.p>
                    {isEditing ? (
                        <motion.div 
                            className="flex items-center gap-1 justify-end mt-1"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <input
                                type="number"
                                className="w-20 bg-brand-surface-2 border border-brand-border rounded px-1 py-0.5 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                value={draftBudget}
                                onChange={(e) => setDraftBudget(e.target.value)}
                                min={0}
                                disabled={saving}
                            />
                            <motion.button
                                onClick={handleSave}
                                disabled={saving}
                                className="text-xs px-2 py-0.5 rounded bg-brand-blue text-white hover:bg-blue-600 disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {saving ? '...' : 'Save'}
                            </motion.button>
                            <motion.button
                                onClick={() => { setIsEditing(false); setDraftBudget(category.budget.toString()); }}
                                disabled={saving}
                                className="text-xs px-2 py-0.5 rounded bg-brand-surface-2 border border-brand-border hover:bg-brand-border"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Cancel
                            </motion.button>
                        </motion.div>
                    ) : (
                        <p className="text-sm text-brand-text-secondary flex items-center gap-2 justify-end">
                            of {formatCurrency(category.budget)}
                            {editable && (
                                <motion.button
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] px-1 py-0.5 border border-brand-border rounded hover:border-brand-blue transition"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Edit
                                </motion.button>
                            )}
                        </p>
                    )}
                </div>
            </div>
            <motion.div 
                className="w-full bg-brand-surface-2 rounded-full h-2.5 mb-2 overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <motion.div
                    className={`h-2.5 rounded-full transition-all duration-500 ${bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                ></motion.div>
            </motion.div>
            <motion.div 
                className="text-xs text-brand-text-secondary text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                {isOver ? (
                    <span className="font-semibold text-red-400">{formatCurrency(Math.abs(remaining))} Over</span>
                ) : (
                    <span>{formatCurrency(remaining)} Remaining</span>
                )}
            </motion.div>
        </motion.div>
    );
};


export default function BudgetPage() {
        const { categories, expenses, incomes, updateCategory } = useData();
        const { addToast } = useToast();
    const { format, symbol } = useCurrency();
        const [monthOffset, setMonthOffset] = useState(0); // 0 = current month
        const [showIncomeGoals, setShowIncomeGoals] = useState(true);
        const [showAlerts, setShowAlerts] = useState(true);
        const [showTrends, setShowTrends] = useState(true);
        const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'trends'>('overview');

        const targetDate = useMemo(() => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() + monthOffset);
            return d;
        }, [monthOffset]);

        const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const isCurrentMonth = (() => {
            const now = new Date();
            return now.getMonth() === targetDate.getMonth() && now.getFullYear() === targetDate.getFullYear();
        })();

        const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const todayInMonth = isCurrentMonth ? new Date().getDate() : daysInMonth;
        const monthProgressPct = (todayInMonth / daysInMonth) * 100;

        const handleUpdateBudget = useCallback(async (category: Category, newBudget: number) => {
            try {
                await updateCategory({ ...category, budget: newBudget });
                addToast(`Budget for ${category.name} updated to ${format(newBudget, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'success');
            } catch (error) {
                addToast('Failed to update budget', 'error');
            }
        }, [updateCategory, addToast, format]);

        // Calculate historical data for trends (last 6 months)
        const trendData = useMemo(() => {
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const month = date.getMonth();
                const year = date.getFullYear();
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                
                const monthlyExpenses = expenses
                    .filter(e => {
                        const d = new Date(e.date);
                        return d.getMonth() === month && d.getFullYear() === year;
                    })
                    .reduce((sum, e) => sum + e.amount, 0);
                
                const monthlyIncome = incomes
                    .filter(i => {
                        const d = new Date(i.date);
                        return d.getMonth() === month && d.getFullYear() === year;
                    })
                    .reduce((sum, i) => sum + i.amount, 0);
                
                months.push({
                    month: monthName,
                    expenses: monthlyExpenses,
                    income: monthlyIncome,
                    savings: monthlyIncome - monthlyExpenses
                });
            }
            return months;
        }, [expenses, incomes]);

        const budgetData = useMemo(() => {
            const m = targetDate.getMonth();
            const y = targetDate.getFullYear();
            const categoriesWithBudget = categories.filter(c => c.budget > 0);
            return categoriesWithBudget.map(category => {
                let currentAmount = 0;
                if (category.type === 'Expense') {
                    currentAmount = expenses
                        .filter(e => {
                            const d = new Date(e.date);
                            return (e.category.docId === category.docId || e.category.id === category.id) &&
                                d.getMonth() === m && d.getFullYear() === y;
                        })
                        .reduce((sum, e) => sum + e.amount, 0);
                } else {
                    currentAmount = incomes
                        .filter(i => {
                            const d = new Date(i.date);
                            return (i.category.docId === category.docId || i.category.id === category.id) &&
                                d.getMonth() === m && d.getFullYear() === y;
                        })
                        .reduce((sum, i) => sum + i.amount, 0);
                }
                return { category, currentAmount };
            });
        }, [categories, expenses, incomes, targetDate]);

    const expenseBudgets = budgetData.filter(b => b.category.type === 'Expense');
    const incomeGoals = budgetData.filter(b => b.category.type === 'Income');

        // Generate budget alerts
        const budgetAlerts = useMemo(() => {
            const alerts: Array<{
                type: 'warning' | 'danger' | 'info';
                category: string;
                message: string;
                icon: React.ReactNode;
            }> = [];

            expenseBudgets.forEach(({ category, currentAmount }) => {
                const percentage = (currentAmount / category.budget) * 100;
                
                if (percentage > 100) {
                    alerts.push({
                        type: 'danger',
                        category: category.name,
                        message: `Over budget by ${format(currentAmount - category.budget, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        icon: <ExclamationTriangleIcon className="w-4 h-4" />
                    });
                } else if (percentage > 80) {
                    alerts.push({
                        type: 'warning',
                        category: category.name,
                        message: `${percentage.toFixed(1)}% of budget used`,
                        icon: <BellIcon className="w-4 h-4" />
                    });
                }
            });

            // Add low income goal alerts
            incomeGoals.forEach(({ category, currentAmount }) => {
                const percentage = (currentAmount / category.budget) * 100;
                if (percentage < 50 && isCurrentMonth) {
                    alerts.push({
                        type: 'info',
                        category: category.name,
                        message: `Only ${percentage.toFixed(1)}% of income goal achieved`,
                        icon: <TrendingDownIcon className="w-4 h-4" />
                    });
                }
            });

            return alerts;
        }, [expenseBudgets, incomeGoals, isCurrentMonth]);

        const summary = useMemo(() => {
            const totalBudgeted = expenseBudgets.reduce((sum, b) => sum + b.category.budget, 0);
            const totalSpent = expenseBudgets.reduce((sum, b) => sum + b.currentAmount, 0);
            const totalEarned = incomeGoals.reduce((sum, b) => sum + b.currentAmount, 0);
            const remaining = totalBudgeted - totalSpent;
            const progress = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
            const savings = totalEarned > 0 ? totalEarned - totalSpent : 0;
            const savingsRate = totalEarned > 0 ? (savings / totalEarned) * 100 : 0;
            // Forecasting: extrapolate based on average daily spend so far
            const avgDaily = todayInMonth > 0 ? totalSpent / todayInMonth : 0;
            const forecasted = avgDaily * daysInMonth;
            const forecastVariance = totalBudgeted > 0 ? ((forecasted - totalBudgeted) / totalBudgeted) * 100 : 0;
            
            // Calculate trend compared to last month
            const lastMonthData = trendData[trendData.length - 2];
            const currentMonthData = trendData[trendData.length - 1];
            const expenseTrend = lastMonthData && currentMonthData ? 
                ((currentMonthData.expenses - lastMonthData.expenses) / lastMonthData.expenses) * 100 : 0;
            
            return { 
                totalBudgeted, 
                totalSpent, 
                remaining, 
                progress, 
                totalEarned, 
                savings, 
                savingsRate, 
                forecasted, 
                forecastVariance,
                expenseTrend 
            };
        }, [expenseBudgets, incomeGoals, todayInMonth, daysInMonth, trendData]);
    
        const { bar: summaryBar } = getBudgetStatusStyles(summary.totalSpent, summary.totalBudgeted, 'Expense');

        // Donut chart data
        const expenseChartData = useMemo(() => {
            return expenseBudgets.map(b => ({
                name: b.category.name,
                value: b.currentAmount,
                budget: b.category.budget,
                percentage: b.category.budget > 0 ? (b.currentAmount / b.category.budget) * 100 : 0
            })).filter(d => d.value > 0);
        }, [expenseBudgets]);

        const COLORS = ['#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#f59e0b', '#10b981'];

        // Quick Actions
        const quickActions = [
            {
                label: 'Add Expense',
                action: () => addToast('Navigate to Add Expense', 'info'),
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            },
            {
                label: 'Adjust Budgets',
                action: () => setSelectedView('detailed'),
                icon: <AdjustmentsIcon className="w-4 h-4" />
            },
            {
                label: 'View Trends',
                action: () => setSelectedView('trends'),
                icon: <TrendingUpIcon className="w-4 h-4" />
            }
        ];


        return (
                <motion.div 
                    className="p-8"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                        <motion.div 
                            className="flex flex-wrap items-center justify-between gap-4 mb-6"
                            variants={headerVariants}
                        >
                            <h1 className="text-2xl font-bold text-brand-text-primary">Monthly Budget</h1>
                            <motion.div 
                                className="flex items-center gap-4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {/* View Toggle */}
                                <motion.div 
                                    className="flex items-center gap-1 bg-brand-surface border border-brand-border rounded-lg p-1"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {(['overview', 'detailed', 'trends'] as const).map((view) => (
                                        <motion.button
                                            key={view}
                                            onClick={() => setSelectedView(view)}
                                            className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                                                selectedView === view
                                                    ? 'bg-brand-blue text-white shadow-sm'
                                                    : 'text-brand-text-secondary hover:bg-brand-surface-2/50'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {view}
                                        </motion.button>
                                    ))}
                                </motion.div>

                                <motion.div 
                                    className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <motion.button
                                        onClick={() => setMonthOffset(o => o - 1)}
                                        className="p-1 rounded hover:bg-brand-border text-brand-text-secondary"
                                        aria-label="Previous Month"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </motion.button>
                                    <span className="text-sm font-medium text-brand-text-primary min-w-[140px] text-center">{monthLabel}</span>
                                    <motion.button
                                        onClick={() => setMonthOffset(o => o + 1)}
                                        className="p-1 rounded hover:bg-brand-border text-brand-text-secondary disabled:opacity-40"
                                        aria-label="Next Month"
                                        disabled={monthOffset >= 0}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>

                                <motion.button
                                    onClick={() => setShowIncomeGoals(v => !v)}
                                    className="text-xs px-3 py-1.5 rounded border border-brand-border bg-brand-surface-2 hover:bg-brand-border transition"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {showIncomeGoals ? 'Hide Income Goals' : 'Show Income Goals'}
                                </motion.button>
                            </motion.div>
                        </motion.div>

                        {/* Quick Actions Bar */}
                        <motion.div 
                            className="flex flex-wrap gap-3 mb-6"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {quickActions.map((action, index) => (
                                <motion.button
                                    key={action.label}
                                    onClick={action.action}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-surface-2 transition text-sm font-medium text-brand-text-primary"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {action.icon}
                                    {action.label}
                                </motion.button>
                            ))}
                        </motion.div>

                        {/* Budget Alerts */}
                        {showAlerts && budgetAlerts.length > 0 && (
                            <motion.div 
                                className="mb-6"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-lg font-semibold text-brand-text-primary flex items-center gap-2">
                                        <BellIcon className="w-5 h-5" />
                                        Budget Alerts
                                    </h2>
                                    <motion.button
                                        onClick={() => setShowAlerts(false)}
                                        className="text-xs text-brand-text-secondary hover:text-brand-text-primary"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        Dismiss All
                                    </motion.button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <AnimatePresence>
                                        {budgetAlerts.map((alert, index) => (
                                            <motion.div
                                                key={index}
                                                className={`p-3 rounded-lg border flex items-center gap-3 ${
                                                    alert.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                                    'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                                }`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: index * 0.1 }}
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                {alert.icon}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{alert.category}</p>
                                                    <p className="text-xs opacity-90">{alert.message}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* Trends View */}
                        {selectedView === 'trends' && (
                            <motion.div 
                                className="mb-8"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center gap-2">
                                    <TrendingUpIcon className="w-6 h-6" />
                                    Spending Trends (Last 6 Months)
                                </h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <motion.div 
                                        className="bg-brand-surface rounded-2xl p-6 border border-brand-border"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Monthly Overview</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={trendData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                    <XAxis dataKey="month" stroke="#9CA3AF" />
                                                    <YAxis stroke="#9CA3AF" />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1F2937', 
                                                            border: '1px solid #374151',
                                                            borderRadius: '8px' 
                                                        }}
                                                        formatter={(value: number) => [format(value), '']}
                                                    />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                                                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
                                                    <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>

                                    <motion.div 
                                        className="bg-brand-surface rounded-2xl p-6 border border-brand-border"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Category Breakdown</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={expenseChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                    <XAxis dataKey="name" stroke="#9CA3AF" />
                                                    <YAxis stroke="#9CA3AF" />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1F2937', 
                                                            border: '1px solid #374151',
                                                            borderRadius: '8px' 
                                                        }}
                                                        formatter={(value: number) => [format(value), 'Spent']}
                                                    />
                                                    <Bar dataKey="value" fill="#60a5fa" />
                                                    <Bar dataKey="budget" fill="#374151" opacity={0.3} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Trend Insights */}
                                <motion.div 
                                    className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
                                    variants={containerVariants}
                                >
                                    <motion.div 
                                        className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {summary.expenseTrend > 0 ? 
                                                <TrendingUpIcon className="w-4 h-4 text-red-400" /> : 
                                                <TrendingDownIcon className="w-4 h-4 text-green-400" />
                                            }
                                            <span className="text-sm font-medium text-brand-text-secondary">Expense Trend</span>
                                        </div>
                                        <p className={`text-lg font-bold ${summary.expenseTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {summary.expenseTrend > 0 ? '+' : ''}{summary.expenseTrend.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-brand-text-secondary">vs last month</p>
                                    </motion.div>

                                    <motion.div 
                                        className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <CalendarIcon className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium text-brand-text-secondary">Daily Average</span>
                                        </div>
                                        <p className="text-lg font-bold text-brand-text-primary">
                                            {format(summary.totalSpent / todayInMonth, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-brand-text-secondary">this month</p>
                                    </motion.div>

                                    <motion.div 
                                        className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <AdjustmentsIcon className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-medium text-brand-text-secondary">Budget Efficiency</span>
                                        </div>
                                        <p className="text-lg font-bold text-brand-text-primary">
                                            {summary.progress.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-brand-text-secondary">budget utilized</p>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Overview/Detailed View */}
                        {(selectedView === 'overview' || selectedView === 'detailed') && (
                            <>
                                {/* Overall Summary */}
                                <motion.div 
                                    className="bg-brand-surface rounded-2xl p-6 border border-brand-border mb-8 relative bg-clip-padding before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50"
                                    variants={statsVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{
                                        scale: 1.01,
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-brand-text-primary mb-1">Overall Expense Progress</h3>
                                            <p className="text-sm text-brand-text-secondary">Tracking your budgets for {monthLabel} ({monthProgressPct.toFixed(0)}% through month)</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs">
                                            <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Spent: {format(summary.totalSpent, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</div>
                                            <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Budgeted: {format(summary.totalBudgeted, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</div>
                                            <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Forecast: {format(summary.forecasted, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</div>
                                            {summary.totalEarned > 0 && (
                                                <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Savings Rate: {summary.savingsRate.toFixed(1)}%</div>
                                            )}
                                        </div>
                                    </div>
                    
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 mt-6">
                        <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                            <p className="text-sm text-brand-text-secondary">Total Budget</p>
                            <p className="text-xl font-bold text-brand-text-primary">
                                {format(summary.totalBudgeted, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                         <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                            <p className="text-sm text-brand-text-secondary">Total Spent</p>
                            <p className="text-xl font-bold text-brand-text-primary">
                                {format(summary.totalSpent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                         <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                            <p className="text-sm text-brand-text-secondary">Remaining</p>
                            <p className={`text-xl font-bold ${summary.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                               {summary.remaining < 0 ? '-' : ''}{format(Math.abs(summary.remaining), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                                         <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                                             <p className="text-sm text-brand-text-secondary">Forecast Spend</p>
                                             <p className={`text-xl font-bold ${summary.forecastVariance > 5 ? 'text-red-400' : summary.forecastVariance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{format(summary.forecasted, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</p>
                                         </div>
                                         <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                                             <p className="text-sm text-brand-text-secondary">Savings</p>
                                             <p className="text-xl font-bold text-brand-text-primary">{format(summary.savings, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</p>
                                         </div>
                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="col-span-2 flex flex-col gap-4">
                                            <div className="w-full bg-brand-surface-2 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-3 transition-all duration-700 ${summaryBar}`}
                                                    style={{ width: `${summary.progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-brand-text-secondary">
                                                <span>{summary.progress.toFixed(1)}% of budget used</span>
                                                <span>{monthProgressPct.toFixed(0)}% through month</span>
                                            </div>
                                            {summary.totalEarned > 0 && (
                                                <div className="text-xs text-brand-text-secondary">Savings Rate: <span className="text-brand-text-primary font-semibold">{summary.savingsRate.toFixed(1)}%</span></div>
                                            )}
                                        </div>
                                        <div className="h-56">
                                            {expenseChartData.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-sm text-brand-text-secondary border border-brand-border rounded-lg">No expense distribution</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={expenseChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                                            {expenseChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(v: number) => format(v)} />
                                                        <Legend verticalAlign="bottom" height={24} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Expense Budgets */}
                                {expenseBudgets.length > 0 && (
                                    <motion.div 
                                        className="mb-8"
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <h2 className="text-xl font-bold text-brand-text-primary mb-4">Expense Budgets</h2>
                                        <motion.div 
                                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {expenseBudgets.map(({ category, currentAmount }) => (
                                                    <BudgetStatusCard
                                                      key={category.id}
                                                      category={category}
                                                      currentAmount={currentAmount}
                                                      onUpdateBudget={handleUpdateBudget}
                                                      editable={isCurrentMonth}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    </motion.div>
                                )}
                                
                                {/* Income Goals */}
                                {showIncomeGoals && incomeGoals.length > 0 && (
                                    <motion.div
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <h2 className="text-xl font-bold text-brand-text-primary mb-4">Income Goals</h2>
                                        <motion.div 
                                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <AnimatePresence mode="popLayout">
                                                 {incomeGoals.map(({ category, currentAmount }) => (
                                                    <BudgetStatusCard
                                                      key={category.id}
                                                      category={category}
                                                      currentAmount={currentAmount}
                                                      onUpdateBudget={handleUpdateBudget}
                                                      editable={isCurrentMonth}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </>
                        )}
                </motion.div>
            );
}

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import type { Category } from '@/types';
import { useData } from '@/hooks/useData';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/NavIcons';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts';


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
    const { bar, text, progress } = getBudgetStatusStyles(currentAmount, category.budget, category.type);
    const remaining = category.budget - currentAmount;
    const isOver = remaining < 0;
    const [isEditing, setIsEditing] = useState(false);
    const [draftBudget, setDraftBudget] = useState<string>(category.budget.toString());
    const [saving, setSaving] = useState(false);

    const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        <div className={`group bg-brand-surface rounded-2xl p-5 relative border border-brand-border hover:border-brand-blue/60 transition-colors 
                                bg-clip-padding before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                                before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden shrink-0 ${category.type === 'Expense' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                        <div className={`absolute inset-0 rounded-lg ${category.type === 'Expense' ? 'bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]'}`}></div>
                        <span className="relative z-10">{category.icon}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-base text-brand-text-primary flex items-center gap-2">
                            {category.name}
                            {isOver && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">Over</span>}
                            {!isOver && remaining / (category.budget || 1) < 0.1 && category.type === 'Expense' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Low</span>
                            )}
                        </p>
                        <p className={`text-xs font-medium ${category.type === 'Expense' ? 'text-red-400' : 'text-blue-400'}`}>{category.type === 'Expense' ? 'Budget' : 'Goal'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold text-lg ${text}`}>{formatCurrency(currentAmount)}</p>
                    {isEditing ? (
                        <div className="flex items-center gap-1 justify-end mt-1">
                            <input
                                type="number"
                                className="w-20 bg-brand-surface-2 border border-brand-border rounded px-1 py-0.5 text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue"
                                value={draftBudget}
                                onChange={(e) => setDraftBudget(e.target.value)}
                                min={0}
                                disabled={saving}
                            />
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="text-xs px-2 py-0.5 rounded bg-brand-blue text-white hover:bg-blue-600 disabled:opacity-50"
                            >{saving ? '...' : 'Save'}</button>
                            <button
                                onClick={() => { setIsEditing(false); setDraftBudget(category.budget.toString()); }}
                                disabled={saving}
                                className="text-xs px-2 py-0.5 rounded bg-brand-surface-2 border border-brand-border hover:bg-brand-border"
                            >Cancel</button>
                        </div>
                    ) : (
                        <p className="text-sm text-brand-text-secondary flex items-center gap-2 justify-end">
                            of {formatCurrency(category.budget)}
                            {editable && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] px-1 py-0.5 border border-brand-border rounded hover:border-brand-blue transition"
                                >Edit</button>
                            )}
                        </p>
                    )}
                </div>
            </div>
            <div className="w-full bg-brand-surface-2 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${bar}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="text-xs text-brand-text-secondary text-right">
                {isOver ? (
                    <span className="font-semibold text-red-400">{formatCurrency(Math.abs(remaining))} Over</span>
                ) : (
                    <span>{formatCurrency(remaining)} Remaining</span>
                )}
            </div>
        </div>
    );
};


export default function BudgetPage() {
        const { categories, expenses, incomes, updateCategory } = useData();
        const [monthOffset, setMonthOffset] = useState(0); // 0 = current month
        const [showIncomeGoals, setShowIncomeGoals] = useState(true);

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
            await updateCategory({ ...category, budget: newBudget });
        }, [updateCategory]);

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
            return { totalBudgeted, totalSpent, remaining, progress, totalEarned, savings, savingsRate, forecasted, forecastVariance };
        }, [expenseBudgets, incomeGoals, todayInMonth, daysInMonth]);
    
        const { bar: summaryBar } = getBudgetStatusStyles(summary.totalSpent, summary.totalBudgeted, 'Expense');

        // Donut chart data
        const expenseChartData = useMemo(() => {
            return expenseBudgets.map(b => ({
                name: b.category.name,
                value: b.currentAmount,
            })).filter(d => d.value > 0);
        }, [expenseBudgets]);

        const COLORS = ['#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#f59e0b', '#10b981'];


        return (
                <div className="p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h1 className="text-2xl font-bold text-brand-text-primary">Monthly Budget</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5">
                                    <button
                                        onClick={() => setMonthOffset(o => o - 1)}
                                        className="p-1 rounded hover:bg-brand-border text-brand-text-secondary"
                                        aria-label="Previous Month"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium text-brand-text-primary min-w-[140px] text-center">{monthLabel}</span>
                                    <button
                                        onClick={() => setMonthOffset(o => o + 1)}
                                        className="p-1 rounded hover:bg-brand-border text-brand-text-secondary disabled:opacity-40"
                                        aria-label="Next Month"
                                        disabled={monthOffset >= 0}
                                    >
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowIncomeGoals(v => !v)}
                                    className="text-xs px-3 py-1.5 rounded border border-brand-border bg-brand-surface-2 hover:bg-brand-border transition"
                                >{showIncomeGoals ? 'Hide Income Goals' : 'Show Income Goals'}</button>
                            </div>
                        </div>

                        {/* Overall Summary */}
            <div className={`bg-brand-surface rounded-2xl p-6 border border-brand-border mb-8
                          relative bg-clip-padding 
                          before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                          before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-brand-text-primary mb-1">Overall Expense Progress</h3>
                                        <p className="text-sm text-brand-text-secondary">Tracking your budgets for {monthLabel} ({monthProgressPct.toFixed(0)}% through month)</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs">
                                        <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Spent: ${summary.totalSpent.toLocaleString()}</div>
                                        <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Budgeted: ${summary.totalBudgeted.toLocaleString()}</div>
                                        <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Forecast: ${summary.forecasted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        {summary.totalEarned > 0 && (
                                            <div className="px-2 py-1 rounded bg-brand-surface-2 border border-brand-border">Savings Rate: {summary.savingsRate.toFixed(1)}%</div>
                                        )}
                                    </div>
                                </div>
                
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 mt-6">
                    <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                        <p className="text-sm text-brand-text-secondary">Total Budget</p>
                        <p className="text-xl font-bold text-brand-text-primary">
                            ${summary.totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                     <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                        <p className="text-sm text-brand-text-secondary">Total Spent</p>
                        <p className="text-xl font-bold text-brand-text-primary">
                            ${summary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                     <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                        <p className="text-sm text-brand-text-secondary">Remaining</p>
                        <p className={`text-xl font-bold ${summary.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {summary.remaining < 0 ? '-' : ''}${Math.abs(summary.remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                                         <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                                             <p className="text-sm text-brand-text-secondary">Forecast Spend</p>
                                             <p className={`text-xl font-bold ${summary.forecastVariance > 5 ? 'text-red-400' : summary.forecastVariance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>${summary.forecasted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                         </div>
                                         <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                                             <p className="text-sm text-brand-text-secondary">Savings</p>
                                             <p className="text-xl font-bold text-brand-text-primary">${summary.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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
                                                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                                                    <Legend verticalAlign="bottom" height={24} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
            </div>

            {/* Expense Budgets */}
            {expenseBudgets.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Expense Budgets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {expenseBudgets.map(({ category, currentAmount }) => (
                            <BudgetStatusCard
                              key={category.id}
                              category={category}
                              currentAmount={currentAmount}
                              onUpdateBudget={handleUpdateBudget}
                              editable={isCurrentMonth}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Income Goals */}
            {showIncomeGoals && incomeGoals.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Income Goals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {incomeGoals.map(({ category, currentAmount }) => (
                            <BudgetStatusCard
                              key={category.id}
                              category={category}
                              currentAmount={currentAmount}
                              onUpdateBudget={handleUpdateBudget}
                              editable={isCurrentMonth}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

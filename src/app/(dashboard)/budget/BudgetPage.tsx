'use client';

import React, { useMemo } from 'react';
import type { Category } from '../../types';
import { useData } from '../../hooks/useData';


interface BudgetStatusCardProps {
  category: Category;
  currentAmount: number;
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

const BudgetStatusCard: React.FC<BudgetStatusCardProps> = ({ category, currentAmount }) => {
    const { bar, text, progress } = getBudgetStatusStyles(currentAmount, category.budget, category.type);
    const remaining = category.budget - currentAmount;
    const isOver = remaining < 0;

    const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className={`bg-brand-surface rounded-2xl p-5 relative border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden shrink-0 ${category.type === 'Expense' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                        <div className={`absolute inset-0 rounded-lg ${category.type === 'Expense' ? 'bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]'}`}></div>
                        <span className="relative z-10">{category.icon}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-base text-brand-text-primary">{category.name}</p>
                        <p className={`text-xs font-medium ${category.type === 'Expense' ? 'text-red-400' : 'text-blue-400'}`}>{category.type === 'Expense' ? 'Budget' : 'Goal'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold text-lg ${text}`}>{formatCurrency(currentAmount)}</p>
                    <p className="text-sm text-brand-text-secondary">of {formatCurrency(category.budget)}</p>
                </div>
            </div>

            <div className="w-full bg-brand-surface-2 rounded-full h-2.5 mb-2">
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
    const { categories, expenses, incomes } = useData();

    const budgetData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const categoriesWithBudget = categories.filter(c => c.budget > 0);

        return categoriesWithBudget.map(category => {
            let currentAmount = 0;
            if (category.type === 'Expense') {
                currentAmount = expenses
                    .filter(e => {
                        const expenseDate = new Date(e.date);
                        return e.category.id === category.id &&
                               expenseDate.getMonth() === currentMonth &&
                               expenseDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, e) => sum + e.amount, 0);
            } else { // Income
                 currentAmount = incomes
                    .filter(i => {
                        const incomeDate = new Date(i.date);
                        return i.category.id === category.id &&
                               incomeDate.getMonth() === currentMonth &&
                               incomeDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, i) => sum + i.amount, 0);
            }
            return { category, currentAmount };
        });
    }, [categories, expenses, incomes]);

    const expenseBudgets = budgetData.filter(b => b.category.type === 'Expense');
    const incomeGoals = budgetData.filter(b => b.category.type === 'Income');

    const summary = useMemo(() => {
        const totalBudgeted = expenseBudgets.reduce((sum, b) => sum + b.category.budget, 0);
        const totalSpent = expenseBudgets.reduce((sum, b) => sum + b.currentAmount, 0);
        const remaining = totalBudgeted - totalSpent;
        const progress = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
        return { totalBudgeted, totalSpent, remaining, progress };
    }, [expenseBudgets]);
    
    const { bar: summaryBar } = getBudgetStatusStyles(summary.totalSpent, summary.totalBudgeted, 'Expense');


    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-brand-text-primary mb-6">Monthly Budget</h1>

            {/* Overall Summary */}
            <div className={`bg-brand-surface rounded-2xl p-6 border border-brand-border mb-8
                          relative bg-clip-padding 
                          before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                          before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
                <h3 className="text-lg font-bold text-brand-text-primary mb-1">Overall Expense Progress</h3>
                <p className="text-sm text-brand-text-secondary mb-4">A summary of all your expense budgets for this month.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                </div>

                <div className="w-full bg-brand-surface-2 rounded-full h-3">
                    <div 
                        className={`h-3 rounded-full transition-all duration-500 ${summaryBar}`}
                        style={{ width: `${summary.progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Expense Budgets */}
            {expenseBudgets.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Expense Budgets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {expenseBudgets.map(({ category, currentAmount }) => (
                            <BudgetStatusCard key={category.id} category={category} currentAmount={currentAmount} />
                        ))}
                    </div>
                </div>
            )}
            
            {/* Income Goals */}
            {incomeGoals.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Income Goals</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {incomeGoals.map(({ category, currentAmount }) => (
                            <BudgetStatusCard key={category.id} category={category} currentAmount={currentAmount} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

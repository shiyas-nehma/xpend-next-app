'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, InfoIcon, RefreshIcon } from '@/components/icons/NavIcons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useData } from '@/hooks/useData';
import FormattedMessageContent from '@/components/common/FormattedMessageContent';

const CardBase: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50
                   ${className}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10 h-full flex flex-col">
            {children}
        </div>
    </div>
);


const AIAssistantCard: React.FC = () => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { incomes, expenses } = useData();

    // Local fallback summary generator (non-AI heuristic)
    const buildLocalSummary = (totalIncome: number, totalExpense: number, topCategoriesList: Array<[string, number]>) => {
        const net = totalIncome - totalExpense;
        const trend = net >= 0 ? 'surplus' : 'deficit';
        const top = topCategoriesList.slice(0, 2).map(([n, v]) => `${n} ($${v.toFixed(0)})`).join(', ');
        const topSentence = top ? ` Top spend: ${top}.` : '';
        const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
        const savingsPart = totalIncome > 0 ? ` Savings rate ~${savingsRate.toFixed(1)}%.` : '';
        return `**Local Insight (AI disabled)**: You're running a ${trend} of $${Math.abs(net).toFixed(0)} (income $${totalIncome.toFixed(0)} vs expenses $${totalExpense.toFixed(0)}).${topSentence}${savingsPart}`;
    };

    const generateSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const monthlyIncomes = incomes.filter(i => {
                const d = new Date(i.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const totalIncome = monthlyIncomes.reduce((sum, i) => sum + i.amount, 0);

            const monthlyExpenses = expenses.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const totalExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

            const expenseByCategory = monthlyExpenses.reduce((acc, expense) => {
                const name = expense.category.name;
                acc[name] = (acc[name] || 0) + expense.amount;
                return acc as Record<string, number>;
            }, {} as Record<string, number>);

            const topCategoriesArray = Object.entries(expenseByCategory)
                .sort(([, a], [, b]) => b - a);
            const topCategories = topCategoriesArray
                .slice(0, 3)
                .map(([name, amount]) => `${name}: $${amount.toFixed(2)}`)
                .join(', ');

            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
            if (!apiKey) {
                // Fallback immediately if no API key configured
                setSummary(buildLocalSummary(totalIncome, totalExpense, topCategoriesArray));
                return;
            }

            const prompt = `You are a financial assistant for the Equota dashboard.\n` +
                `Analyze the following financial data for the current month and provide a short, insightful summary (2-3 sentences) for the user.\n` +
                `Highlight the most important trend or action item. Use markdown for emphasis (e.g., **bold** for key phrases).\n` +
                `Do not greet the user. Start directly with the analysis.\n\n` +
                `Data:\n` +
                `- Total Income: $${totalIncome.toFixed(2)}\n` +
                `- Total Expenses: $${totalExpense.toFixed(2)}\n` +
                `- Net Flow: $${(totalIncome - totalExpense).toFixed(2)}\n` +
                `- Top Spending Categories: ${topCategories || 'None'}\n`;

            try {
                const ai = new GoogleGenerativeAI(apiKey);
                const model = ai.getGenerativeModel({ model: 'gemini-pro' });
                const response = await model.generateContent(prompt);
                setSummary(response.response.text());
            } catch (apiErr: any) {
                // Specific fallback for invalid key or 400/403 errors
                const msg = apiErr?.message || apiErr?.toString?.() || '';
                if (/API key not valid|API_KEY_INVALID|403|400/.test(msg)) {
                    console.warn('Invalid or missing Google API key. Using local heuristic summary.');
                    setSummary(buildLocalSummary(totalIncome, totalExpense, topCategoriesArray));
                    return;
                }
                if (msg.includes('429')) {
                    setError('AI assistant is busy (rate limited). Please refresh shortly.');
                } else {
                    setError('AI service error. Showing local summary.');
                    setSummary(buildLocalSummary(totalIncome, totalExpense, topCategoriesArray));
                }
            }
        } catch (e: any) {
            console.error('AI summary generation failed (outer):', e);
            setError('Failed to generate summary.');
        } finally {
            setIsLoading(false);
        }
    }, [incomes, expenses]);

    useEffect(() => {
        generateSummary();
    }, [generateSummary]);
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-brand-surface-2/50 rounded-full w-3/4"></div>
                    <div className="h-3 bg-brand-surface-2/50 rounded-full w-full"></div>
                    <div className="h-3 bg-brand-surface-2/50 rounded-full w-5/6"></div>
                </div>
            );
        }
        if (error) {
            return <p className="text-sm text-red-400">{error}</p>;
        }
        if (summary) {
            return <div className="text-xs text-brand-text-secondary"><FormattedMessageContent content={summary} /></div>;
        }
        return null;
    }

    return (
        <div className="bg-brand-surface-2 rounded-2xl p-4 mt-auto relative overflow-hidden h-48 flex flex-col">
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(93,120,255,0.5)_0%,_transparent_60%)] scale-150 animate-[pulse_5s_ease-in-out_infinite]"></div>
             <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(93,120,255,0.3)_0%,_transparent_70%)] opacity-80 mix-blend-lighten">
                 <div className="absolute -inset-20 w-full h-full bg-[radial-gradient(ellipse_40%_60%_at_50%_50%,_rgba(255,255,255,0.2)_0%,_transparent_100%)] animate-[spin_10s_linear_infinite]"></div>
             </div>
            
            <div className="relative z-10 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-brand-text-primary">AI Insights</h4>
                    <button onClick={generateSummary} disabled={isLoading} className="text-brand-text-secondary hover:text-white disabled:text-brand-text-secondary/50 transition-colors" aria-label="Refresh AI Insights">
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="flex-grow">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};


const TotalBalanceCard: React.FC = () => {
  return (
    <CardBase className="h-full">
      <div className="flex justify-between items-center mb-1">
        <p className="text-md text-brand-text-secondary">Total Balance</p>
        <button className="flex items-center space-x-2 text-sm text-brand-text-secondary bg-brand-surface-2 border border-brand-border px-3 py-1.5 rounded-lg hover:border-white/20 transition-colors">
            <span>US Dollar</span>
            <ChevronDownIcon className="w-4 h-4"/>
        </button>
      </div>
      <p className="text-sm text-brand-text-secondary">The sum of all amounts on my wallet</p>
      
      <div className="my-6">
        <p className="text-5xl font-bold text-brand-text-primary">$ 23,094.57</p>
      </div>

      <div className="flex space-x-8 text-sm">
        <div>
            <p className="text-brand-text-secondary">Compared to last month</p>
            <p className="text-red-400 font-medium">-37.16 %</p>
        </div>
        <div>
            <p className="text-brand-text-secondary">Yearly avg:</p>
            <p className="text-brand-text-primary font-medium">$ 34,502.19</p>
        </div>
      </div>
      
       <div className="mt-4 flex items-center space-x-2 text-brand-text-secondary text-sm cursor-pointer hover:text-white transition-colors">
        <InfoIcon className="w-4 h-4" />
        <span>How it works?</span>
       </div>

      <AIAssistantCard />
    </CardBase>
  );
};

export default TotalBalanceCard;
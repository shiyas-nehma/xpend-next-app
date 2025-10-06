import React, { useState, useMemo } from 'react';
import ReportCard from './ReportCard';
import type { Income, Expense } from '../../types';
import { CalendarIcon } from '../icons/NavIcons';

type Transaction = (Income | Expense) & { type: 'Income' | 'Expense' };

// Helper to format date to YYYY-MM-DD for input fields
const toInputDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface TransactionsReportProps {
    incomes: Income[];
    expenses: Expense[];
}

const TransactionsReport: React.FC<TransactionsReportProps> = ({ incomes, expenses }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState<string>(toInputDateString(startOfMonth));
    const [endDate, setEndDate] = useState<string>(toInputDateString(today));
    const [activeFilter, setActiveFilter] = useState<'Month' | 'Week' | 'Custom'>('Month');
    
    const allTransactions = useMemo<Transaction[]>(() => {
        const combined = [
            ...incomes.map(i => ({ ...i, type: 'Income' as const })),
            ...expenses.map(e => ({ ...e, type: 'Expense' as const }))
        ];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [incomes, expenses]);

    const filteredTransactions = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); 
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return allTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });
    }, [allTransactions, startDate, endDate]);

    const summary = useMemo(() => {
        const totalIncome = filteredTransactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);
    
        const totalExpense = filteredTransactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + t.amount, 0);
    
        const netFlow = totalIncome - totalExpense;
    
        return { totalIncome, totalExpense, netFlow };
    }, [filteredTransactions]);

    const setDateRange = (filter: 'Month' | 'Week') => {
        setActiveFilter(filter);
        const today = new Date();
        if (filter === 'Month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(toInputDateString(startOfMonth));
            setEndDate(toInputDateString(today));
        } else if (filter === 'Week') {
            const firstDayOfWeek = today.getDate() - today.getDay();
            const startOfWeek = new Date(today.setDate(firstDayOfWeek));
            setStartDate(toInputDateString(startOfWeek));
            setEndDate(toInputDateString(new Date()));
        }
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
        setActiveFilter('Custom');
        if (type === 'start') {
            setStartDate(e.target.value);
        } else {
            setEndDate(e.target.value);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + tzOffset).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    const headerControls = (
        <div className="flex items-center gap-4">
            <div className="flex space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                {(['Week', 'Month'] as const).map(f => (
                    <button key={f} onClick={() => setDateRange(f)} className={`px-3 py-1 text-sm rounded-md transition-colors ${activeFilter === f ? 'bg-brand-surface-2 text-white' : 'text-brand-text-secondary hover:bg-brand-surface-2/50'}`}>
                        {`This ${f}`}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input type="date" value={startDate} onChange={(e) => handleDateChange(e, 'start')} className="bg-brand-surface-2 border-brand-border border rounded-md p-1.5 text-sm text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                </div>
                <span className="text-brand-text-secondary">-</span>
                 <div className="relative">
                    <input type="date" value={endDate} onChange={(e) => handleDateChange(e, 'end')} className="bg-brand-surface-2 border-brand-border border rounded-md p-1.5 text-sm text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                </div>
            </div>
        </div>
    );

    return (
        <ReportCard title="All Transactions" headerControls={headerControls}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                    <p className="text-sm text-brand-text-secondary">Total Income</p>
                    <p className="text-2xl font-bold text-blue-400">
                        +${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                    <p className="text-sm text-brand-text-secondary">Total Expense</p>
                    <p className="text-2xl font-bold text-red-400">
                        -${summary.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-brand-surface-2 p-4 rounded-lg border border-brand-border">
                    <p className="text-sm text-brand-text-secondary">Net Flow</p>
                    <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-400' : 'text-orange-500'}`}>
                        {summary.netFlow < 0 ? '-' : '+'}${Math.abs(summary.netFlow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-brand-border">
                            {['Date', 'Description', 'Category', 'Type', 'Amount'].map(h => (
                                <th key={h} className="py-2 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((t) => (
                            <tr key={`${t.type}-${t.id}`} className="border-b border-brand-border last:border-b-0 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-sm text-brand-text-secondary">{formatDate(t.date)}</td>
                                <td className="py-3 px-4 font-medium text-sm text-brand-text-primary">{t.description}</td>
                                <td className="py-3 px-4 text-sm text-brand-text-secondary">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{t.category.icon}</span>
                                        <span>{t.category.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                     <span className={`px-2 py-1 text-xs font-medium rounded-md ${t.type === 'Income' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {t.type}
                                    </span>
                                </td>
                                <td className={`py-3 px-4 text-sm font-bold ${t.type === 'Income' ? 'text-blue-400' : 'text-red-400'}`}>
                                    {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredTransactions.length === 0 && (
                    <div className="text-center py-10 text-brand-text-secondary">
                        <p>No transactions found for the selected period.</p>
                    </div>
                )}
            </div>
        </ReportCard>
    );
};

export default TransactionsReport;

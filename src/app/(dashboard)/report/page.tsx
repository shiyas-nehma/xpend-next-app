'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import MonthlyComparisonChart from '@/components/reports/MonthlyComparisonChart';
import MonthlySpendChart from '@/components/reports/MonthlySpendChart';
import TransactionsReport from '@/components/reports/TransactionsReport';
import { useData } from '@/hooks/useData';
import { useToast } from '@/hooks/useToast';
import { 
  ChevronDownIcon, 
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@/components/icons/NavIcons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
  Treemap,
  ScatterChart,
  Scatter
} from 'recharts';
import type { Income, Expense, Category } from '@/types';

// Custom icons
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
  </svg>
);

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

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
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

// Date range type
type DateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';
type ReportView = 'overview' | 'analytics' | 'trends' | 'categories' | 'comparison';

interface DateRangeFilter {
  label: string;
  value: DateRange;
  days: number;
}

const dateRanges: DateRangeFilter[] = [
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
  { label: 'Last 6 Months', value: '6m', days: 180 },
  { label: 'Last Year', value: '1y', days: 365 },
  { label: 'Custom Range', value: 'custom', days: 0 }
];

const CHART_COLORS = ['#60a5fa', '#818cf8', '#a78bfa', '#f472b6', '#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#f59e0b', '#10b981'];


const ReportPage: React.FC = () => {
  const { incomes, expenses, categories } = useData();
  const { addToast } = useToast();
  const { format } = useCurrency();
  
  // State management
  const [selectedView, setSelectedView] = useState<ReportView>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate date boundaries
  const { startDate, endDate } = useMemo(() => {
    if (dateRange === 'custom') {
      return {
        startDate: customStartDate ? new Date(customStartDate) : new Date(),
        endDate: customEndDate ? new Date(customEndDate) : new Date()
      };
    }
    
    const end = new Date();
    const start = new Date();
    const selectedRange = dateRanges.find(r => r.value === dateRange);
    start.setDate(end.getDate() - (selectedRange?.days || 30));
    
    return { startDate: start, endDate: end };
  }, [dateRange, customStartDate, customEndDate]);

  // Filter data based on date range and categories
  const filteredData = useMemo(() => {
    const filterByDate = (item: Income | Expense) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    };

    const filterByCategory = (item: Income | Expense) => {
      if (selectedCategories.length === 0) return true;
      return selectedCategories.includes(item.category.id);
    };

    const filterBySearch = (item: Income | Expense) => {
      if (!searchQuery) return true;
      return item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    };

    // Ensure arrays are always valid
    const safeIncomes = Array.isArray(incomes) ? incomes : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];

    const filteredIncomes = safeIncomes.filter(i => 
      i && filterByDate(i) && filterByCategory(i) && filterBySearch(i)
    );
    
    const filteredExpenses = safeExpenses.filter(e => 
      e && filterByDate(e) && filterByCategory(e) && filterBySearch(e)
    );

    return { filteredIncomes, filteredExpenses };
  }, [incomes, expenses, startDate, endDate, selectedCategories, searchQuery]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const { filteredIncomes, filteredExpenses } = filteredData;
    
    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    // Calculate averages
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyIncome = totalIncome / days;
    const avgDailyExpenses = totalExpenses / days;
    
    // Calculate trends (compare with previous period)
    const periodDays = days;
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    const prevEndDate = new Date(startDate);
    
    // Use safe arrays for previous period calculation
    const safeIncomes = Array.isArray(incomes) ? incomes : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
    const prevIncomes = safeIncomes.filter(i => {
      const date = new Date(i.date);
      return date >= prevStartDate && date < prevEndDate;
    });
    
    const prevExpenses = safeExpenses.filter(e => {
      const date = new Date(e.date);
      return date >= prevStartDate && date < prevEndDate;
    });
    
    const prevTotalIncome = prevIncomes.reduce((sum, i) => sum + i.amount, 0);
    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const incomeTrend = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0;
    const expenseTrend = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    
    // Category analysis
    const categoryAnalysis = categories.map(category => {
      const categoryIncomes = filteredIncomes.filter(i => i.category.id === category.id);
      const categoryExpenses = filteredExpenses.filter(e => e.category.id === category.id);
      const totalAmount = categoryIncomes.reduce((sum, i) => sum + i.amount, 0) + 
                         categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const transactionCount = categoryIncomes.length + categoryExpenses.length;
      
      return {
        category,
        totalAmount,
        transactionCount,
        incomeAmount: categoryIncomes.reduce((sum, i) => sum + i.amount, 0),
        expenseAmount: categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
      };
    }).filter(c => c.totalAmount > 0).sort((a, b) => b.totalAmount - a.totalAmount);

    // Monthly breakdown for trends
    const monthlyData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const monthIncomes = filteredIncomes.filter(i => {
        const date = new Date(i.date);
        return date >= monthStart && date <= monthEnd;
      });
      
      const monthExpenses = filteredExpenses.filter(e => {
        const date = new Date(e.date);
        return date >= monthStart && date <= monthEnd;
      });
      
      const monthlyIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
      const monthlyExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthlyIncome,
        expenses: monthlyExpense,
        net: monthlyIncome - monthlyExpense,
        transactions: monthIncomes.length + monthExpenses.length
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      avgDailyIncome,
      avgDailyExpenses,
      incomeTrend,
      expenseTrend,
      categoryAnalysis,
      monthlyData,
      transactionCount: filteredIncomes.length + filteredExpenses.length
    };
  }, [filteredData, startDate, endDate, incomes, expenses, categories]);

  // Export functionality
  const exportData = useCallback(async (format: 'csv' | 'json') => {
    try {
      const { filteredIncomes, filteredExpenses } = filteredData;
      const allTransactions = [
        ...filteredIncomes.map(i => ({ ...i, type: 'income' })),
        ...filteredExpenses.map(e => ({ ...e, type: 'expense' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (format === 'csv') {
        const csvHeaders = 'Date,Type,Description,Category,Amount,Payment Method\n';
        const csvData = allTransactions.map(t => 
          `${t.date},${t.type},${t.description},${t.category.name},${t.amount},${t.paymentMethod}`
        ).join('\n');
        
        const blob = new Blob([csvHeaders + csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonData = {
          reportPeriod: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          summary: {
            totalIncome: analytics.totalIncome,
            totalExpenses: analytics.totalExpenses,
            netIncome: analytics.netIncome,
            savingsRate: analytics.savingsRate,
            transactionCount: analytics.transactionCount
          },
          transactions: allTransactions,
          categoryBreakdown: analytics.categoryAnalysis
        };
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      addToast(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      addToast('Failed to export report', 'error');
    }
  }, [filteredData, analytics, startDate, endDate, addToast]);

  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <motion.div 
      className="p-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4 mb-6"
        variants={headerVariants}
      >
        <h1 className="text-2xl font-bold text-brand-text-primary">Financial Reports</h1>
        
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
            {(['overview', 'analytics', 'trends', 'categories'] as const).map((view) => (
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

          {/* Export Buttons */}
          <motion.div className="flex gap-2">
            <motion.button
              onClick={() => exportData('csv')}
              className="flex items-center gap-2 px-3 py-2 bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-surface-2 transition text-sm font-medium text-brand-text-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DownloadIcon className="w-4 h-4" />
              CSV
            </motion.button>
            <motion.button
              onClick={() => exportData('json')}
              className="flex items-center gap-2 px-3 py-2 bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-surface-2 transition text-sm font-medium text-brand-text-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DownloadIcon className="w-4 h-4" />
              JSON
            </motion.button>
          </motion.div>

          {/* Filters Toggle */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition text-sm font-medium ${
              showFilters 
                ? 'bg-brand-blue border-brand-blue text-white' 
                : 'bg-brand-surface border-brand-border text-brand-text-primary hover:bg-brand-surface-2'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FilterIcon className="w-4 h-4" />
            Filters
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-brand-surface rounded-lg border border-brand-border p-4 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRange)}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </>
              )}

              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-lg pl-10 pr-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-brand-text-secondary mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <motion.button
                    key={category.id}
                    onClick={() => toggleCategoryFilter(category.id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs transition ${
                      selectedCategories.includes(category.id)
                        ? 'bg-brand-blue text-white'
                        : 'bg-brand-surface-2 border border-brand-border text-brand-text-secondary hover:bg-brand-border'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </motion.button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <motion.button
                  onClick={() => setSelectedCategories([])}
                  className="mt-2 text-xs text-brand-text-secondary hover:text-brand-text-primary transition"
                  whileHover={{ scale: 1.05 }}
                >
                  Clear all filters
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics Summary */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
        variants={itemVariants}
      >
        <motion.div 
          className="bg-brand-surface rounded-lg border border-brand-border p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUpIcon className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-brand-text-secondary">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {format(analytics.totalIncome, { maximumFractionDigits: 0 })}
          </p>
          <p className={`text-xs ${analytics.incomeTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analytics.incomeTrend >= 0 ? '+' : ''}{analytics.incomeTrend.toFixed(1)}% vs previous period
          </p>
        </motion.div>

        <motion.div 
          className="bg-brand-surface rounded-lg border border-brand-border p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDownIcon className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-brand-text-secondary">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {format(analytics.totalExpenses, { maximumFractionDigits: 0 })}
          </p>
          <p className={`text-xs ${analytics.expenseTrend <= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analytics.expenseTrend >= 0 ? '+' : ''}{analytics.expenseTrend.toFixed(1)}% vs previous period
          </p>
        </motion.div>

        <motion.div 
          className="bg-brand-surface rounded-lg border border-brand-border p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-brand-text-secondary">Net Income</span>
          </div>
          <p className={`text-2xl font-bold ${analytics.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}> 
            {format(analytics.netIncome, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-brand-text-secondary">
            {analytics.savingsRate.toFixed(1)}% savings rate
          </p>
        </motion.div>

        <motion.div 
          className="bg-brand-surface rounded-lg border border-brand-border p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <EyeIcon className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-brand-text-secondary">Daily Average</span>
          </div>
          <p className="text-lg font-bold text-brand-text-primary">
            {format(analytics.avgDailyExpenses, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-brand-text-secondary">
            Expense per day
          </p>
        </motion.div>

        <motion.div 
          className="bg-brand-surface rounded-lg border border-brand-border p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FilterIcon className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-brand-text-secondary">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-brand-text-primary">
            {analytics.transactionCount}
          </p>
          <p className="text-xs text-brand-text-secondary">
            Total transactions
          </p>
        </motion.div>
      </motion.div>

      {/* Dynamic Content Based on Selected View */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <MonthlyComparisonChart incomes={filteredData.filteredIncomes} expenses={filteredData.filteredExpenses} />
              <MonthlySpendChart expenses={filteredData.filteredExpenses} />
            </div>
            <div className="mt-6">
              <TransactionsReport incomes={filteredData.filteredIncomes} expenses={filteredData.filteredExpenses} />
            </div>
          </motion.div>
        )}

        {selectedView === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income vs Expenses Pie Chart */}
              <motion.div 
                className="bg-brand-surface rounded-lg border border-brand-border p-6"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Income vs Expenses</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Income', value: analytics.totalIncome, fill: '#22c55e' },
                          { name: 'Expenses', value: analytics.totalExpenses, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={(entry: any) => format(entry.value)}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={(value: number) => format(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Category Breakdown */}
              <motion.div 
                className="bg-brand-surface rounded-lg border border-brand-border p-6"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Top Categories</h3>
                <div className="space-y-3">
                  {analytics.categoryAnalysis.slice(0, 6).map((item, index) => (
                    <motion.div
                      key={item.category.id}
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.category.icon}</span>
                        <div>
                          <p className="font-medium text-brand-text-primary">{item.category.name}</p>
                          <p className="text-xs text-brand-text-secondary">{item.transactionCount} transactions</p>
                        </div>
                      </div>
                      <p className="font-semibold text-brand-text-primary">
                        {format(item.totalAmount, { maximumFractionDigits: 0 })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {selectedView === 'trends' && (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 gap-6">
              {/* Monthly Trend Chart */}
              <motion.div 
                className="bg-brand-surface rounded-lg border border-brand-border p-6"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Monthly Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.monthlyData}>
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
                      <Area type="monotone" dataKey="income" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Transaction Volume Trend */}
              <motion.div 
                className="bg-brand-surface rounded-lg border border-brand-border p-6"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Transaction Volume</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px' 
                        }}
                      />
                      <Bar dataKey="transactions" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {selectedView === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-brand-surface rounded-lg border border-brand-border p-6"
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-lg font-semibold text-brand-text-primary mb-4">Category Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.categoryAnalysis.map((item, index) => (
                  <motion.div
                    key={item.category.id}
                    className="bg-brand-surface-2 rounded-lg border border-brand-border p-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{item.category.icon}</span>
                      <div>
                        <h4 className="font-semibold text-brand-text-primary">{item.category.name}</h4>
                        <p className="text-xs text-brand-text-secondary">{item.category.type}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-brand-text-secondary">Total Amount</span>
                        <span className="font-semibold text-brand-text-primary">
                          {format(item.totalAmount, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-brand-text-secondary">Transactions</span>
                        <span className="font-semibold text-brand-text-primary">
                          {item.transactionCount}
                        </span>
                      </div>
                      {item.incomeAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-green-400">Income</span>
                          <span className="font-semibold text-green-400">
                            {format(item.incomeAmount, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}
                      {item.expenseAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-red-400">Expenses</span>
                          <span className="font-semibold text-red-400">
                            {format(item.expenseAmount, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReportPage;

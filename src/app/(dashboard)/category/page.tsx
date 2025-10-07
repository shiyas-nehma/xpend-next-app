'use client';

import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronRightIcon } from '@/components/icons/NavIcons';
import CategoryModal from '@/components/category/CategoryModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyStateIcon from '@/components/icons/EmptyStateIcon';
import type { Category, Expense, Income } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

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

const getBudgetStatus = (amount: number, budget: number, type: 'Expense' | 'Income') => {
    if (budget === 0) return { color: 'text-brand-text-secondary', gradient: 'bg-brand-surface-2' };
    
    const percentage = (amount / budget) * 100;
    const lightGradient = 'bg-gradient-to-r from-blue-400 to-brand-blue';

    if (type === 'Expense') {
        if (percentage > 90) return { color: 'text-red-400', gradient: lightGradient };
        if (percentage > 75) return { color: 'text-yellow-400', gradient: lightGradient };
        return { color: 'text-green-400', gradient: lightGradient };
    } else { // Income
        if (percentage >= 100) return { color: 'text-green-400', gradient: lightGradient };
        if (percentage > 50) return { color: 'text-yellow-400', gradient: lightGradient };
        return { color: 'text-red-400', gradient: lightGradient };
    }
}

// Category Stats Card Component
const CategoryStatsCard: React.FC<{ 
  categories: Category[]; 
  expenses: any[]; 
  incomes: any[];
}> = ({ categories, expenses, incomes }) => {
  const stats = React.useMemo(() => {
    const expenseCategories = categories.filter(c => c.type === 'Expense');
    const incomeCategories = categories.filter(c => c.type === 'Income');
    
    // Calculate actual amounts from transactions
    const categoryAmounts = new Map<string, { amount: number; transactions: number }>();
    
    // Process expenses
    expenses.forEach(expense => {
      const categoryKey = expense.category.docId || expense.category.id.toString();
      const current = categoryAmounts.get(categoryKey) || { amount: 0, transactions: 0 };
      categoryAmounts.set(categoryKey, {
        amount: current.amount + expense.amount,
        transactions: current.transactions + 1
      });
    });
    
    // Process incomes
    incomes.forEach(income => {
      const categoryKey = income.category.docId || income.category.id.toString();
      const current = categoryAmounts.get(categoryKey) || { amount: 0, transactions: 0 };
      categoryAmounts.set(categoryKey, {
        amount: current.amount + income.amount,
        transactions: current.transactions + 1
      });
    });
    
    const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    // Calculate actual spent from expense transactions
    const totalSpent = expenseCategories.reduce((sum, c) => {
      const categoryKey = c.docId || c.id.toString();
      const categoryData = categoryAmounts.get(categoryKey);
      return sum + (categoryData?.amount || 0);
    }, 0);
    
    // Calculate actual earned from income transactions
    const totalEarned = incomeCategories.reduce((sum, c) => {
      const categoryKey = c.docId || c.id.toString();
      const categoryData = categoryAmounts.get(categoryKey);
      return sum + (categoryData?.amount || 0);
    }, 0);
    
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return {
      totalExpenseCategories: expenseCategories.length,
      totalIncomeCategories: incomeCategories.length,
      totalBudget,
      totalSpent,
      totalEarned,
      budgetUtilization,
      remainingBudget: totalBudget - totalSpent,
      totalTransactions: expenses.length + incomes.length
    };
  }, [categories, expenses, incomes]);

  return (
    <motion.div 
      className="bg-brand-surface rounded-2xl p-6 border border-brand-border mb-8 relative bg-clip-padding 
                 before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50"
      variants={statsVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <h3 className="text-sm font-medium text-brand-text-secondary mb-1">Total Categories</h3>
          <motion.p 
            className="text-2xl font-bold text-brand-text-primary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            key={categories.length}
          >
            {categories.length}
          </motion.p>
          <p className="text-xs text-brand-text-secondary">
            {stats.totalExpenseCategories} Expense • {stats.totalIncomeCategories} Income
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <h3 className="text-sm font-medium text-brand-text-secondary mb-1">Total Budget</h3>
          <motion.p 
            className="text-2xl font-bold text-brand-text-primary"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
            key={stats.totalBudget}
          >
            ${stats.totalBudget.toLocaleString()}
          </motion.p>
          <p className="text-xs text-brand-text-secondary">Monthly allocation</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <h3 className="text-sm font-medium text-brand-text-secondary mb-1">Total Spent</h3>
          <motion.p 
            className="text-2xl font-bold text-red-400"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
            key={stats.totalSpent}
          >
            ${stats.totalSpent.toLocaleString()}
          </motion.p>
          <p className="text-xs text-brand-text-secondary">
            {stats.budgetUtilization.toFixed(1)}% of budget
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
        >
          <h3 className="text-sm font-medium text-brand-text-secondary mb-1">Remaining</h3>
          <motion.p 
            className={`text-2xl font-bold ${stats.remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
            key={stats.remainingBudget}
          >
            ${Math.abs(stats.remainingBudget).toLocaleString()}
          </motion.p>
          <p className="text-xs text-brand-text-secondary">
            {stats.remainingBudget >= 0 ? 'Under budget' : 'Over budget'}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
        >
          <h3 className="text-sm font-medium text-brand-text-secondary mb-1">Transactions</h3>
          <motion.p 
            className="text-2xl font-bold text-brand-blue"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
            key={stats.totalTransactions}
          >
            {stats.totalTransactions}
          </motion.p>
          <p className="text-xs text-brand-text-secondary">This month</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Recent Transactions Component for Category
const CategoryTransactions: React.FC<{
  category: Category;
  expenses: Expense[];
  incomes: Income[];
  isVisible: boolean;
}> = ({ category, expenses, incomes, isVisible }) => {
  const categoryTransactions = React.useMemo(() => {
    const categoryKey = category.docId || category.id.toString();
    
    const relatedExpenses = expenses
      .filter(e => (e.category.docId || e.category.id.toString()) === categoryKey)
      .map(e => ({ ...e, type: 'expense' as const }));
    
    const relatedIncomes = incomes
      .filter(i => (i.category.docId || i.category.id.toString()) === categoryKey)
      .map(i => ({ ...i, type: 'income' as const }));
    
    return [...relatedExpenses, ...relatedIncomes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Show only last 5 transactions
  }, [category, expenses, incomes]);

  if (!isVisible || categoryTransactions.length === 0) return null;

  return (
    <motion.div
      className="mt-4 pt-4 border-t border-brand-border"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className="text-xs font-semibold text-brand-text-secondary mb-3 flex items-center gap-2">
        Recent Transactions 
        <span className="bg-brand-surface-2 px-2 py-0.5 rounded-full text-xs">
          {categoryTransactions.length}
        </span>
      </h4>
      <div className="space-y-2">
        {categoryTransactions.map((transaction, index) => (
          <motion.div
            key={`${transaction.type}-${transaction.id}`}
            className="flex items-center justify-between text-xs"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-brand-text-primary truncate font-medium">
                {transaction.description}
              </p>
              <p className="text-brand-text-secondary">
                {new Date(transaction.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}$
                {transaction.amount.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      {categoryTransactions.length >= 5 && (
        <motion.button
          className="w-full mt-3 text-xs text-brand-blue hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View All <ChevronRightIcon className="w-3 h-3" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default function CategoryPage() {
  const { 
    categories, 
    categoriesLoading,
    categoriesError,
    expenses,
    incomes,
    expensesLoading,
    incomesLoading,
    addCategory, 
    updateCategory, 
    deleteCategory,
    getCategoriesByType,
    searchCategories,
    getCategoryStats
  } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [animatingOutId, setAnimatingOutId] = useState<number | null>(null);
  const [animatingInId, setAnimatingInId] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const { addToast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const userLocale = typeof window !== 'undefined' ? navigator.language : 'en-US';

  const handleAddNew = () => {
    if (!user) {
      addToast('Please sign in to add categories', 'error');
      return;
    }
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    if (!user) {
      addToast('Please sign in to edit categories', 'error');
      return;
    }
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (categoryData: Omit<Category, 'id' | 'transactions' | 'amount'> & { id?: number }) => {
    try {
      if (categoryData.id) {
        // Editing existing category
        const updatedCategory: Category = { 
          ...editingCategory!, 
          ...categoryData,
          transactions: editingCategory?.transactions || 0,
          amount: editingCategory?.amount || 0
        } as Category;
        await updateCategory(updatedCategory);
        setHighlightedId(categoryData.id);
        setTimeout(() => setHighlightedId(null), 1200);
      } else {
        // Adding new category
        const newCategoryData: Omit<Category, 'id'> = {
          ...categoryData,
          transactions: 0,
          amount: 0,
        };
        const newCategory = await addCategory(newCategoryData);
        setAnimatingInId(newCategory.id);
        setTimeout(() => setAnimatingInId(null), 400);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      // Error handling is already done in the hook
    }
  };

  const handleDeleteRequest = (id: number) => {
    if (!user) {
      addToast('Please sign in to delete categories', 'error');
      return;
    }
    setDeletingCategoryId(id);
  };

  const handleConfirmDelete = async () => {
    if (deletingCategoryId) {
      const categoryToDelete = categories.find(c => c.id === deletingCategoryId);
      const idToDelete = deletingCategoryId;
      setAnimatingOutId(idToDelete);
      setDeletingCategoryId(null);

      setTimeout(async () => {
        try {
          await deleteCategory(idToDelete);
          setAnimatingOutId(null);
        } catch (error) {
          console.error('Error deleting category:', error);
          setAnimatingOutId(null);
        }
      }, 400);
    }
  };
  
  const handleCancelDelete = () => {
    setDeletingCategoryId(null);
  };

  const categoryToDelete = categories.find(c => c.id === deletingCategoryId);

  // Calculate actual category data from transactions
  const categoryData = React.useMemo(() => {
    const data = new Map<string, { amount: number; transactions: number }>();
    
    // Process expenses
    expenses.forEach(expense => {
      const categoryKey = expense.category.docId || expense.category.id.toString();
      const current = data.get(categoryKey) || { amount: 0, transactions: 0 };
      data.set(categoryKey, {
        amount: current.amount + expense.amount,
        transactions: current.transactions + 1
      });
    });
    
    // Process incomes
    incomes.forEach(income => {
      const categoryKey = income.category.docId || income.category.id.toString();
      const current = data.get(categoryKey) || { amount: 0, transactions: 0 };
      data.set(categoryKey, {
        amount: current.amount + income.amount,
        transactions: current.transactions + 1
      });
    });
    
    return data;
  }, [expenses, incomes]);

  const filteredCategories = categories
    .filter(category => {
        if (activeFilter === 'All') return true;
        return category.type === activeFilter;
    })
    .filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Dedupe categories in case duplicate numeric ids slipped through (hash collisions, race conditions)
  const dedupedCategories = React.useMemo(() => {
    const seen = new Set<string>();
    const out: typeof filteredCategories = [];
    for (const c of filteredCategories) {
      const stableKey = c.docId ? `${c.docId}` : `n${c.id}`;
      if (!seen.has(stableKey)) {
        seen.add(stableKey);
        out.push(c);
      }
    }
    return out;
  }, [filteredCategories]);

  type FilterType = 'All' | 'Expense' | 'Income';
  const filters: FilterType[] = ['All', 'Expense', 'Income'];

  return (
    <>
      <motion.div 
        className="p-8 flex flex-col h-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="flex justify-between items-center mb-6 flex-shrink-0"
          variants={headerVariants}
        >
          <h1 className="text-2xl font-bold text-brand-text-primary">Categories</h1>
          {!categoriesLoading && categories.length > 0 && (
             <motion.div 
               className="flex items-center gap-4"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
             >
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                    <motion.input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-brand-surface border border-brand-border rounded-lg py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200"
                        whileFocus={{
                          scale: 1.02,
                          borderColor: "rgb(59 130 246)",
                          transition: { duration: 0.2 }
                        }}
                    />
                </motion.div>
              <div className="flex space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                  {filters.map((filter) => (
                      <motion.button
                          key={filter}
                          onClick={() => setActiveFilter(filter)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              activeFilter === filter
                                  ? 'bg-brand-surface-2 text-white shadow-sm'
                                  : 'text-brand-text-secondary hover:bg-brand-surface-2/50'
                          }`}
                          whileHover={{ 
                            scale: 1.05,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ 
                            scale: 0.95,
                            transition: { duration: 0.1 }
                          }}
                          animate={{
                            backgroundColor: activeFilter === filter ? "rgba(59, 130, 246, 0.8)" : "transparent"
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }}
                      >
                          {filter}
                      </motion.button>
                  ))}
              </div>
              <motion.button 
                onClick={handleAddNew}
                className={`flex items-center space-x-2 font-bold py-2 px-4 rounded-lg transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))] ${!user ? 'opacity-50 cursor-not-allowed' : 'bg-white text-black'}`}
                disabled={!user}
                whileHover={user ? {
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(240, 240, 240, 1)"
                } : {}}
                whileTap={user ? { scale: 0.95 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              >
                <motion.div
                  whileHover={user ? { rotate: 90 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <PlusIcon className="w-5 h-5" />
                </motion.div>
                <span>{user ? 'Add New' : 'Sign in to Add'}</span>
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Category Stats Card */}
        {!categoriesLoading && categories.length > 0 && (
          <CategoryStatsCard 
            categories={categories} 
            expenses={expenses || []} 
            incomes={incomes || []} 
          />
        )}

        <div className="flex-grow">
          {categoriesLoading || expensesLoading || incomesLoading ? (
            <motion.div 
              className="flex items-center justify-center h-64"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LoadingSpinner size="large" />
              <span className="ml-3 text-brand-text-secondary">
                Loading {categoriesLoading ? 'categories' : expensesLoading ? 'expenses' : 'incomes'}...
              </span>
            </motion.div>
          ) : categoriesError ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyState
                icon={<EmptyStateIcon />}
                title="Error Loading Categories"
                message={<>There was an error loading your categories: {categoriesError}</>}
                primaryAction={
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300
                                  shadow-[0_0_20px_rgba(255,255,255,0.1)]
                                  bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                  <span>Retry</span>
                </button>
              }
            /></motion.div>
          ) : categories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyState
                icon={<EmptyStateIcon />}
                title="No categories found"
                message={<>Please create a new category to get started.</>}
                primaryAction={
                  <motion.button 
                    onClick={handleAddNew}
                    className={`flex items-center space-x-2 font-bold py-2 px-4 rounded-lg transition duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))] ${!user ? 'opacity-50 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                    disabled={!user}
                    whileHover={user ? { scale: 1.05 } : {}}
                    whileTap={user ? { scale: 0.95 } : {}}
                    animate={user ? { 
                      boxShadow: [
                        "0 0 20px rgba(255,255,255,0.1)",
                        "0 0 30px rgba(255,255,255,0.3)",
                        "0 0 20px rgba(255,255,255,0.1)"
                      ]
                    } : {}}
                    transition={user ? { 
                      boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    } : {}}
                  >
                  <PlusIcon className="w-5 h-5" />
                  <span>{user ? 'Create Category' : 'Sign in to Create'}</span>
                </motion.button>
              }
            /></motion.div>
          ) : filteredCategories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyState
                icon={<EmptyStateIcon />}
                title={searchQuery ? 'No Results Found' : `No ${activeFilter} categories`}
                message={
                    searchQuery 
                    ? <>Your search for "{searchQuery}" did not return any results.</>
                    : <>There are no categories that match the selected filter.</>
                }
                primaryAction={
                  <button 
                    onClick={() => {
                        if (searchQuery) setSearchQuery('');
                        else setActiveFilter('All');
                    }}
                    className="flex items-center space-x-2 bg-brand-surface-2 border border-brand-border font-bold py-2 px-4 rounded-lg hover:bg-brand-border transition duration-300">
                    <span>{searchQuery ? 'Clear Search' : 'Show All Categories'}</span>
                  </button>
                }
              /></motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {dedupedCategories.map((category) => {
                  // Get actual transaction data for this category
                  const categoryKey = category.docId || category.id.toString();
                  const actualData = categoryData.get(categoryKey) || { amount: 0, transactions: 0 };
                  
                  const budgetStatus = getBudgetStatus(actualData.amount, category.budget, category.type);
                  const progressPercentage = category.budget > 0 ? Math.min((actualData.amount / category.budget) * 100, 100) : 0;
                  
                  return (
                      <motion.div 
                        key={category.docId ? category.docId : `cat-${category.id}-${category.name}`} 
                        className={`group relative p-5 bg-brand-surface rounded-2xl border border-brand-border flex flex-col cursor-pointer
                            ${highlightedId === category.id ? 'animate-highlight' : ''}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{
                          y: -8,
                          scale: 1.02,
                          borderColor: "rgb(59 130 246)",
                          boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
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
                        layoutId={`category-${category.id}`}
                        onClick={() => setExpandedCategory(
                          expandedCategory === category.id ? null : category.id
                        )}
                      >
                        {/* Top Content */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <motion.div 
                                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden shrink-0 ${category.type === 'Expense' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}
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
                                        <p className="font-semibold text-base text-brand-text-primary">{category.name}</p>
                                        <p className={`text-xs font-medium ${category.type === 'Expense' ? 'text-red-400' : 'text-blue-400'}`}>{category.type}</p>
                                    </motion.div>
                                </div>
                                <motion.div 
                                  className="absolute top-3 right-3 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-100 transition-opacity duration-300 z-10"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.05 }}
                                  transition={{ duration: 0.2 }}
                                >
                                    <motion.button 
                                      className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors" 
                                      title={`Edit ${category.name}`} 
                                      aria-label={`Edit ${category.name} category`}
                                      whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                                      whileTap={{ scale: 0.95 }}
                                      transition={{ type: "spring", stiffness: 400 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(category);
                                      }}
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button 
                                      className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border transition-colors border-l border-brand-border" 
                                      title={`Delete ${category.name}`} 
                                      aria-label={`Delete ${category.name} category`}
                                      whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                      whileTap={{ scale: 0.95 }}
                                      transition={{ type: "spring", stiffness: 400 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRequest(category.id);
                                      }}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>
                            </div>
                            
                            <motion.div 
                              className="mb-3"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                                <motion.p 
                                  className="text-2xl font-bold text-brand-text-primary"
                                  whileHover={{ scale: 1.05 }}
                                  key={actualData.amount}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ type: "spring", stiffness: 400 }}
                                >
                                  ${actualData.amount.toLocaleString(userLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </motion.p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-brand-text-secondary">
                                    {actualData.transactions} transactions this month
                                  </p>
                                  {actualData.transactions > 0 && (
                                    <motion.span 
                                      className="text-xs text-brand-blue flex items-center gap-1"
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.2 }}
                                    >
                                      {expandedCategory === category.id ? 'Hide' : 'View'} details
                                      <ChevronRightIcon 
                                        className={`w-3 h-3 transition-transform ${
                                          expandedCategory === category.id ? 'rotate-90' : ''
                                        }`} 
                                      />
                                    </motion.span>
                                  )}
                                </div>
                            </motion.div>

                            {category.description && (
                                <motion.p 
                                  className="text-sm text-brand-text-secondary leading-snug"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  {category.description}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Budget Progress */}
                        <motion.div 
                          className="mt-auto pt-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                            {category.budget > 0 && (
                                <div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-brand-text-secondary font-medium">{category.type === 'Expense' ? 'Budget' : 'Goal'}</span>
                                        <motion.span 
                                          className={`font-semibold ${budgetStatus.color}`}
                                          key={`${actualData.amount}-${category.budget}`}
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.3 }}
                                        >
                                            ${Math.round(actualData.amount).toLocaleString(userLocale)} / ${category.budget.toLocaleString(userLocale)}
                                        </motion.span>
                                    </div>
                                    <div className="w-full bg-brand-surface-2 rounded-full h-2 overflow-hidden">
                                        <motion.div 
                                            className={`h-2 rounded-full ${budgetStatus.gradient}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercentage}%` }}
                                            transition={{ 
                                              duration: 0.8, 
                                              delay: 0.5,
                                              type: "spring",
                                              stiffness: 100,
                                              damping: 20 
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Recent Transactions */}
                        <CategoryTransactions 
                          category={category}
                          expenses={expenses || []}
                          incomes={incomes || []}
                          isVisible={expandedCategory === category.id}
                        />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
      <CategoryModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
       <ConfirmationModal
        isOpen={!!deletingCategoryId}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete the "${categoryToDelete?.name}" category? This action cannot be undone.`}
      />
    </>
  );
}

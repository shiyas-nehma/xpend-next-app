'use client';

import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@/components/icons/NavIcons';
import CategoryModal from '@/components/category/CategoryModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import EmptyState from '@/components/common/EmptyState';
import EmptyStateIcon from '@/components/icons/EmptyStateIcon';
import type { Category } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useData } from '@/hooks/useData';

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


export default function CategoryPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [animatingOutId, setAnimatingOutId] = useState<number | null>(null);
  const [animatingInId, setAnimatingInId] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const handleAddNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (categoryData: Omit<Category, 'id' | 'transactions' | 'amount'> & { id?: number }) => {
    if (categoryData.id) {
      // Editing existing category
      updateCategory({ ...editingCategory, ...categoryData } as Category);
      setHighlightedId(categoryData.id);
      addToast('Category updated successfully!', 'success');
      setTimeout(() => setHighlightedId(null), 1200); // Animation duration
    } else {
      // Adding new category
      const newCategory: Category = {
        transactions: 0,
        amount: 0,
        ...categoryData,
        id: Date.now(),
      };
      addCategory(newCategory);
      setAnimatingInId(newCategory.id);
      addToast('New category created!', 'success');
      setTimeout(() => setAnimatingInId(null), 400); // Animation duration
    }
    handleCloseModal();
  };

  const handleDeleteRequest = (id: number) => {
    setDeletingCategoryId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingCategoryId) {
      const categoryToDelete = categories.find(c => c.id === deletingCategoryId);
      const idToDelete = deletingCategoryId;
      setAnimatingOutId(idToDelete);
      setDeletingCategoryId(null);

      setTimeout(() => {
        deleteCategory(idToDelete);
        setAnimatingOutId(null);
        if (categoryToDelete) {
          addToast(`Category "${categoryToDelete.name}" deleted.`, 'info');
        }
      }, 400); // Should match animation duration
    }
  };
  
  const handleCancelDelete = () => {
    setDeletingCategoryId(null);
  };

  const categoryToDelete = categories.find(c => c.id === deletingCategoryId);

  const filteredCategories = categories
    .filter(category => {
        if (activeFilter === 'All') return true;
        return category.type === activeFilter;
    })
    .filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  type FilterType = 'All' | 'Expense' | 'Income';
  const filters: FilterType[] = ['All', 'Expense', 'Income'];

  return (
    <>
      <div className="p-8 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-brand-text-primary">Categories</h1>
          {categories.length > 0 && (
             <div className="flex items-center gap-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-brand-surface border border-brand-border rounded-lg py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
              <div className="flex space-x-1 bg-brand-surface p-1 rounded-lg border border-brand-border">
                  {filters.map((filter) => (
                      <button
                          key={filter}
                          onClick={() => setActiveFilter(filter)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              activeFilter === filter
                                  ? 'bg-brand-surface-2 text-white shadow-sm'
                                  : 'text-brand-text-secondary hover:bg-brand-surface-2/50'
                          }`}
                      >
                          {filter}
                      </button>
                  ))}
              </div>
              <button 
                onClick={handleAddNew}
                className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300
                              shadow-[0_0_20px_rgba(255,255,255,0.1)]
                              bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                <PlusIcon className="w-5 h-5" />
                <span>Add New</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-grow">
          {categories.length === 0 ? (
            <EmptyState
              icon={<EmptyStateIcon />}
              title="No categories found"
              message={<>Please create a new category to get started.</>}
              primaryAction={
                <button 
                  onClick={handleAddNew}
                  className="flex items-center space-x-2 bg-white text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-300
                                  shadow-[0_0_20px_rgba(255,255,255,0.1)]
                                  bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Category</span>
                </button>
              }
            />
          ) : filteredCategories.length === 0 ? (
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
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => {
                const budgetStatus = getBudgetStatus(category.amount, category.budget, category.type);
                const progressPercentage = category.budget > 0 ? Math.min((category.amount / category.budget) * 100, 100) : 0;
                
                return (
                    <div key={category.id} className={`group relative p-5 bg-brand-surface rounded-2xl border border-brand-border flex flex-col transition-colors duration-300 hover:border-brand-blue hover:shadow-lg hover:shadow-brand-blue/10
                        ${animatingOutId === category.id ? 'animate-fade-out-scale' : ''}
                        ${animatingInId === category.id ? 'animate-fade-in-scale' : ''}
                        ${highlightedId === category.id ? 'animate-highlight' : ''}`}>
                        {/* Top Content */}
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden shrink-0 ${category.type === 'Expense' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                        <div className={`absolute inset-0 rounded-lg ${category.type === 'Expense' ? 'bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.2)_0%,_transparent_70%)]'}`}></div>
                                        <span className="relative z-10">{category.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base text-brand-text-primary">{category.name}</p>
                                        <p className={`text-xs font-medium ${category.type === 'Expense' ? 'text-red-400' : 'text-blue-400'}`}>{category.type}</p>
                                    </div>
                                </div>
                                <div className="absolute top-3 right-3 flex items-center rounded-md bg-brand-surface-2/80 backdrop-blur-sm border border-brand-border overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <button onClick={() => handleEdit(category)} className="p-1.5 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors" title={`Edit ${category.name}`} aria-label={`Edit ${category.name} category`}><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteRequest(category.id)} className="p-1.5 text-brand-text-secondary hover:text-red-400 hover:bg-brand-border transition-colors border-l border-brand-border" title={`Delete ${category.name}`} aria-label={`Delete ${category.name} category`}><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <p className="text-2xl font-bold text-brand-text-primary">${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-sm text-brand-text-secondary">{category.transactions} transactions this month</p>
                            </div>

                            {category.description && (
                                <p className="text-sm text-brand-text-secondary leading-snug">{category.description}</p>
                            )}
                        </div>

                        {/* Budget Progress */}
                        <div className="mt-auto pt-4">
                            {category.budget > 0 && (
                                <div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-brand-text-secondary font-medium">{category.type === 'Expense' ? 'Budget' : 'Goal'}</span>
                                        <span className={`font-semibold ${budgetStatus.color}`}>
                                            ${Math.round(category.amount)} / ${category.budget}
                                        </span>
                                    </div>
                                    <div className="w-full bg-brand-surface-2 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${budgetStatus.gradient}`}
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
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

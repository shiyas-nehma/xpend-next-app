'use client';

import React, { useState } from 'react';
import { seedDemoCategories, clearAllCategories } from '@/utils/seedCategories';
import { useToast } from '@/hooks/useToast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const CategoryDebugPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedDemoCategories();
      addToast('Demo categories added successfully!', 'success');
    } catch (error) {
      console.error('Error seeding data:', error);
      addToast('Failed to seed demo categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL categories? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await clearAllCategories();
      addToast('All categories cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      addToast('Failed to clear categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-brand-surface border border-brand-border rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-semibold text-brand-text-primary mb-3">Category Debug Panel</h3>
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleSeedData}
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm px-3 py-2 rounded transition-colors"
        >
          {loading ? <LoadingSpinner size="small" /> : null}
          <span>Seed Demo Data</span>
        </button>
        
        <button
          onClick={handleClearData}
          disabled={loading}
          className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm px-3 py-2 rounded transition-colors"
        >
          {loading ? <LoadingSpinner size="small" /> : null}
          <span>Clear All Data</span>
        </button>
      </div>
    </div>
  );
};

export default CategoryDebugPanel;
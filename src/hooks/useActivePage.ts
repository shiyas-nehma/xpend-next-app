'use client';

import { usePathname } from 'next/navigation';

export const useActivePage = () => {
  const pathname = usePathname();

  const getActivePageFromPath = (path: string): string => {
    const pathSegments = path.split('/').filter(Boolean);
    
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return 'Dashboard';
    }

    const pageMap: { [key: string]: string } = {
      'all': 'AI',
      'accounts': 'Accounts',
      'income': 'Income',
      'expense': 'Expense',
      'category': 'Category',
      'budget': 'Budget',
      'goals': 'Goals',
      'report': 'Report',
      'settings': 'Settings',
    };

    return pageMap[pathSegments[0]] || 'Dashboard';
  };

  return getActivePageFromPath(pathname);
};
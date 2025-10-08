'use client';

import React, { useState } from 'react';
import { DashboardIcon, IncomeIcon, ExpenseIcon, CategoryIcon, BudgetIcon, GoalIcon, ReportIcon, SettingsIcon, LogoutIcon, AIIcon, AccountsIcon, RepeatIcon } from '@/components/icons/NavIcons';

const MobileNavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 transition-colors ${
      active 
        ? 'text-brand-text-primary' 
        : 'text-brand-text-secondary hover:text-brand-text-primary'
    }`}
  >
    <div className="text-xl">{icon}</div>
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const MobileNavigation: React.FC<{ 
  activePage: string; 
  onNavigate: (page: string) => void 
}> = ({ activePage, onNavigate }) => {
  const mainNav = [
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'AI', icon: <AIIcon /> },
    { label: 'Accounts', icon: <AccountsIcon /> },
    { label: 'Expense', icon: <ExpenseIcon /> },
    { label: 'Recurring', icon: <RepeatIcon /> },
    { label: 'Report', icon: <ReportIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {mainNav.map(item => (
          <MobileNavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={activePage === item.label}
            onClick={() => onNavigate(item.label)}
          />
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;
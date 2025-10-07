
'use client';

import React from 'react';
import { DashboardIcon, IncomeIcon, ExpenseIcon, CategoryIcon, BudgetIcon, GoalIcon, ReportIcon, SettingsIcon, LogoutIcon, Logo, AIIcon, AccountsIcon } from '@/components/icons/NavIcons';

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  isLogout?: boolean;
  isLoading?: boolean;
}> = ({ icon, label, active, onClick, isLogout = false, isLoading = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    title={label}
    className={`flex w-full items-center justify-center p-3 rounded-lg transition-colors ${
      isLoading
        ? 'opacity-50 cursor-not-allowed'
        : isLogout 
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
          : active 
            ? 'bg-brand-surface-2 text-brand-text-primary' 
            : 'text-brand-text-secondary hover:bg-brand-surface-2 hover:text-brand-text-primary'
    }`}
  >
    {isLoading && isLogout ? (
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
    ) : (
      icon
    )}
  </button>
);

const Sidebar: React.FC<{ 
  activePage: string; 
  onNavigate: (page: string) => void;
  isLoggingOut?: boolean;
}> = ({ activePage, onNavigate, isLoggingOut = false }) => {

  const mainNav = [
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'AI', icon: <AIIcon /> },
    { label: 'Accounts', icon: <AccountsIcon /> },
    { label: 'Income', icon: <IncomeIcon /> },
    { label: 'Expense', icon: <ExpenseIcon /> },
    { label: 'Category', icon: <CategoryIcon /> },
    { label: 'Budget', icon: <BudgetIcon /> },
    { label: 'Goals', icon: <GoalIcon /> },
    { label: 'Report', icon: <ReportIcon /> },
  ];

  const bottomNav = [
    { label: 'Settings', icon: <SettingsIcon /> },
    { label: 'Logout', icon: <LogoutIcon /> },
  ];

  return (
    <aside className="fixed left-0 top-0 w-20 h-screen bg-brand-surface hidden md:flex flex-col items-center border-r border-brand-border py-6 z-50 overflow-hidden">
      <Logo />
      <nav className="w-full flex-1 mt-12 overflow-y-auto min-h-0 scrollbar-hide">
        <ul className="space-y-4 px-4">
          {mainNav.map(item => (
            <li key={item.label}>
              <NavItem 
                icon={item.icon} 
                label={item.label} 
                active={activePage === item.label} 
                onClick={() => onNavigate(item.label)} 
              />
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto w-full">
        <ul className="space-y-4 px-4">
            {bottomNav.map(item => (
                <li key={item.label}>
                    <NavItem 
                      icon={item.icon} 
                      label={item.label} 
                      active={activePage === item.label} 
                      onClick={() => onNavigate(item.label)}
                      isLogout={item.label === 'Logout'}
                      isLoading={item.label === 'Logout' && isLoggingOut}
                    />
                </li>
            ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
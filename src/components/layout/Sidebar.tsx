
'use client';

import React from 'react';
import { DashboardIcon, IncomeIcon, ExpenseIcon, CategoryIcon, BudgetIcon, GoalIcon, ReportIcon, SettingsIcon, LogoutIcon, Logo, AIIcon, AccountsIcon } from '../icons/NavIcons';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex w-full items-center justify-center p-3 rounded-lg transition-colors ${active ? 'bg-brand-surface-2 text-brand-text-primary' : 'text-brand-text-secondary hover:bg-brand-surface-2 hover:text-brand-text-primary'}`}
  >
    {icon}
  </button>
);

const Sidebar: React.FC<{ activePage: string, onNavigate: (page: string) => void }> = ({ activePage, onNavigate }) => {

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
    <aside className="w-20 bg-brand-surface flex flex-col items-center border-r border-brand-border py-6 z-20">
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
                    />
                </li>
            ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
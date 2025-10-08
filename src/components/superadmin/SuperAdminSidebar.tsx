'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/useToast';

import { DashboardIcon, PlansIcon, UsersIcon, SettingsIcon, LogoutIcon } from './icons';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | number;
  active?: boolean;
}

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems?: MenuItem[]; // externally supplied navigation config
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isOpen, onClose, navItems }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  // fallback if navItems not provided (backwards compatible)
  const fallback: MenuItem[] = [
    { icon: <DashboardIcon />, label: 'Dashboard', href: '/superadmin/dashboard' },
    { icon: <PlansIcon />, label: 'Subscription Plans', href: '/superadmin/subscription' },
    { icon: <UsersIcon />, label: 'Subscribed Users', href: '/superadmin/subscribed-users' },
    { icon: <SettingsIcon />, label: 'Settings', href: '/superadmin/settings' },
  ];
  const menuItems = (navItems && navItems.length ? navItems : fallback).map(m => ({ ...m, active: m.active ?? pathname === m.href }));

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_data');
      addToast('Logged out successfully', 'success');
      router.push('/superadmin/login');
    } catch (error: any) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_data');
      addToast(`Logout failed: ${error.message}`, 'error');
      router.push('/superadmin/login');
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-brand-surface text-brand-text-primary border-r border-brand-border transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-brand-border/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-surface-2 rounded-lg flex items-center justify-center">
              <div className="w-2 h-5 bg-brand-blue rounded-full transform -skew-x-12" />
              <div className="w-2 h-6 bg-brand-blue rounded-full transform -skew-x-12 ml-1" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-brand-text-secondary">XPEND</h2>
              <p className="text-xs text-brand-text-secondary/70">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-surface-2/60 scrollbar-track-transparent">
          <ul className="space-y-1 px-3">
            {menuItems.map((item, index) => {
              const isActive = item.active;
              return (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors border border-transparent ${isActive ? 'bg-brand-surface-2 text-white border-brand-border shadow-inner' : 'text-brand-text-secondary hover:bg-brand-surface-2/70 hover:text-white'} `}
                  >
                    <span className={`shrink-0 p-1 rounded-md ${isActive ? 'bg-brand-blue/20 text-brand-blue' : 'bg-brand-surface-2 text-brand-text-secondary group-hover:text-brand-blue group-hover:bg-brand-blue/10'}`}>{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-surface-2 border border-brand-border text-brand-text-secondary">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-brand-border/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-brand-text-secondary hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium"
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
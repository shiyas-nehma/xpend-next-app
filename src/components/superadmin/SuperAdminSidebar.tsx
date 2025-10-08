'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/useToast';

// Icons (simplified SVG icons)
const SubscriptionIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DashboardIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive?: boolean;
}

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();

  const menuItems: MenuItem[] = [
    {
      icon: <DashboardIcon />,
      label: 'Dashboard',
      path: '/superadmin/dashboard',
    },
    {
      icon: <SubscriptionIcon />,
      label: 'Subscription',
      path: '/superadmin/subscription',
    },
    {
      icon: <UsersIcon />,
      label: 'Subscribed Users',
      path: '/superadmin/subscribed-users',
    },
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      path: '/superadmin/settings',
    },
  ];

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

  const handleNavigation = (path: string) => {
    router.push(path);
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
        fixed top-0 left-0 h-screen w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-indigo-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-2 h-5 bg-indigo-900 rounded-full transform -skew-x-12" />
              <div className="w-2 h-6 bg-indigo-900 rounded-full transform -skew-x-12 ml-1" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Super Admin</h2>
              <p className="text-indigo-300 text-sm">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-4">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200
                      ${isActive 
                        ? 'bg-indigo-700 text-white border-l-4 border-white' 
                        : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-white' : 'text-indigo-300'}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer/Logout */}
        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            <LogoutIcon />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
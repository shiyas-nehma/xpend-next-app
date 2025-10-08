'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '@/components/superadmin/SuperAdminHeader';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  
  // Pages that don't need sidebar and authentication
  const noSidebarPages = ['/superadmin/login', '/superadmin/logout'];
  const showSidebar = !noSidebarPages.includes(pathname);

  // Authentication check for protected pages
  useEffect(() => {
    if (!showSidebar) {
      setAuthLoading(false);
      return;
    }

    const checkAuth = () => {
      const token = localStorage.getItem('superadmin_token');
      const adminData = localStorage.getItem('superadmin_data');
      
      if (!token || !adminData) {
        console.log('No superadmin session found, redirecting to login');
        router.push('/superadmin/login');
        return;
      }
      
      setAuthLoading(false);
    };

    checkAuth();
  }, [pathname, showSidebar, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // If no sidebar is needed (login/logout pages), render simple layout
  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Show loading for protected pages while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SuperAdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main Content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <SuperAdminHeader onMenuToggle={toggleSidebar} />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
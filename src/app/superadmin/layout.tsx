"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminShell from '@/components/superadmin/shell/AdminShell';
import { useSuperAdminAuth } from '@/hooks/superadmin/useSuperAdminAuth';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, authenticated } = useSuperAdminAuth();

  const publicPages = ['/superadmin/login', '/superadmin/logout'];
  const protectedRoute = !publicPages.includes(pathname);

  console.log('SuperAdminLayout render:', { 
    pathname, 
    loading, 
    authenticated, 
    protectedRoute,
    publicPages 
  });

  useEffect(() => {
    console.log('SuperAdminLayout useEffect:', { loading, protectedRoute, authenticated });
    if (!loading && protectedRoute && !authenticated) {
      console.log('SuperAdminLayout: Redirecting to login due to unauthenticated access');
      // Use window.location for more reliable redirect
      window.location.href = '/superadmin/login';
    }
  }, [loading, protectedRoute, authenticated]);

  if (!protectedRoute) {
    return <div className="min-h-screen bg-brand-bg text-brand-text-primary">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-text-secondary">
        <div className="animate-pulse">Verifying session...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // redirect in effect
  }

  return <AdminShell>{children}</AdminShell>;
};

export default SuperAdminLayout;
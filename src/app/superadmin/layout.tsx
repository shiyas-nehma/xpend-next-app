"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminShell from '@/components/superadmin/shell/AdminShell';
import { useSuperAdminAuth } from '@/hooks/superadmin/useSuperAdminAuth';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Use a try-catch wrapper for the auth hook
  let loading = true;
  let authenticated = false;
  
  try {
    const authResult = useSuperAdminAuth();
    loading = authResult.loading;
    authenticated = authResult.authenticated;
  } catch (error: any) {
    console.error('SuperAdminLayout: Auth hook error:', error);
    setAuthError(error.message);
    loading = false;
    authenticated = false;
  }

  const publicPages = ['/superadmin/login', '/superadmin/logout'];
  const protectedRoute = !publicPages.includes(pathname);

  console.log('SuperAdminLayout render:', { 
    pathname, 
    loading, 
    authenticated, 
    protectedRoute,
    publicPages,
    authError
  });

  useEffect(() => {
    console.log('SuperAdminLayout useEffect:', { loading, protectedRoute, authenticated, authError });
    if (!loading && protectedRoute && !authenticated && !authError) {
      console.log('SuperAdminLayout: Redirecting to login due to unauthenticated access');
      // Use window.location for more reliable redirect
      window.location.href = '/superadmin/login';
    }
  }, [loading, protectedRoute, authenticated, authError]);

  if (!protectedRoute) {
    return <div className="min-h-screen bg-brand-bg text-brand-text-primary">{children}</div>;
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-text-secondary">
        <div className="text-center">
          <div className="text-red-500 mb-4">Authentication Error</div>
          <div className="text-sm mb-4">{authError}</div>
          <button 
            onClick={() => window.location.href = '/superadmin/login'}
            className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
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
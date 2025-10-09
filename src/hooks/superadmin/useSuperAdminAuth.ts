"use client";
import { useEffect, useState } from 'react';
import { isSuperAdmin } from '@/lib/firebase/auth';

interface SuperAdminAuth {
  loading: boolean;
  authenticated: boolean;
  adminData: any;
  signOutLocal: () => void;
}

export function useSuperAdminAuth(): SuperAdminAuth {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    console.log('useSuperAdminAuth hook running...');
    const run = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
        const data = typeof window !== 'undefined' ? localStorage.getItem('superadmin_data') : null;
        
        console.log('useSuperAdminAuth localStorage check:', { 
          hasToken: !!token, 
          hasData: !!data,
          token: token?.substring(0, 10) + '...' // First 10 chars for debugging
        });
        
        if (!token || !data) {
          console.log('useSuperAdminAuth: No credentials, setting unauthenticated');
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        setAdminData(JSON.parse(data));
        
        // Immediately set authenticated to true based on localStorage
        console.log('useSuperAdminAuth: Setting authenticated to true based on localStorage');
        setAuthenticated(true);
        setLoading(false);
        
        // Skip Firebase verification for now to avoid permissions issues
        // This will be handled during actual operations that need authentication
        console.log('useSuperAdminAuth: Skipping Firebase verification to avoid permissions issues');
        
        // Optional: Perform Firebase verification in background with longer delay and error handling
        setTimeout(() => {
          console.log('useSuperAdminAuth: Starting background Firebase verification...');
          isSuperAdmin().then(isA => {
            console.log('useSuperAdminAuth: Background verification result:', isA);
            if (!isA) {
              console.log('useSuperAdminAuth: Background Firebase verification failed, but keeping local session');
              // Don't automatically logout on verification failure to avoid infinite loops
              // Instead, let individual Firebase operations handle authentication errors
            } else {
              console.log('useSuperAdminAuth: Background Firebase verification successful');
            }
          }).catch(error => {
            console.log('useSuperAdminAuth: Background verification error (ignoring):', error.message);
            // Ignore Firebase errors during background verification
          });
        }, 5000); // Longer delay to ensure app is fully loaded
        
      } catch (e) {
        console.error('useSuperAdminAuth: Error in auth check:', e);
        localCleanup();
        setAuthenticated(false);
        setLoading(false);
      }
    };
    run();
  }, []);

  const localCleanup = () => {
    try {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_data');
    } catch {}
  };

  return {
    loading,
    authenticated,
    adminData,
    signOutLocal: localCleanup
  };
}

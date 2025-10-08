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
    const run = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
        const data = typeof window !== 'undefined' ? localStorage.getItem('superadmin_data') : null;
        if (!token || !data) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        setAdminData(JSON.parse(data));
        // soft verify
        isSuperAdmin().then(isA => {
          if (!isA) {
            localCleanup();
            setAuthenticated(false);
          } else {
            setAuthenticated(true);
          }
          setLoading(false);
        }).catch(() => {
          // fallback to optimistic
          setAuthenticated(true);
          setLoading(false);
        });
      } catch (e) {
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

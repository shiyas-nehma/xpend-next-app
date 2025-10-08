'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSuperAdmin } from '@/lib/firebase/auth';

export default function SuperAdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('superadmin_token');
        if (token) {
          const isAdmin = await isSuperAdmin();
          if (isAdmin) {
            router.push('/superadmin/dashboard');
          } else {
            sessionStorage.removeItem('superadmin_token');
            sessionStorage.removeItem('superadmin_data');
            router.push('/superadmin/login');
          }
        } else {
          router.push('/superadmin/login');
        }
      } catch (error) {
        router.push('/superadmin/login');
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-brand-text-primary">Redirecting...</div>
    </div>
  );
}
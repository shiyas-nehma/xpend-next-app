'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

export default function SuperAdminLogout() {
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    // Clear admin session
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_data');
    
    // Show success message
    addToast('Successfully logged out from Super Admin', 'success');
    
    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      router.push('/superadmin/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, addToast]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-white/10">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Logging Out</h2>
        <p className="text-gray-300 mb-6">Securely ending your admin session...</p>
        
        <div className="space-y-2 text-sm text-gray-400">
          <p>✓ Session cleared</p>
          <p>✓ Secure logout completed</p>
          <p>→ Redirecting to login...</p>
        </div>
      </div>
    </div>
  );
}
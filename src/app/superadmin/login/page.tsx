'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from '@/components/icons/NavIcons';
import { useToast } from '@/hooks/useToast';
import { signInSuperAdmin, createSuperAdmin } from '@/lib/firebase/auth';

const Logo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center">
      <div className="w-1 h-5 bg-black rounded-full transform -skew-x-12" />
      <div className="w-1 h-6 bg-black rounded-full transform -skew-x-12 ml-1" />
    </div>
    <div className="text-white text-lg font-bold">SuperAdmin</div>
  </div>
);

export default function SuperAdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { addToast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try to sign in with Firebase
      const { user, userData } = await signInSuperAdmin({
        email: formData.email,
        password: formData.password
      });
      
      // Store admin session with Firebase UID
      localStorage.setItem('superadmin_token', user.uid);
      localStorage.setItem('superadmin_data', JSON.stringify(userData));
      
      addToast('Successfully logged in as Super Admin', 'success');
      console.log('Superadmin login successful, redirecting to dashboard...', { uid: user.uid });
      console.log('localStorage set:', {
        token: localStorage.getItem('superadmin_token'),
        data: localStorage.getItem('superadmin_data')
      });
      
      // Use window.location.href for more reliable redirect
      console.log('Redirecting using window.location.href...');
      window.location.href = '/superadmin/dashboard';
    } catch (error: unknown) {
      let errorMessage = 'Superadmin login failed. Please try again.';
      
      // Handle Firebase auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = getAuthErrorMessage(firebaseError.code);
        
        // Only log unexpected errors
        const expectedErrors = [
          'auth/invalid-credential',
          'auth/invalid-login-credentials',
          'auth/wrong-password',
          'auth/user-not-found'
        ];
        
        if (!expectedErrors.includes(firebaseError.code)) {
          console.error('Unexpected superadmin login error:', error);
        } else {
          console.log(`Superadmin authentication failed: ${firebaseError.code}`);
        }
      } else {
        console.error('Superadmin login error:', error);
      }
      
      // If login fails and credentials are default, try to create superadmin
      if (formData.email === 'superadmin@superadmin.com' && formData.password === '123456') {
        try {
          console.log('Creating default superadmin account...');
          await createSuperAdmin({
            email: formData.email,
            password: formData.password
          });
          
          // Now try to sign in again
          const { user, userData } = await signInSuperAdmin({
            email: formData.email,
            password: formData.password
          });
          
          localStorage.setItem('superadmin_token', user.uid);
          localStorage.setItem('superadmin_data', JSON.stringify(userData));
          
          addToast('Superadmin account created and logged in successfully!', 'success');
          console.log('Superadmin created and logged in, redirecting to dashboard...', { uid: user.uid });
          console.log('localStorage set after creation:', {
            token: localStorage.getItem('superadmin_token'),
            data: localStorage.getItem('superadmin_data')
          });
          
          // Use window.location.href for more reliable redirect
          console.log('Redirecting using window.location.href after creation...');
          window.location.href = '/superadmin/dashboard';
        } catch (createError: unknown) {
          console.error('Failed to create superadmin:', createError);
          setError('Failed to create or authenticate superadmin account');
          addToast('Failed to create or authenticate superadmin account', 'error');
        }
      } else {
        setError(errorMessage);
        addToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects - Removed gradient, keeping subtle effects */}
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_80%)]"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_80%)]"></div>
      
      <div className="w-full max-w-md bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 z-10 border border-white/10">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <h2 className="text-center text-3xl font-bold text-white mb-2">Super Admin Access</h2>
        <p className="text-center text-gray-300 mb-8">Secure administrative portal</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="email">
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="superadmin@superadmin.com"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 disabled:opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="password">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter admin password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 mt-8 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Admin Portal'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Restricted access • Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { signInSuperAdmin, logout, isSuperAdmin } from '@/lib/firebase/auth';

export interface SuperAdminAuth {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useSuperAdminAuth = (): SuperAdminAuth => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is authenticated on mount
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('superadmin_token');
        if (token) {
          const isAdmin = await isSuperAdmin();
          setIsAuthenticated(isAdmin);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user, userData } = await signInSuperAdmin({ email, password });
      sessionStorage.setItem('superadmin_token', user.uid);
      sessionStorage.setItem('superadmin_data', JSON.stringify(userData));
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logoutAdmin = async () => {
    try {
      await logout();
      sessionStorage.removeItem('superadmin_token');
      sessionStorage.removeItem('superadmin_data');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout: logoutAdmin
  };
};
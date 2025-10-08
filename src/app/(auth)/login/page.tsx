'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon } from '@/components/icons/NavIcons';
import { signIn, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/useToast';

const Logo: React.FC = () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center">
        <div className="w-1 h-4 bg-black rounded-full transform -skew-x-12" />
        <div className="w-1 h-5 bg-black rounded-full transform -skew-x-12 ml-1" />
      </div>
    </div>
);

const SocialButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-surface-2 border border-brand-border rounded-lg text-brand-text-primary text-sm font-medium
                   hover:bg-brand-border transition-colors duration-200"
    >
        {icon}
        {label}
    </button>
);


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { addToast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, userData } = await signIn(formData);
      addToast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error); // Debug log
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle Firebase auth errors
      if (error.code) {
        errorMessage = getAuthErrorMessage(error.code);
      } else if (error.message) {
        // Handle custom errors from our auth functions
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      
      // Special handling for access denied cases - redirect to superadmin login
      if (error.message && error.message.includes('Access denied')) {
        addToast('Redirecting to admin portal...', 'info');
        setTimeout(() => {
          router.push('/superadmin/login');
        }, 1500); // Reduced delay for faster redirect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const { user, userData } = await signInWithGoogle();
      addToast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google login error:', error); // Debug log
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      // Handle Firebase auth errors
      if (error.code) {
        errorMessage = getAuthErrorMessage(error.code);
      } else if (error.message) {
        // Handle custom errors from our auth functions
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
      
      // Special handling for access denied cases - redirect to superadmin login
      if (error.message && error.message.includes('Access denied')) {
        addToast('Redirecting to admin portal...', 'info');
        setTimeout(() => {
          router.push('/superadmin/login');
        }, 1500); // Reduced delay for faster redirect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToSignup = () => {
    router.push('/signup');
  };

  const handleNavigateToForgotPassword = () => {
    router.push('/forgotPassword');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(93,120,255,0.2)_0%,transparent_80%)] animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[radial-gradient(circle,rgba(255,199,0,0.15)_0%,transparent_80%)] animate-[spin_20s_linear_infinite_reverse]"></div>
      
      <div className="w-full max-w-sm bg-brand-surface/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 z-10 
                   border border-transparent 
                   [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(93,120,255,0.5))_border-box]">
        <div className="flex justify-center mb-6">
            <Logo />
        </div>
        <h2 className="text-center text-3xl font-bold text-brand-text-primary mb-2">Welcome Back</h2>
        <p className="text-center text-brand-text-secondary mb-6">Sign in to continue</p>
        
        <div className="flex gap-4 mb-6">
            <SocialButton icon={<GoogleIcon />} label="Google" onClick={handleGoogleSignIn} />
            <SocialButton icon={<FacebookIcon />} label="Facebook" />
        </div>
        
        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-brand-border"></div>
            <span className="flex-shrink mx-4 text-xs text-brand-text-secondary uppercase">Or</span>
            <div className="flex-grow border-t border-brand-border"></div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                         bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)] disabled:opacity-50"
            />
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-brand-text-secondary text-sm font-medium" htmlFor="password">
                Password
                </label>
                <button
                    type="button"
                    onClick={handleNavigateToForgotPassword}
                    className="text-sm font-medium text-brand-blue hover:underline focus:outline-none"
                >
                    Forgot password?
                </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 pr-10 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                           bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300 mt-6
                      shadow-[0_0_20px_rgba(255,255,255,0.1)]
                      bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-brand-text-secondary mt-8">
            Don't have an account?{' '}
            <button
                onClick={handleNavigateToSignup}
                className="font-medium text-brand-blue hover:underline focus:outline-none"
            >
                Sign up
            </button>
        </p>
      </div>
    </div>
  );
}
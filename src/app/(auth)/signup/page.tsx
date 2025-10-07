'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon } from '@/components/icons/NavIcons';

const Logo: React.FC = () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center">
        <div className="w-1 h-4 bg-black rounded-full transform -skew-x-12" />
        <div className="w-1 h-5 bg-black rounded-full transform -skew-x-12 ml-1" />
      </div>
    </div>
);

const SocialButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <button
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-surface-2 border border-brand-border rounded-lg text-brand-text-primary text-sm font-medium
                   hover:bg-brand-border transition-colors duration-200"
    >
        {icon}
        {label}
    </button>
);


export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle signup logic here, then redirect to onboarding
    router.push('/onboarding');
  };

  const handleNavigateToLogin = () => {
    router.push('/login');
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
        <h2 className="text-center text-3xl font-bold text-brand-text-primary mb-2">Create Account</h2>
        <p className="text-center text-brand-text-secondary mb-6">Join us and take control of your finances.</p>
        
        <div className="flex gap-4 mb-6">
            <SocialButton icon={<GoogleIcon />} label="Google" />
            <SocialButton icon={<FacebookIcon />} label="Facebook" />
        </div>
        
        <div className="flex items-center my-6">
            <div className="flex-grow border-t border-brand-border"></div>
            <span className="flex-shrink mx-4 text-xs text-brand-text-secondary uppercase">Or</span>
            <div className="flex-grow border-t border-brand-border"></div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="fullName">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              placeholder="Hossein"
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                         bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                         bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 pr-10 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                           bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)]"
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
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300 mt-6
                      shadow-[0_0_20px_rgba(255,255,255,0.1)]
                      bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]"
          >
            Create Account
          </button>
        </form>
        <p className="text-center text-sm text-brand-text-secondary mt-8">
            Already have an account?{' '}
            <button
                onClick={handleNavigateToLogin}
                className="font-medium text-brand-blue hover:underline focus:outline-none"
            >
                Sign in
            </button>
        </p>
      </div>
    </div>
  );
}
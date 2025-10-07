'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon } from '@/components/icons/NavIcons';
import { signUp, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase/auth';
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

/**
 * Password Requirements Component
 * Displays real-time validation for password requirements:
 * - At least 8 characters
 * - One uppercase letter (A-Z)
 * - One number (0-9)
 * - One special character (!@#$%^&*(),.?":{}|<>)
 */
const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <div className="flex items-center gap-3 text-sm py-1">
    <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
      met 
        ? 'bg-green-500 border-green-500' 
        : 'bg-transparent border-gray-500'
    }`}>
      {met && (
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <span className={`transition-colors duration-200 ${
      met ? 'text-green-400' : 'text-brand-text-secondary'
    }`}>
      {text}
    </span>
  </div>
);

const PasswordRequirements: React.FC<{ password: string }> = ({ password }) => {
  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'One number', met: /[0-9]/.test(password) },
    { text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const allRequirementsMet = requirements.every(req => req.met);

  // Hide the requirements if all are met
  if (allRequirementsMet && password.length > 0) {
    return (
      <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30 transition-all duration-300">
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium">Password requirements met</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-brand-surface-2/50 rounded-lg border border-brand-border/50 transition-all duration-300">
      <div className="space-y-2">
        {requirements.map((req, index) => (
          <PasswordRequirement key={index} met={req.met} text={req.text} />
        ))}
      </div>
    </div>
  );
};

// Confirm Password Validation Component
const ConfirmPasswordValidation: React.FC<{ 
  password: string; 
  confirmPassword: string; 
  showValidation: boolean; 
}> = ({ password, confirmPassword, showValidation }) => {
  if (!showValidation || !confirmPassword) return null;

  const passwordsMatch = password === confirmPassword;

  return (
    <div className={`mt-3 p-3 rounded-lg border transition-all duration-300 ${
      passwordsMatch 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-red-500/10 border-red-500/30'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
          passwordsMatch 
            ? 'bg-green-500 border-green-500' 
            : 'bg-red-500 border-red-500'
        }`}>
          {passwordsMatch ? (
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className={`text-sm font-medium ${
          passwordsMatch ? 'text-green-400' : 'text-red-400'
        }`}>
          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
        </span>
      </div>
    </div>
  );
};


export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { addToast } = useToast();

  // Check if password meets all requirements
  const isPasswordValid = (password: string) => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Enhanced password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    console.log('Form submitted with data:', formData); // Debug log
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Calling signUp function...'); // Debug log
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });
      addToast('Account created successfully!', 'success');
      router.push('/onboarding');
    } catch (error: any) {
      console.error('Signup error in component:', error); // Debug log
      const errorMessage = getAuthErrorMessage(error.code) || error.message;
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      addToast('Account created successfully!', 'success');
      router.push('/onboarding');
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error.code) || error.message;
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
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
            <SocialButton icon={<GoogleIcon />} label="Google" onClick={handleGoogleSignUp} />
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
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="fullName">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                         bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)] disabled:opacity-50"
            />
          </div>
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
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
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
            {(formData.password || isPasswordFocused) && <PasswordRequirements password={formData.password} />}
          </div>
          <div className="mb-4">
            <label className="block text-brand-text-secondary text-sm font-medium mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={() => setIsConfirmPasswordFocused(false)}
                required
                disabled={loading}
                className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-3 pr-10 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-300
                           bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            <ConfirmPasswordValidation 
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              showValidation={formData.confirmPassword.length > 0 || isConfirmPasswordFocused}
            />
          </div>
          <button
            type="submit"
            disabled={loading || 
                     !formData.email || 
                     !formData.password || 
                     !formData.fullName || 
                     !formData.confirmPassword ||
                     !isPasswordValid(formData.password) ||
                     formData.password !== formData.confirmPassword}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition duration-300 mt-6
                      shadow-[0_0_20px_rgba(255,255,255,0.1)]
                      bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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
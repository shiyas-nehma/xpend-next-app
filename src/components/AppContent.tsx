// components/AppContent.tsx
'use client';

import React, { useState } from 'react';
import LoginPage from '@/app/(auth)/login/page';
import DashboardPage from '@/app/(dashboard)/dashboard/page1';
import SettingsPage from '@/app/(dashboard)/settings/page';
import Sidebar from '@/components/layout/Sidebar';
import IncomePage from '@/app/(dashboard)/income/page';
import ExpensePage from '@/app/(dashboard)/expense/page';
import CategoryPage from '@/app/(dashboard)/category/page';
import BudgetPage from '@/app/(dashboard)/budget/page';
import GoalsPage from '@/app/(dashboard)/goals/page';
import ReportPage from '@/app/(dashboard)/report/page';
import AIPage from '@/app/ai/page';
import SignupPage from '@/app/(auth)/signup/page';
import ForgotPasswordPage from '@/app/(dashboard)/report/page';
import LandingPage from '@/app/landing/page';
import BlogPage from '@/app/blog/page';
import BlogDetailsPage from '@/app/blogDetails/page';
import AccountsPage from '@/app/(dashboard)/accounts/page';
import { blogData } from '@/data/blogData';
import { useToast } from '@/hooks/useToast';
import OnboardingPage from '@/app/onboarding/page';
import { getOnboardingStatus, saveOnboardingStatus } from '@/utils/storage';
import { DataProvider } from '@/context/DataContext';
import { ToastProvider } from '@/context/ToastContext';
import Toaster from '@/components/common/Toaster';

type AuthPage = 'login' | 'signup' | 'forgotPassword';
type View = 'public' | 'app';
type PublicPage = 'landing' | 'blog' | 'blogPost';

const InlineContent: React.FC = () => {
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => getOnboardingStatus().completed);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [view, setView] = useState<View>('public');
  const [publicPage, setPublicPage] = useState<PublicPage>('landing');
  const [activePostSlug, setActivePostSlug] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleFinishOnboarding = (dontShowAgain: boolean) => {
    saveOnboardingStatus(true, !dontShowAgain);
    setOnboardingCompleted(true);
    // After onboarding, user should be inside the app and authenticated
    setView('app');
    setIsAuthenticated(true);
    setActivePage('Dashboard');
    addToast('Setup complete! Welcome to Equota.', 'success');
  };

  const handleSignupSuccess = () => {
    saveOnboardingStatus(false, true);
    setOnboardingCompleted(false);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActivePage('Dashboard');
    addToast('Welcome back!', 'success');
  };

  const handleSidebarNavigate = (page: string) => {
    if (page === 'Logout') {
      setIsAuthenticated(false);
      setAuthPage('login');
      setView('public');
      setPublicPage('landing');
      addToast('You have been logged out.', 'info');
    } else {
      setActivePage(page);
    }
  };
  
  const handleAuthNavigate = (page: AuthPage) => {
    setAuthPage(page);
  };

  const handleEnterApp = (initialAuthPage: AuthPage = 'login') => {
    setAuthPage(initialAuthPage);
    setView('app');
  };

  const handleNavigateToBlog = () => {
    setPublicPage('blog');
  };

  const handleSelectPost = (slug: string) => {
    setActivePostSlug(slug);
    setPublicPage('blogPost');
  };

  const handleBackToBlog = () => {
    setActivePostSlug(null);
    setPublicPage('blog');
  };

  const handleGoHome = () => {
    setPublicPage('landing');
  };

  if (!onboardingCompleted && getOnboardingStatus().showOnNextLogin) {
    return <OnboardingPage onFinish={handleFinishOnboarding} />;
  }

  if (view === 'public') {
    switch(publicPage) {
      case 'blog':
        return <BlogPage 
                  posts={blogData}
                  onSelectPost={handleSelectPost}
                  onNavigateHome={handleGoHome}
                  onEnterApp={handleEnterApp}
                />;
      case 'blogPost':
        const post = blogData.find(p => p.slug === activePostSlug);
        return post ? <BlogDetailsPage 
                        post={post}
                        onBackToBlog={handleBackToBlog}
                        onEnterApp={handleEnterApp}
                      /> : <LandingPage onEnterApp={handleEnterApp} onNavigateToBlog={handleNavigateToBlog} />; // Fallback
      case 'landing':
      default:
        return <LandingPage onEnterApp={handleEnterApp} onNavigateToBlog={handleNavigateToBlog} />;
    }
  }
  
  if (!isAuthenticated) {
    switch(authPage) {
        case 'signup':
            return <SignupPage onNavigate={handleAuthNavigate} onSignupSuccess={handleSignupSuccess} />;
        case 'forgotPassword':
            return <ForgotPasswordPage onNavigate={handleAuthNavigate} />;
        case 'login':
        default:
            return <LoginPage onLogin={handleLogin} onNavigate={handleAuthNavigate} />;
    }
  }

  return (
    <DataProvider>
        <div className="flex h-screen bg-brand-bg text-brand-text-primary font-sans">
        <Sidebar activePage={activePage} onNavigate={handleSidebarNavigate} />
        <main className="flex-1 overflow-y-auto relative min-w-0">
            {activePage === 'dashboard' && <DashboardPage />}
            {activePage === 'ai' && <AIPage />}
            {activePage === 'accounts' && <AccountsPage />}
            {activePage === 'income' && <IncomePage />}
            {activePage === 'expense' && <ExpensePage />}
            {activePage === 'category' && <CategoryPage />}
            {activePage === 'budget' && <BudgetPage />}
            {activePage === 'goals' && <GoalsPage />}
            {activePage === 'report' && <ReportPage />}
            {activePage === 'settings' && <SettingsPage />}
        </main>
        </div>
    </DataProvider>
  );
};


const AppContent: React.FC = () => {
  return (
    <ToastProvider>
      <InlineContent />
      <Toaster />
    </ToastProvider>
  );
};

export default AppContent;


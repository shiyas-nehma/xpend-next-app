'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSettings from '@/components/settings/ProfileSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import BillingSettings from '@/components/settings/BillingSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';

const TABS = {
  PROFILE: 'Profile',
  BILLING: 'Billing & Plans',
  NOTIFICATIONS: 'Notifications',
  SECURITY: 'Security',
};

interface SettingsPageProps {
  initialTab?: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ initialTab }) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab || TABS.PROFILE);
  const [stripeSuccess, setStripeSuccess] = useState(false);

  // Handle Stripe success redirect
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    
    if (sessionId && success === 'true') {
      console.log('Stripe checkout success detected:', sessionId);
      setStripeSuccess(true);
      setActiveTab(TABS.BILLING); // Switch to billing tab
      
      // Clear URL parameters after handling
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      // Show success message temporarily
      setTimeout(() => {
        setStripeSuccess(false);
      }, 5000);
    }
  }, [searchParams]);

  // Update active tab when initialTab prop changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const renderContent = () => {
    switch (activeTab) {
      case TABS.PROFILE:
        return <ProfileSettings />;
      case TABS.BILLING:
        return <BillingSettings />;
      case TABS.NOTIFICATIONS:
        return <NotificationSettings />;
      case TABS.SECURITY:
        return <SecuritySettings />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ label: string }> = ({ label }) => (
    <button
      onClick={() => setActiveTab(label)}
      className={`px-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 relative
                  ${activeTab === label
                    ? 'text-brand-text-primary border-brand-blue'
                    : 'text-brand-text-secondary border-transparent hover:text-brand-text-primary'
                  }`}
    >
      {label}
      {activeTab === label && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-brand-text-primary mb-6">Settings</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-brand-border mb-8">
              {Object.values(TABS).map((tab) => (
                <TabButton key={tab} label={tab} />
              ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
                {renderContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
    </div>
  );
};

export default SettingsPage;
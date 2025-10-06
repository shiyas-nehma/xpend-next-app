'use client';

import React, { useState } from 'react';
import ProfileSettings from '../../components/settings/ProfileSettings';
import NotificationSettings from '../../components/settings/NotificationSettings';
import BillingSettings from '../../components/settings/BillingSettings';
import SecuritySettings from '../../components/settings/SecuritySettings';

const TABS = {
  PROFILE: 'Profile',
  BILLING: 'Billing & Plans',
  NOTIFICATIONS: 'Notifications',
  SECURITY: 'Security',
};

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);

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
      className={`px-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2
                  ${activeTab === label
                    ? 'text-brand-text-primary border-brand-blue'
                    : 'text-brand-text-secondary border-transparent hover:text-brand-text-primary'
                  }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-8">
        <h1 className="text-2xl font-bold text-brand-text-primary mb-6">Settings</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-8 border-b border-brand-border mb-8">
            <TabButton label={TABS.PROFILE} />
            <TabButton label={TABS.BILLING} />
            <TabButton label={TABS.NOTIFICATIONS} />
            <TabButton label={TABS.SECURITY} />
        </div>

        {/* Tab Content */}
        <div>
            {renderContent()}
        </div>
    </div>
  );
};

export default SettingsPage;
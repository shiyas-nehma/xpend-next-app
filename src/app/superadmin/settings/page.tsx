"use client";
import React, { useState } from 'react';
import SurfaceCard from '@/components/superadmin/common/SurfaceCard';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    appName: 'Xpend App',
    appDescription: 'Personal Finance Management Platform',
    contactEmail: 'admin@xpendapp.com',
    supportEmail: 'support@xpendapp.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxUsersPerPlan: {
      basic: 5,
      pro: 20,
      enterprise: 100
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false
    },
    security: {
      enforceStrongPasswords: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5
    }
  });

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => {
      const sectionValue: any = (prev as any)[section] || {};
      return {
        ...prev,
        [section]: {
          ...sectionValue,
          [key]: value
        }
      };
    });
  };

  const handleSimpleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Here you would typically send the settings to your backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-brand-text-secondary text-sm mt-1">Manage application settings and configurations</p>
        </div>
        <button
          onClick={saveSettings}
          className="h-10 px-5 rounded-lg bg-brand-blue text-white text-sm font-medium hover:brightness-110 transition"
        >Save Changes</button>
      </div>
      <SurfaceCard className="p-0 overflow-hidden">
        <div className="border-b border-brand-border/60 px-4">
          <nav className="flex gap-4 overflow-x-auto scrollbar-none">
            {[
              { id: 'general', label: 'General' },
              { id: 'users', label: 'User Management' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'security', label: 'Security' },
              { id: 'system', label: 'System' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 text-xs font-medium tracking-wide uppercase transition-colors ${activeTab === tab.id ? 'text-white' : 'text-brand-text-secondary hover:text-white'}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute left-0 -bottom-px h-[2px] w-full bg-brand-blue rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 space-y-8">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">
                  Application Name
                </label>
                <input
                  type="text"
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  value={settings.appName}
                  onChange={(e) => handleSimpleSettingChange('appName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  value={settings.contactEmail}
                  onChange={(e) => handleSimpleSettingChange('contactEmail', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">
                  Application Description
                </label>
                <textarea
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  rows={3}
                  value={settings.appDescription}
                  onChange={(e) => handleSimpleSettingChange('appDescription', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">
                  Support Email
                </label>
                <input
                  type="email"
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                  value={settings.supportEmail}
                  onChange={(e) => handleSimpleSettingChange('supportEmail', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">User Management</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Allow New Registrations</h4>
                  <p className="text-xs text-brand-text-secondary">Enable or disable new user registrations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.allowNewRegistrations}
                    onChange={(e) => handleSimpleSettingChange('allowNewRegistrations', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Require Email Verification</h4>
                  <p className="text-xs text-brand-text-secondary">Force users to verify their email before accessing the app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => handleSimpleSettingChange('requireEmailVerification', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <h4 className="font-medium text-white mb-4">Max Users Per Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">Basic Plan</label>
                    <input
                      type="number"
                      className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm"
                      value={settings.maxUsersPerPlan.basic}
                      onChange={(e) => handleSettingChange('maxUsersPerPlan', 'basic', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">Pro Plan</label>
                    <input
                      type="number"
                      className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm"
                      value={settings.maxUsersPerPlan.pro}
                      onChange={(e) => handleSettingChange('maxUsersPerPlan', 'pro', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">Enterprise Plan</label>
                    <input
                      type="number"
                      className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm"
                      value={settings.maxUsersPerPlan.enterprise}
                      onChange={(e) => handleSettingChange('maxUsersPerPlan', 'enterprise', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Email Notifications</h4>
                  <p className="text-xs text-brand-text-secondary">Send notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Push Notifications</h4>
                  <p className="text-xs text-brand-text-secondary">Send push notifications to mobile devices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">SMS Notifications</h4>
                  <p className="text-xs text-brand-text-secondary">Send notifications via SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications.smsNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Security Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Enforce Strong Passwords</h4>
                  <p className="text-xs text-brand-text-secondary">Require users to use strong passwords</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.security.enforceStrongPasswords}
                    onChange={(e) => handleSettingChange('security', 'enforceStrongPasswords', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1 uppercase tracking-wide">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-sm"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">System Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Maintenance Mode</h4>
                  <p className="text-xs text-brand-text-secondary">Put the application in maintenance mode</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSimpleSettingChange('maintenanceMode', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <div>
                    <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Warning</h3>
                    <p className="mt-1 text-xs text-amber-200/80">Enabling maintenance mode will prevent all users from accessing the application.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-surface-2 rounded-lg p-4 border border-brand-border">
                  <h4 className="font-medium text-white mb-2">System Information</h4>
                  <div className="space-y-1 text-xs text-brand-text-secondary">
                    <div>Version: 1.0.0</div>
                    <div>Environment: Production</div>
                    <div>Database: Connected</div>
                    <div>Cache: Active</div>
                  </div>
                </div>
                <div className="bg-brand-surface-2 rounded-lg p-4 border border-brand-border">
                  <h4 className="font-medium text-white mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-xs rounded bg-brand-surface hover:bg-brand-surface/70 border border-brand-border text-brand-text-secondary hover:text-white transition">Clear Cache</button>
                    <button className="w-full text-left px-3 py-2 text-xs rounded bg-brand-surface hover:bg-brand-surface/70 border border-brand-border text-brand-text-secondary hover:text-white transition">Run Backup</button>
                    <button className="w-full text-left px-3 py-2 text-xs rounded bg-brand-surface hover:bg-brand-surface/70 border border-brand-border text-brand-text-secondary hover:text-white transition">Export Logs</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </SurfaceCard>
    </div>
  );
};

export default SettingsPage;
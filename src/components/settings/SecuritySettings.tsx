import React from 'react';
import SettingsCard from './SettingsCard';
import ToggleSwitch from '../common/ToggleSwitch';

const SecuritySettings: React.FC = () => {
    return (
        <SettingsCard
            title="Security"
            footer={
                <button className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors
                               shadow-[0_0_10px_rgba(255,255,255,0.1)]
                               bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                    Update Password
                </button>
            }
        >
            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" placeholder="••••••••" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="newPassword">New Password</label>
                <input type="password" id="newPassword" placeholder="••••••••" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
            <div>
                <label className="block text-brand-text-secondary text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" placeholder="••••••••" className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue" />
            </div>
             <div className="pt-4 border-t border-brand-border">
                <ToggleSwitch
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account."
                    initialChecked={false}
                />
            </div>
        </SettingsCard>
    );
};

export default SecuritySettings;

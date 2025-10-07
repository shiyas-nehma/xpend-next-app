import React from 'react';
import SettingsCard from './SettingsCard';
import ToggleSwitch from '@/components/common/ToggleSwitch';

const NotificationSettings: React.FC = () => {
    return (
        <SettingsCard title="Notifications">
            <ToggleSwitch 
                label="Campaign Updates"
                description="Get notified about status changes in your campaigns."
                initialChecked={true}
            />
             <ToggleSwitch 
                label="New Follower Alerts"
                description="Receive an alert when someone follows your campaign."
                initialChecked={true}
            />
             <ToggleSwitch 
                label="Weekly Summary"
                description="A weekly digest of your campaign performance."
            />
             <ToggleSwitch 
                label="System Notifications"
                description="Important updates about your account and platform changes."
                initialChecked={true}
            />
        </SettingsCard>
    );
};

export default NotificationSettings;

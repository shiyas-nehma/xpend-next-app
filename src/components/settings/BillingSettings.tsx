import React from 'react';
import SettingsCard from './SettingsCard';
import { CreditCardIcon } from '../icons/NavIcons';

const BillingSettings: React.FC = () => {
    return (
        <SettingsCard 
            title="Billing & Plans"
            footer={
                <>
                    <button className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors">
                        Change Plan
                    </button>
                </>
            }
        >
           <div className="bg-brand-surface-2 border border-brand-border rounded-xl p-4">
                <p className="text-sm text-brand-text-secondary">Current Plan</p>
                <p className="text-lg font-semibold text-brand-text-primary">Premium Plan</p>
                <p className="text-sm text-brand-text-secondary mt-2">Renews on <span className="text-brand-text-primary font-medium">July 8, 2025</span></p>
           </div>
           
           <div>
                <h4 className="font-medium text-brand-text-primary mb-2">Payment Method</h4>
                <div className="flex items-center justify-between bg-brand-surface-2 border border-brand-border rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                        <CreditCardIcon className="w-8 h-8 text-brand-text-secondary" />
                        <div>
                            <p className="font-medium text-brand-text-primary">Visa ending in 1234</p>
                            <p className="text-sm text-brand-text-secondary">Expires 06/2028</p>
                        </div>
                    </div>
                    <button className="text-sm font-medium text-brand-blue hover:underline">Update</button>
                </div>
           </div>
        </SettingsCard>
    );
};

export default BillingSettings;

import React from 'react';
import { ChevronDownIcon } from '../icons/NavIcons';

const CardBase: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50
                   ${className}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10">
            {children}
        </div>
    </div>
);


const MyCampaignsCard: React.FC = () => {
    return (
        <CardBase>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold">My Campaigns</h3>
                    <p className="text-sm text-brand-text-secondary">3 persons and @yerimaldo have access.</p>
                </div>
                <button className="flex items-center space-x-2 text-sm text-brand-text-secondary bg-brand-surface-2 border border-brand-border px-3 py-1.5 rounded-lg hover:border-white/20 transition-colors">
                    <span>Finance</span>
                    <ChevronDownIcon className="w-4 h-4"/>
                </button>
            </div>
        </CardBase>
    );
};

export default MyCampaignsCard;
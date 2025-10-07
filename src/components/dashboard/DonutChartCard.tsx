import React from 'react';
import { LightningBoltIcon, ArrowRightIcon } from '@/components/icons/NavIcons';

const PremiumCard: React.FC = () => {
  return (
    <div className={`bg-brand-surface rounded-2xl p-6 relative h-full flex flex-col justify-between overflow-hidden
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
        
        <div className="absolute top-0 right-0 h-full w-3/4 bg-[radial-gradient(ellipse_at_right,_rgba(255,199,0,0.15)_0%,_transparent_70%)] -z-0"></div>

        <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
                <LightningBoltIcon className="w-5 h-5 text-brand-yellow" />
                <h3 className="font-semibold text-white">Let's Go Premium</h3>
                <span className="bg-brand-yellow/30 text-brand-yellow text-xs font-bold px-2 py-1 rounded-md">40%</span>
            </div>
            <p className="text-sm text-brand-text-secondary mb-3">
                This is your amazing chance! Our premium subscription elevate your experience and unlock a range of benefits tailored to your preferences.
            </p>
            <button className="text-sm font-semibold text-white flex items-center space-x-2 hover:text-brand-yellow transition-colors">
                <span>Learn more</span>
                <ArrowRightIcon className="w-4 h-4" />
            </button>
        </div>
        <div className="relative z-10 flex items-center justify-between mt-6">
            <button className="text-sm text-brand-text-secondary hover:text-white transition-colors">
                Don't show again
            </button>
            <button className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors
                               shadow-[0_0_20px_rgba(255,255,255,0.1)]
                               bg-[linear-gradient(to_bottom,rgba(255,255,255,1),rgba(230,230,230,1))]">
                Get started
            </button>
        </div>
    </div>
  );
};

export default PremiumCard;
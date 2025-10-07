import React from 'react';
import { ArrowRightIcon } from '@/components/icons/NavIcons';

const CardBase: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50
                   ${className}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10 h-full flex flex-col">
            {children}
        </div>
    </div>
);


const AdsCard: React.FC = () => {
  return (
    <CardBase className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Ads</h3>
        <button className="text-sm text-brand-text-secondary flex items-center space-x-1 hover:text-white transition-colors">
          <span>Next</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="text-center text-brand-text-secondary text-sm mb-4">
        <p>Powered by Carbox</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {/* Placeholder for Ad content */}
      </div>
      <button className="w-full bg-brand-surface-2 border border-brand-border text-sm font-medium py-2.5 rounded-lg hover:bg-brand-border transition-colors">
          Just for today!
      </button>
    </CardBase>
  );
};

export default AdsCard;
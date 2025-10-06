import React from 'react';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative
                   border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-xl font-bold text-brand-text-primary mb-6">{title}</h3>
            <div className="flex-grow space-y-4">
                {children}
            </div>
            {footer && (
                <div className="mt-6 pt-4 border-t border-brand-border flex justify-end space-x-3">
                    {footer}
                </div>
            )}
        </div>
    </div>
);

export default SettingsCard;
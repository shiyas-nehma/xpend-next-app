'use client';

import React from 'react';

const ReportCard: React.FC<{ title: string; children: React.ReactNode; className?: string, headerControls?: React.ReactNode }> = ({ title, children, className, headerControls }) => (
    <div className={`bg-brand-surface rounded-2xl p-6 relative border border-brand-border 
                   bg-clip-padding 
                   before:content-[''] before:absolute before:inset-0 before:z-[-1] before:rounded-2xl
                   before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50
                   ${className}`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]"></div>
        <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-text-primary">{title}</h3>
                {headerControls && <div>{headerControls}</div>}
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    </div>
);

export default ReportCard;

import React from 'react';

const EmptyStateIcon: React.FC = () => (
    <div className="w-16 h-16 bg-brand-surface-2 rounded-xl flex items-center justify-center border border-brand-border">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary">
            <path d="M7 3H17C19.7614 3 22 5.23858 22 8V16C22 18.7614 19.7614 21 17 21H7C4.23858 21 2 18.7614 2 16V8C2 5.23858 4.23858 3 7 3Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7.5 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    </div>
);

export default EmptyStateIcon;

import React from 'react';

export const WalletIcon: React.FC = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-blue">
        <path d="M4 8V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8C4 5.79086 5.79086 4 8 4H18C19.1046 4 20 4.89543 20 6V8H4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 10C19.1046 10 20 9.10457 20 8H16C16 9.10457 16.8954 10 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const GoalIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-blue">
        <path d="M12 21C15.5 17.5 19 14.15 19 9.5C19 5.91 15.866 3 12 3C8.13401 3 5 5.91 5 9.5C5 14.15 8.5 17.5 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
);

export const AIIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-yellow">
        <path d="M12 2.75L13.75 8.25L19.25 10L13.75 11.75L12 17.25L10.25 11.75L4.75 10L10.25 8.25L12 2.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 13L18.6667 15L20 15.3333L18.6667 15.6667L18 17L17.3333 15.6667L16 15.3333L17.3333 15L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const PlusIcon: React.FC = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

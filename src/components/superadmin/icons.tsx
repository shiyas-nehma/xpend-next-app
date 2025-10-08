import React from 'react';

// Consistent stroke style for all outline icons
const base = {
  stroke: 'currentColor',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DashboardIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="4.5" rx="1.5" />
    <rect x="14" y="10" width="7" height="11" rx="1.5" />
    <rect x="3" y="13" width="7" height="8" rx="1.5" />
  </svg>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M16.5 7.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0Z" />
    <path d="M4 19.25c0-3.25 3.25-5.25 7.5-5.25s7.5 2 7.5 5.25" />
    <path d="M6.5 7.75a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0Z" opacity=".5" />
  </svg>
);

export const PlansIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7.5l8-4.5 8 4.5" />
    <path d="M4 12l8 4.5 8-4.5" />
    <path d="M4 16.5L12 21l8-4.5" opacity=".6" />
    <path d="M4 7.5v9" opacity=".4" />
    <path d="M20 7.5v9" opacity=".4" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M19.4 15a1 1 0 00.2 1.09l.06.06a1 1 0 01-1.42 1.42l-.06-.06a1 1 0 00-1.09-.2 1 1 0 00-.61.73l-.02.08a1 1 0 01-.98.78H9.52a1 1 0 01-.98-.78l-.02-.08a1 1 0 00-.61-.73 1 1 0 00-1.09.2l-.06.06a1 1 0 11-1.42-1.42l.06-.06a1 1 0 00.2-1.09 1 1 0 00-.73-.61l-.08-.02a1 1 0 01-.78-.98V9.52a1 1 0 01.78-.98l.08-.02a1 1 0 00.73-.61 1 1 0 00-.2-1.09l-.06-.06a1 1 0 011.42-1.42l.06.06a1 1 0 001.09.2 1 1 0 00.61-.73l.02-.08A1 1 0 019.52 4h4.96a1 1 0 01.98.78l.02.08a1 1 0 00.61.73 1 1 0 001.09-.2l.06-.06a1 1 0 011.42 1.42l-.06.06a1 1 0 00-.2 1.09 1 1 0 00.73.61l.08.02a1 1 0 01.78.98v4.96a1 1 0 01-.78.98l-.08.02a1 1 0 00-.73.61z" />
  </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M14.5 16l3.5-4-3.5-4" />
    <path d="M11 12h7" />
    <path d="M5 4h6a2 2 0 012 2v2" opacity=".5" />
    <path d="M13 16v2a2 2 0 01-2 2H5" opacity=".5" />
  </svg>
);

export const BillingIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
    <path d="M3.5 9h17" />
    <path d="M9 13h2.5" />
    <path d="M9 16h5.5" />
  </svg>
);

export const AnalyticsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 19h16" />
    <path d="M7 16v-6" />
    <path d="M12 16V8" />
    <path d="M17 16v-3" />
    <path d="M7 10l5-2 5 4 2-7" />
  </svg>
);

export const ShieldIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 21c5.5-2 8-5.5 8-10.5V6.8a1 1 0 00-.64-.93l-6.7-2.68a2 2 0 00-1.32 0L4.64 5.87A1 1 0 004 6.8v3.7C4 15.5 6.5 19 12 21z" />
    <path d="M9.5 12.5l2 2 4-4" />
  </svg>
);

export const GearIcon = SettingsIcon;

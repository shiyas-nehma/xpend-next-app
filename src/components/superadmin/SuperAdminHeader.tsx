"use client";
import React from 'react';

interface SuperAdminHeaderProps {
  onMenuToggle: () => void;
}

const MenuIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-brand-bg/70 bg-brand-bg/90 border-b border-brand-border">
      <div className="h-14 px-4 md:px-6 flex items-center gap-4">
        <div className="lg:hidden">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md bg-brand-surface-2 hover:bg-brand-surface transition-colors text-brand-text-secondary hover:text-white"
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-surface-2 flex items-center justify-center">
              <div className="w-1 h-3 bg-brand-blue rounded-sm -skew-x-12" />
              <div className="w-1 h-4 bg-brand-blue rounded-sm -skew-x-12 ml-0.5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-brand-text-secondary">ADMIN</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center bg-brand-surface-2 border border-brand-border rounded-lg px-2 py-1.5 text-sm text-brand-text-secondary w-56">
            <span className="text-xs opacity-60">Search ( / )</span>
          </div>
          <button className="h-9 px-3 rounded-lg bg-brand-surface-2 border border-brand-border text-xs font-medium text-brand-text-secondary hover:text-white hover:bg-brand-surface transition-colors">Quick Action</button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-surface-2 to-brand-surface flex items-center justify-center text-xs font-medium border border-brand-border">SA</div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
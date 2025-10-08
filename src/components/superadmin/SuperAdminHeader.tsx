'use client';

import React from 'react';

interface SuperAdminHeaderProps {
  onMenuToggle: () => void;
}

const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="bg-white border-b border-gray-200 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <div className="w-1 h-3 bg-white rounded-full transform -skew-x-12" />
              <div className="w-1 h-4 bg-white rounded-full transform -skew-x-12 ml-1" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
'use client';

import React from 'react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-brand-bg">
      {children}
    </div>
  );
};

export default SuperAdminLayout;
"use client";
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '@/components/superadmin/SuperAdminHeader';
import { useActiveNav } from '@/components/superadmin/navigation/sidebarConfig';
import { usePathname } from 'next/navigation';

interface AdminShellContextValue {
  setPageTitle: (t: string) => void;
  pageTitle: string;
}

const AdminShellContext = createContext<AdminShellContextValue | undefined>(undefined);
export const useAdminShell = () => {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error('useAdminShell must be used within AdminShell');
  return ctx;
};

interface AdminShellProps {
  children: React.ReactNode;
  initialTitle?: string;
}

const AdminShell: React.FC<AdminShellProps> = ({ children, initialTitle = 'Overview' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState(initialTitle);
  const nav = useActiveNav();
  const pathname = usePathname();

  // Derive and set document <title> + internal page title when route changes
  useEffect(() => {
    if (!pathname) return;
    // Find active nav item label
    const active = nav.find(item => item.href === pathname) || nav.find(item => pathname.startsWith(item.href));
    let derived = active?.label;
    if (!derived) {
      const last = pathname.split('/').filter(Boolean).pop() || 'dashboard';
      derived = last
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    // Update context title if different
    if (derived && derived !== pageTitle) setPageTitle(derived);
    // Set browser tab title
    document.title = `Super Admin • ${derived}`;
  }, [pathname, nav, pageTitle]);

  const value = useMemo(() => ({ pageTitle, setPageTitle }), [pageTitle]);

  return (
    <AdminShellContext.Provider value={value}>
      <div className="min-h-screen flex bg-brand-bg text-brand-text-primary">
        <SuperAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navItems={nav} />
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          <SuperAdminHeader onMenuToggle={() => setSidebarOpen(o => !o)} />
          <main className="flex-1 px-5 md:px-8 py-6 space-y-8">{children}</main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
};

export default AdminShell;

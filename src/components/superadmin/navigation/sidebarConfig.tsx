import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardIcon, UsersIcon, PlansIcon, SettingsIcon } from '../icons';

export interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  badge?: string | number;
  section?: string; // grouping label
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: <DashboardIcon /> },
  { label: 'Subscribed Users', href: '/superadmin/subscribed-users', icon: <UsersIcon /> },
  { label: 'Subscription Plans', href: '/superadmin/subscription', icon: <PlansIcon /> },
  { label: 'Settings', href: '/superadmin/settings', icon: <SettingsIcon /> },
];

export const useActiveNav = () => {
  const pathname = usePathname();
  return navItems.map(n => ({ ...n, active: pathname === n.href }));
};

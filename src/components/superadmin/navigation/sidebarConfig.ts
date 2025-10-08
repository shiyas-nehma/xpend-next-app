import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  badge?: string | number;
  section?: string; // grouping label
}

// Simple icon stubs (replace with real icon set later)
const Icon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
};

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: <Icon /> },
  { label: 'Subscribed Users', href: '/superadmin/subscribed-users', icon: <Icon /> },
  { label: 'Subscription Plans', href: '/superadmin/subscription', icon: <Icon /> },
  { label: 'Settings', href: '/superadmin/settings', icon: <Icon /> },
];

export const useActiveNav = () => {
  const pathname = usePathname();
  return navItems.map(n => ({ ...n, active: pathname === n.href }));
};

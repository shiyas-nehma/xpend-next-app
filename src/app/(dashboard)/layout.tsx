//  <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />

'use client'
import '@/app/globals.css'
import { ToastProvider } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { logout } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/useToast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
      const router = useRouter();
      const { showToast } = useToast();
    
      const handleNavigation = async (page: string) => {
        if (page === 'Logout') {
          try {
            await logout();
            showToast('Logged out successfully', 'success');
            router.push('/login');
          } catch (error) {
            showToast('Failed to logout', 'error');
          }
          return;
        }

        const pageRoutes: { [key: string]: string } = {
          'Dashboard': '/dashboard',
          'AI': '/all',
          'Accounts': '/accounts',
          'Income': '/income',
          'Expense': '/expense',
          'Category': '/category',
          'Budget': '/budget',
          'Goals': '/goals',
          'Report': '/report',
          'Settings': '/settings'
        };
        
        const route = pageRoutes[page];
        if (route) {
          router.push(route);
        }
      };
      
  return (
    <ProtectedRoute>
      <main> 
        <div className="flex h-screen bg-brand-background">
          <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
//  <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />

'use client'
import '@/app/globals.css'
import { ToastProvider } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import MobileNavigation from '@/components/layout/MobileNavigation'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { logout } from '@/lib/firebase/auth'
import { useToast } from '@/hooks/useToast'
import { useActivePage } from '@/hooks/useActivePage'
import { useState } from 'react'
 import { useRouter } from 'next/navigation';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
      const router = useRouter();
      const { addToast } = useToast();
      const activePage = useActivePage();
      const [isLoggingOut, setIsLoggingOut] = useState(false);
    
      const handleNavigation = async (page: string) => {
        if (page === 'Logout') {
          const confirmed = window.confirm('Are you sure you want to logout?');
          if (!confirmed) return;
          
          setIsLoggingOut(true);
          try {
            await logout();
            addToast('Logged out successfully', 'success');
            router.push('/login');
          } catch (error) {
            addToast('Failed to logout', 'error');
          } finally {
            setIsLoggingOut(false);
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
            <Sidebar activePage={activePage} onNavigate={handleNavigation} isLoggingOut={isLoggingOut} />
            <div id="app-scroll" className="flex-1 md:ml-20 overflow-y-auto pb-16 md:pb-0">
              {children}
            </div>
            <MobileNavigation activePage={activePage} onNavigate={handleNavigation} />
          </div>
        </main>
    </ProtectedRoute>
  )
}
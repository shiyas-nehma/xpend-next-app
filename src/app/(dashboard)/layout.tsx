//  <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />

'use client'
import '@/app/globals.css'
import { ToastProvider } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import MobileNavigation from '@/components/layout/MobileNavigation'
 import { useRouter } from 'next/navigation';
import { useActivePage } from '@/hooks/useActivePage';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
      const router = useRouter();
      const activePage = useActivePage();
    
      const handleNavigation = (page: string) => {
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
          'Settings': '/settings',
          'Logout': '/login'
        };
        
        const route = pageRoutes[page];
        if (route) {
          router.push(route);
        }
      };
  return (

      <main> 
        <div className="flex h-screen bg-brand-background">
      <Sidebar activePage={activePage} onNavigate={handleNavigation} />
      <div className="flex-1 md:ml-20 overflow-y-auto pb-16 md:pb-0">
            {children}
            </div>
            <MobileNavigation activePage={activePage} onNavigate={handleNavigation} />
            </div>
      </main>

  )
}
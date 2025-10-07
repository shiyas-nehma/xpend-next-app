//  <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />

'use client'
import '@/app/globals.css'
import { ToastProvider } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
 import { useRouter } from 'next/navigation';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
      const router = useRouter();
    
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
      <Sidebar activePage="Dashboard" onNavigate={handleNavigation} />
      <div className="w-full">
            {children}
            </div>
            </div>
      </main>

  )
}
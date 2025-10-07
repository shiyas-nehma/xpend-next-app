import './globals.css'
import { DataProvider } from '../context/DataContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import Toaster from '../components/common/Toaster'
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <ToastProvider>
            <DataProvider>
              {children}
            </DataProvider>
            <Toaster />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
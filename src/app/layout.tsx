import './globals.css'
import { DataProvider } from '../context/DataContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import { CurrencyProvider } from '../context/CurrencyContext'
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
            <CurrencyProvider>
              <DataProvider>
                {children}
              </DataProvider>
              <Toaster />
            </CurrencyProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
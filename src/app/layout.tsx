import './globals.css'
import { DataProvider } from '../context/DataContext'
import { ToastProvider } from '../context/ToastContext'
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DataProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DataProvider>
      </body>
    </html>
  )
}
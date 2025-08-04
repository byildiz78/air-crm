import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import '@/app/globals.css'
import ErrorBoundary from '@/components/mobile/ui/ErrorBoundary'
import { SuspenseFallback } from '@/components/mobile/ui/LoadingSpinner'
import { GlobalErrorHandler } from '@/components/mobile/ui/GlobalErrorHandler'
import { ToastProvider } from '@/components/mobile/ui/Toast'
import { AccessibilityProvider, SkipLink } from '@/components/mobile/ui/AccessibilityProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Air CRM - Sadakat Programı',
  description: 'Sadakat puanlarınızı takip edin, kampanyalardan haberdar olun',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Air CRM',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Air CRM',
    title: 'Air CRM - Sadakat Programı',
    description: 'Sadakat puanlarınızı takip edin, kampanyalardan haberdar olun',
  },
  twitter: {
    card: 'summary',
    title: 'Air CRM - Sadakat Programı',
    description: 'Sadakat puanlarınızı takip edin, kampanyalardan haberdar olun',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen antialiased`}>
      <SkipLink />
      <GlobalErrorHandler>
        <AccessibilityProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Suspense fallback={<SuspenseFallback />}>
                <div className="mobile-app" style={{
                  fontFamily: 'var(--font-family, Inter, system-ui, sans-serif)',
                  isolation: 'isolate',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <main id="main-content">
                    {children}
                  </main>
                </div>
              </Suspense>
            </ErrorBoundary>
          </ToastProvider>
        </AccessibilityProvider>
      </GlobalErrorHandler>
    </div>
  )
}
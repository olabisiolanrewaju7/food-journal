import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Providers from '@/components/Providers'
import TabShell from '@/components/TabShell'

// Force all pages to be server-rendered dynamically — required for NextAuth
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FoodJournal',
  description: 'AI-powered food tracking and nutrition analysis',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: '/icon-180.png', sizes: '180x180' },
      { url: '/icon-167.png', sizes: '167x167' },
      { url: '/icon-152.png', sizes: '152x152' },
      { url: '/icon-120.png', sizes: '120x120' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FoodJournal',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`} style={{ background: '#c8e6c9', color: '#1a1a1a' }}>
        <Providers>
          <div className="max-w-md mx-auto pb-24">
            <TabShell>{children}</TabShell>
          </div>
          <Suspense><BottomNav /></Suspense>
        </Providers>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Providers from '@/components/Providers'

// Force all pages to be server-rendered dynamically — required for NextAuth
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FoodJournal',
  description: 'AI-powered food tracking and nutrition analysis',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`} style={{ background: '#c8e6c9', color: '#1a1a1a' }}>
        <Providers>
          <div className="max-w-md mx-auto pb-24">
            {children}
          </div>
          <Suspense><BottomNav /></Suspense>
        </Providers>
      </body>
    </html>
  )
}

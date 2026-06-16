import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FoodJournal',
  description: 'AI-powered food tracking and nutrition analysis',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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

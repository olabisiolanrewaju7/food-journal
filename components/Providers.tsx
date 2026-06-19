'use client'

import { SessionProvider } from 'next-auth/react'
import { NavProvider } from '@/lib/NavContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavProvider>{children}</NavProvider>
    </SessionProvider>
  )
}

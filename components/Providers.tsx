'use client'

import { SessionProvider } from 'next-auth/react'
import { NavProvider } from '@/lib/NavContext'
import { TabProvider } from '@/lib/TabContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TabProvider>
        <NavProvider>{children}</NavProvider>
      </TabProvider>
    </SessionProvider>
  )
}

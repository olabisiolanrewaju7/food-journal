'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export type TabPath = '/' | '/history' | '/cravings' | '/coach' | '/settings'
export const TAB_PATHS: TabPath[] = ['/', '/history', '/cravings', '/coach', '/settings']

function toTab(pathname: string): TabPath {
  if (TAB_PATHS.includes(pathname as TabPath)) return pathname as TabPath
  for (const tab of TAB_PATHS) {
    if (tab !== '/' && pathname.startsWith(tab)) return tab
  }
  return '/'
}

const TabContext = createContext<{
  activeTab: TabPath
  mountedTabs: TabPath[]
  switchTab: (path: TabPath) => void
}>({ activeTab: '/', mountedTabs: ['/'], switchTab: () => {} })

export function TabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const initialTab = toTab(pathname)
  const [activeTab, setActiveTab] = useState<TabPath>(initialTab)
  const [mountedTabs, setMountedTabs] = useState<TabPath[]>([initialTab])

  // Sync when Next.js router completes a navigation (e.g. back button, direct URL)
  useEffect(() => {
    const tab = toTab(pathname)
    setActiveTab(tab)
    setMountedTabs(prev => prev.includes(tab) ? prev : [...prev, tab])
  }, [pathname])

  const switchTab = useCallback((path: TabPath) => {
    setActiveTab(path)
    setMountedTabs(prev => prev.includes(path) ? prev : [...prev, path])
    // Push to keep URL and browser history in sync, but UI switches instantly
    router.push(path)
  }, [router])

  return (
    <TabContext.Provider value={{ activeTab, mountedTabs, switchTab }}>
      {children}
    </TabContext.Provider>
  )
}

export const useTab = () => useContext(TabContext)

'use client'

import { usePathname } from 'next/navigation'
import { useTab, TAB_PATHS } from '@/lib/TabContext'
import HomePage from '@/app/page'
import HistoryPage from '@/app/history/page'
import CravingsPage from '@/app/cravings/page'
import CoachPage from '@/app/coach/page'
import SettingsPage from '@/app/settings/page'

const AUTH_PREFIXES = ['/login', '/register', '/splash', '/forgot-password', '/reset-password']

export default function TabShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { activeTab, mountedTabs } = useTab()

  const isAuthPage = AUTH_PREFIXES.some(p => pathname.startsWith(p))
  if (isAuthPage) return <>{children}</>

  // Sub-pages like /settings/goals are not direct tab routes
  const isDirectTab = TAB_PATHS.includes(pathname as (typeof TAB_PATHS)[number])

  return (
    <>
      {/* All tab pages stay mounted once visited; CSS controls visibility */}
      <div style={{ display: activeTab === '/' && isDirectTab ? 'block' : 'none' }}>
        {mountedTabs.includes('/') && <HomePage />}
      </div>
      <div style={{ display: activeTab === '/history' && isDirectTab ? 'block' : 'none' }}>
        {mountedTabs.includes('/history') && <HistoryPage />}
      </div>
      <div style={{ display: activeTab === '/cravings' && isDirectTab ? 'block' : 'none' }}>
        {mountedTabs.includes('/cravings') && <CravingsPage />}
      </div>
      <div style={{ display: activeTab === '/coach' && isDirectTab ? 'block' : 'none' }}>
        {mountedTabs.includes('/coach') && <CoachPage />}
      </div>
      <div style={{ display: activeTab === '/settings' && isDirectTab ? 'block' : 'none' }}>
        {mountedTabs.includes('/settings') && <SettingsPage />}
      </div>

      {/* Sub-pages (e.g. /settings/goals) render normally via children */}
      {!isDirectTab && <div>{children}</div>}
    </>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, BarChart2, Lightbulb, Settings, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNav } from '@/lib/NavContext'
import { useTab, type TabPath } from '@/lib/TabContext'

const tabs: { path: TabPath; label: string; icon: React.ElementType }[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/history', label: 'History', icon: BarChart2 },
  { path: '/cravings', label: 'Cravings', icon: Flame },
  { path: '/coach', label: 'Coach', icon: Lightbulb },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const HIDE_ON = ['/login', '/register', '/splash', '/forgot-password', '/reset-password']

export default function BottomNav() {
  const pathname = usePathname()
  const { hideNav } = useNav()
  const { activeTab, switchTab } = useTab()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null
  if (hideNav) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white safe-area-pb z-50"
      style={{ boxShadow: '0 -1px 0 #e8e0d4, 0 -8px 24px rgba(26,61,43,0.06)' }}>
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = activeTab === path
          return (
            <button key={path}
              onClick={() => switchTab(path)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5"
              style={{ touchAction: 'manipulation', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-[#007a2e]' : 'text-[#b5a99a]')} />
              <span className={cn('text-[10px] font-semibold tracking-wide', active ? 'text-[#007a2e]' : 'text-[#b5a99a]')}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

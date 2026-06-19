'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, BarChart2, Lightbulb, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/history', label: 'History', icon: BarChart2 },
  { href: '/coach', label: 'Coach', icon: Lightbulb },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const hideOn = ['/login', '/register', '/splash']
  if (hideOn.includes(pathname)) return null
  if (document.body.hasAttribute('data-analysing')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white safe-area-pb"
      style={{ boxShadow: '0 -1px 0 #e8e0d4, 0 -8px 24px rgba(26,61,43,0.06)' }}>
      <div className="max-w-md mx-auto flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center py-3 gap-0.5">
              <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-[#007a2e]' : 'text-[#b5a99a]')} />
              <span className={cn('text-[10px] font-semibold tracking-wide', active ? 'text-[#007a2e]' : 'text-[#b5a99a]')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

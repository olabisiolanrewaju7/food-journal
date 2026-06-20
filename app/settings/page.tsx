'use client'

import Link from 'next/link'
import { Settings, Target, User, CreditCard, ChevronRight, Activity } from 'lucide-react'

const MENU = [
  {
    href: '/settings/goals',
    icon: Target,
    iconBg: '#f0faf4',
    iconColor: '#00c853',
    title: 'Daily Nutrition Goals',
    subtitle: 'Set your calorie and macro targets',
  },
  {
    href: '/settings/bio',
    icon: User,
    iconBg: '#e8f5e9',
    iconColor: '#007a2e',
    title: 'My Profile',
    subtitle: 'Name, age, height, weight & gender',
  },
  {
    href: '/settings/body-stats',
    icon: Activity,
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    title: 'Body Stats & Progress',
    subtitle: 'Track weight, body fat & goal timeline',
  },
  {
    href: '/settings/payment',
    icon: CreditCard,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    title: 'Payment Details',
    subtitle: 'Manage your billing and payment method',
  },
]

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <p className="text-[#b9f6ca] text-xs font-semibold uppercase tracking-widest mb-1">Preferences</p>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Manage your profile and goals</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          {MENU.map(({ href, icon: Icon, iconBg, iconColor, title, subtitle }, i) => (
            <Link key={href} href={href}
              className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
              style={{ borderBottom: i < MENU.length - 1 ? '1px solid #f5f0e8' : undefined }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg }}>
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9c8e7e' }}>{subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#b5a99a' }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

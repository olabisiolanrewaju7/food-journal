'use client'

import { Flame, Dumbbell, Wheat, Droplets } from 'lucide-react'
import { DailySummary } from '@/types'
import { formatDate } from '@/lib/utils'

export default function DailySummaryCard({ summary }: { summary: DailySummary }) {
  const stats = [
    { icon: Flame,    val: Math.round(summary.calories), label: 'kcal', color: '#f97316', bg: '#fff3e0' },
    { icon: Dumbbell, val: Math.round(summary.protein),  label: 'Prot', color: '#ec4899', bg: '#fce7f3' },
    { icon: Wheat,    val: Math.round(summary.carbs),    label: 'Carb', color: '#f97316', bg: '#fff3e0' },
    { icon: Droplets, val: Math.round(summary.fat),      label: 'Fat',  color: '#8b5cf6', bg: '#f3e8ff' },
  ]

  return (
    <div className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.07)', border: '1px solid #f0ebe3' }}>
      <div className="flex justify-between items-center mb-3">
        <p className="font-bold text-sm" style={{ color: '#004d1a' }}>{formatDate(summary.date + 'T12:00:00')}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f0faf4', color: '#00c853' }}>
          {summary.entries} meal{summary.entries !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, val, label, color, bg }) => (
          <div key={label} className="flex flex-col items-center py-2.5 rounded-xl" style={{ background: bg }}>
            <Icon className="w-3.5 h-3.5 mb-1" style={{ color }} />
            <p className="font-bold text-sm" style={{ color }}>{val}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#9c8e7e' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

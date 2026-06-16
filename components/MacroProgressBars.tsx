'use client'

import { useEffect, useState } from 'react'
import { Flame, Dumbbell, Wheat, Droplets, Leaf } from 'lucide-react'
import { FoodEntry } from '@/types'

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 30 }

export default function MacroProgressBars({ entries }: { entries: FoodEntry[] }) {
  const [goals, setGoals] = useState(DEFAULT_GOALS)

  useEffect(() => {
    const stored = localStorage.getItem('healthyyou-goals')
    if (stored) setGoals(JSON.parse(stored))
  }, [])

  const totals = entries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat, fiber: acc.fiber + e.fiber }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )

  const cal = Math.round(totals.calories)
  const calGoal = goals.calories
  const calPct = Math.min((cal / calGoal) * 100, 100)
  const remaining = calGoal - cal

  const macros = [
    { key: 'protein' as const, label: 'Protein', icon: Dumbbell, color: '#f43f5e', track: '#ffe4e6' },
    { key: 'carbs'   as const, label: 'Carbs',   icon: Wheat,    color: '#f97316', track: '#fff3e0' },
    { key: 'fat'     as const, label: 'Fat',     icon: Droplets, color: '#8b5cf6', track: '#ede9fe' },
    { key: 'fiber'   as const, label: 'Fiber',   icon: Leaf,     color: '#06b6d4', track: '#e0f7fa' },
  ]

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
      {/* Calorie hero row */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #f5f0e8' }}>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9c8e7e' }}>Daily Intake</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-bold" style={{ color: '#004d1a' }}>{cal}</span>
              <span className="text-sm font-medium" style={{ color: '#b5a99a' }}>/ {calGoal} kcal</span>
            </div>
          </div>
          <span className="text-sm font-semibold pb-1" style={{ color: remaining >= 0 ? '#00c853' : '#e11d48' }}>
            {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e8f5e9' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${calPct}%`, background: cal > calGoal ? '#e11d48' : 'linear-gradient(90deg, #004d1a, #00c853)' }} />
        </div>
      </div>

      {/* Macro circles */}
      <div className="grid grid-cols-4 divide-x" style={{ borderColor: '#f5f0e8' }}>
        {macros.map(({ key, label, icon: Icon, color, track }) => {
          const val = Math.round(totals[key])
          const goal = goals[key]
          const pct = Math.min((val / goal) * 100, 100)
          const r = 22
          const circ = 2 * Math.PI * r
          const dash = (pct / 100) * circ
          return (
            <div key={key} className="flex flex-col items-center py-3 px-2 gap-1">
              <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="28" cy="28" r={r} fill="none" stroke={track} strokeWidth="4" />
                  <circle
                    cx="28" cy="28" r={r} fill="none"
                    stroke={color} strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center leading-none">
                  <span className="text-sm font-black tracking-tight" style={{ color, lineHeight: 1 }}>{val}</span>
                  <span className="text-[9px] font-bold uppercase" style={{ color, opacity: 0.7 }}>g</span>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: '#1a1a1a' }}>{label}</span>
              <span className="text-[9px] font-semibold" style={{ color: '#9c8e7e' }}>/ {goal}g</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

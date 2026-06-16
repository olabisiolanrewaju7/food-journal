'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Flame, Dumbbell, Wheat, Droplets, Leaf, Check, ArrowLeft } from 'lucide-react'

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 30 }

const GOAL_FIELDS = [
  { key: 'calories', label: 'Daily Calories', icon: Flame,    unit: 'kcal', iconBg: '#fff3e0', iconColor: '#f97316', min: 800,  max: 5000 },
  { key: 'protein',  label: 'Protein',        icon: Dumbbell, unit: 'g',    iconBg: '#fce7f3', iconColor: '#ec4899', min: 20,   max: 400  },
  { key: 'carbs',    label: 'Carbohydrates',  icon: Wheat,    unit: 'g',    iconBg: '#fff3e0', iconColor: '#f97316', min: 20,   max: 600  },
  { key: 'fat',      label: 'Fat',            icon: Droplets, unit: 'g',    iconBg: '#f3e8ff', iconColor: '#8b5cf6', min: 10,   max: 200  },
  { key: 'fiber',    label: 'Fiber',          icon: Leaf,     unit: 'g',    iconBg: '#f0faf4', iconColor: '#00c853', min: 5,    max: 100  },
] as const

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('healthyyou-goals')
    if (stored) setGoals(JSON.parse(stored))
  }, [])

  function handleChange(key: string, value: string) {
    setGoals(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
    setSaved(false)
  }

  function save() {
    localStorage.setItem('healthyyou-goals', JSON.stringify(goals))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function reset() {
    setGoals(DEFAULT_GOALS)
    localStorage.setItem('healthyyou-goals', JSON.stringify(DEFAULT_GOALS))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <button onClick={() => router.back()} className="flex items-center gap-1 mb-3"
            style={{ color: '#b9f6ca' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Settings</span>
          </button>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Nutrition Goals</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Customize your daily targets</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <div>
            {GOAL_FIELDS.map(({ key, label, icon: Icon, unit, iconBg, iconColor, min, max }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: '1px solid #f5f0e8' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg }}>
                  <Icon className="w-4 h-4" style={{ color: iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{label}</p>
                  <p className="text-xs" style={{ color: '#b5a99a' }}>{min}–{max} {unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" value={goals[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    min={min} max={max}
                    className="w-20 text-right px-2 py-2 rounded-xl text-sm font-bold focus:outline-none"
                    style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
                  />
                  <span className="text-xs w-7 flex-shrink-0" style={{ color: '#b5a99a' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 flex gap-2" style={{ background: '#faf7f2' }}>
            <button onClick={reset}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'white', color: '#9c8e7e', border: '1.5px solid #e8e0d4' }}>
              Reset Default
            </button>
            <button onClick={save}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: saved ? '#00c853' : 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Goals'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Check, X, Flame, Dumbbell, Wheat, Droplets, Leaf } from 'lucide-react'
import { FoodAnalysis } from '@/types'

interface Props { analysis: FoodAnalysis; imageDataUrl: string; onConfirm: () => void; onDiscard: () => void }

export default function FoodAnalysisResult({ analysis, imageDataUrl, onConfirm, onDiscard }: Props) {
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...analysis, timestamp: new Date().toISOString(), image_data: imageDataUrl }),
      })
      onConfirm()
    } finally { setSaving(false) }
  }

  const macros = [
    { label: 'Protein', value: analysis.protein, icon: Dumbbell, color: '#ec4899', bg: '#fce7f3' },
    { label: 'Carbs',   value: analysis.carbs,   icon: Wheat,    color: '#f97316', bg: '#fff3e0' },
    { label: 'Fat',     value: analysis.fat,     icon: Droplets, color: '#8b5cf6', bg: '#f3e8ff' },
    { label: 'Fiber',   value: analysis.fiber,   icon: Leaf,     color: '#00c853', bg: '#f0faf4' },
  ]

  return (
    <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 2px 16px rgba(26,61,43,0.12)' }}>
      {imageDataUrl && (
        <div className="relative">
          <img src={imageDataUrl} alt={analysis.food_name} className="w-full h-48 object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,61,43,0.75), transparent 50%)' }} />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-bold text-lg leading-tight">{analysis.food_name}</p>
            {analysis.description && <p className="text-white/70 text-xs mt-0.5">{analysis.description}</p>}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Calorie badge */}
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: '#fff3e0', border: '1px solid #fed7aa' }}>
          <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
          <span className="text-2xl font-bold" style={{ color: '#ea580c' }}>{Math.round(analysis.calories)}</span>
          <span className="text-sm font-medium" style={{ color: '#fb923c' }}>calories estimated</span>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-2">
          {macros.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex flex-col items-center p-2.5 rounded-xl" style={{ background: bg }}>
              <Icon className="w-4 h-4 mb-1" style={{ color }} />
              <span className="font-bold text-sm" style={{ color }}>{Math.round(value)}g</span>
              <span className="text-[10px] mt-0.5" style={{ color: '#9c8e7e' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onDiscard}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'white', color: '#9c8e7e', border: '1.5px solid #e8e0d4' }}>
            <X className="w-4 h-4" /> Discard
          </button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Log This Meal'}
          </button>
        </div>
      </div>
    </div>
  )
}

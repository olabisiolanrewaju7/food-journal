'use client'

import { useState } from 'react'
import { Check, X, Flame, Dumbbell, Wheat, Droplets, Leaf, Pencil, Sparkles, Loader2, ChevronUp } from 'lucide-react'
import { FoodAnalysis } from '@/types'

interface Props { analysis: FoodAnalysis; imageDataUrl: string; onConfirm: () => void; onDiscard: () => void }

interface EditState {
  food_name: string
  description: string
  calories: string
  protein: string
  carbs: string
  fat: string
  fiber: string
}

function toEdit(a: FoodAnalysis): EditState {
  return {
    food_name:   a.food_name,
    description: a.description ?? '',
    calories:    String(Math.round(a.calories)),
    protein:     String(Math.round(a.protein)),
    carbs:       String(Math.round(a.carbs)),
    fat:         String(Math.round(a.fat)),
    fiber:       String(Math.round(a.fiber)),
  }
}

function fromEdit(e: EditState): FoodAnalysis {
  return {
    food_name:   e.food_name,
    description: e.description,
    calories:    Number(e.calories)  || 0,
    protein:     Number(e.protein)   || 0,
    carbs:       Number(e.carbs)     || 0,
    fat:         Number(e.fat)       || 0,
    fiber:       Number(e.fiber)     || 0,
  }
}

export default function FoodAnalysisResult({ analysis, imageDataUrl, onConfirm, onDiscard }: Props) {
  const [current, setCurrent] = useState<FoodAnalysis>(analysis)
  const [editing, setEditing] = useState(false)
  const [editState, setEditState] = useState<EditState>(toEdit(analysis))
  const [analysing, setAnalysing] = useState(false)
  const [analyseError, setAnalyseError] = useState('')
  const [saving, setSaving] = useState(false)

  function applyEdit() {
    setCurrent(fromEdit(editState))
    setEditing(false)
    setAnalyseError('')
  }

  async function reanalyse() {
    if (!editState.food_name.trim()) return
    setAnalysing(true)
    setAnalyseError('')
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: editState.food_name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      const next: EditState = {
        food_name:   data.food_name   ?? editState.food_name,
        description: data.description ?? editState.description,
        calories:    String(Math.round(data.calories ?? 0)),
        protein:     String(Math.round(data.protein  ?? 0)),
        carbs:       String(Math.round(data.carbs    ?? 0)),
        fat:         String(Math.round(data.fat      ?? 0)),
        fiber:       String(Math.round(data.fiber    ?? 0)),
      }
      setEditState(next)
      setCurrent(fromEdit(next))
    } catch (err) {
      setAnalyseError(err instanceof Error ? err.message : 'Failed to analyse')
    } finally {
      setAnalysing(false)
    }
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, timestamp: new Date().toISOString(), image_data: imageDataUrl }),
      })
      onConfirm()
    } finally { setSaving(false) }
  }

  const macros = [
    { label: 'Protein', value: current.protein, icon: Dumbbell, color: '#ec4899', bg: '#fce7f3' },
    { label: 'Carbs',   value: current.carbs,   icon: Wheat,    color: '#f97316', bg: '#fff3e0' },
    { label: 'Fat',     value: current.fat,      icon: Droplets, color: '#8b5cf6', bg: '#f3e8ff' },
    { label: 'Fiber',   value: current.fiber,    icon: Leaf,     color: '#00c853', bg: '#f0faf4' },
  ]

  function numField(label: string, key: keyof EditState, unit: string) {
    return (
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number" min={0}
            value={editState[key]}
            onChange={e => setEditState(s => ({ ...s, [key]: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#f5f0e8', color: '#1a1a1a' }}
          />
          <span className="text-xs shrink-0" style={{ color: '#9c8e7e' }}>{unit}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 2px 16px rgba(26,61,43,0.12)' }}>
      {imageDataUrl && (
        <div className="relative">
          <img src={imageDataUrl} alt={current.food_name} className="w-full h-48 object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,61,43,0.75), transparent 50%)' }} />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-bold text-lg leading-tight line-clamp-2">{current.food_name}</p>
            {current.description && (
              <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{current.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Calorie badge */}
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: '#fff3e0', border: '1px solid #fed7aa' }}>
          <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
          <span className="text-2xl font-bold" style={{ color: '#ea580c' }}>{Math.round(current.calories)}</span>
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

        {/* Edit toggle */}
        <button
          onClick={() => { setEditing(e => !e); setAnalyseError('') }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: editing ? '#f0fdf4' : '#f5f0e8', color: editing ? '#007a2e' : '#5a5246' }}
        >
          {editing ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          {editing ? 'Hide editor' : 'Edit before logging'}
        </button>

        {/* Inline edit panel */}
        {editing && (
          <div className="space-y-3 pt-1 border-t" style={{ borderColor: '#f0ebe3' }}>
            {/* Food name + Re-analyse */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>
                Food name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editState.food_name}
                  onChange={e => setEditState(s => ({ ...s, food_name: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#f5f0e8', color: '#1a1a1a' }}
                  placeholder="e.g. cooked oats"
                />
                <button
                  onClick={reanalyse}
                  disabled={analysing || !editState.food_name.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}
                >
                  {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {analysing ? 'Analysing…' : 'Re-analyse'}
                </button>
              </div>
              {analyseError && <p className="text-xs mt-1" style={{ color: '#e11d48' }}>{analyseError}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>Description</label>
              <input
                type="text"
                value={editState.description}
                onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {numField('Calories', 'calories', 'kcal')}
              {numField('Protein',  'protein',  'g')}
              {numField('Carbs',    'carbs',    'g')}
              {numField('Fat',      'fat',      'g')}
              {numField('Fiber',    'fiber',    'g')}
            </div>

            <button
              onClick={applyEdit}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#f0fdf4', color: '#007a2e', border: '1.5px solid #bbf7d0' }}
            >
              <Check className="w-4 h-4" /> Apply changes
            </button>
          </div>
        )}

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

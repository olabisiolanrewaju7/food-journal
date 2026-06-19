'use client'

import { useState } from 'react'
import { Trash2, Clock, Flame, UtensilsCrossed, Pencil, Check, X, Sparkles, Loader2 } from 'lucide-react'
import { FoodEntry } from '@/types'
import { formatTime } from '@/lib/utils'

interface Props {
  entries: FoodEntry[]
  onDelete: (id: number) => void
  onUpdate: (entry: FoodEntry) => void
}

interface EditState {
  food_name: string
  description: string
  calories: string
  protein: string
  carbs: string
  fat: string
  fiber: string
}

function toEditState(e: FoodEntry): EditState {
  return {
    food_name: e.food_name,
    description: e.description ?? '',
    calories: String(Math.round(e.calories)),
    protein: String(Math.round(e.protein)),
    carbs: String(Math.round(e.carbs)),
    fat: String(Math.round(e.fat)),
    fiber: String(Math.round(e.fiber)),
  }
}

export default function FoodLogList({ entries, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [analyseError, setAnalyseError] = useState('')

  async function handleDelete(id: number) {
    await fetch(`/api/log?id=${id}`, { method: 'DELETE' })
    onDelete(id)
  }

  function startEdit(entry: FoodEntry) {
    setEditingId(entry.id)
    setEditState(toEditState(entry))
    setAnalyseError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditState(null)
    setAnalyseError('')
  }

  async function reanalyse() {
    if (!editState?.food_name.trim()) return
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
      setEditState(s => s ? {
        ...s,
        food_name: data.food_name ?? s.food_name,
        description: data.description ?? s.description,
        calories: String(Math.round(data.calories ?? 0)),
        protein: String(Math.round(data.protein ?? 0)),
        carbs: String(Math.round(data.carbs ?? 0)),
        fat: String(Math.round(data.fat ?? 0)),
        fiber: String(Math.round(data.fiber ?? 0)),
      } : s)
    } catch (err) {
      setAnalyseError(err instanceof Error ? err.message : 'Failed to analyse')
    } finally {
      setAnalysing(false)
    }
  }

  async function saveEdit(entry: FoodEntry) {
    if (!editState) return
    setSaving(true)
    const body = {
      id: entry.id,
      food_name: editState.food_name.trim(),
      description: editState.description.trim(),
      calories: Number(editState.calories) || 0,
      protein: Number(editState.protein) || 0,
      carbs: Number(editState.carbs) || 0,
      fat: Number(editState.fat) || 0,
      fiber: Number(editState.fiber) || 0,
    }
    const res = await fetch('/api/log', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      onUpdate({ ...entry, ...body })
      setEditingId(null)
      setEditState(null)
    }
    setSaving(false)
  }

  function field(label: string, key: keyof EditState, unit = '') {
    return (
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type={key === 'food_name' || key === 'description' ? 'text' : 'number'}
            value={editState?.[key] ?? ''}
            onChange={e => setEditState(s => s ? { ...s, [key]: e.target.value } : s)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#f5f0e8', color: '#1a1a1a' }}
          />
          {unit && <span className="text-xs shrink-0" style={{ color: '#9c8e7e' }}>{unit}</span>}
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f0faf4' }}>
          <UtensilsCrossed className="w-8 h-8" style={{ color: '#b9f6ca' }} />
        </div>
        <p className="font-bold" style={{ color: '#004d1a' }}>No meals logged today</p>
        <p className="text-sm mt-1" style={{ color: '#9c8e7e' }}>Take a photo of your food to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#9c8e7e' }}>Today&apos;s Meals</p>
      {entries.map(entry => (
        <div key={entry.id} className="rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.07)', border: '1px solid #f0ebe3' }}>

          {/* Entry row */}
          <div className="flex gap-3 p-3">
            {entry.image_data ? (
              <img src={entry.image_data} alt={entry.food_name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0faf4' }}>
                <UtensilsCrossed className="w-6 h-6" style={{ color: '#b9f6ca' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: '#1a1a1a' }}>{entry.food_name}</p>
              {entry.description && (
                <p className="text-xs truncate mt-0.5" style={{ color: '#b5a99a' }}>{entry.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <span className="flex items-center gap-1 font-bold" style={{ color: '#f97316' }}>
                  <Flame className="w-3 h-3" />{Math.round(entry.calories)}
                </span>
                <span style={{ color: '#e8e0d4' }}>·</span>
                <span style={{ color: '#ec4899' }}>{Math.round(entry.protein)}g P</span>
                <span style={{ color: '#e8e0d4' }}>·</span>
                <span style={{ color: '#f97316' }}>{Math.round(entry.carbs)}g C</span>
                <span style={{ color: '#e8e0d4' }}>·</span>
                <span style={{ color: '#8b5cf6' }}>{Math.round(entry.fat)}g F</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: '#c9bfb3' }}>
                <Clock className="w-3 h-3" />{formatTime(entry.timestamp)}
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0 self-start mt-1">
              <button onClick={() => editingId === entry.id ? cancelEdit() : startEdit(entry)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  background: editingId === entry.id ? '#f0fdf4' : '#f5f0e8',
                  color: editingId === entry.id ? '#007a2e' : '#5a5246',
                }}>
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(entry.id)}
                className="p-2 rounded-lg transition-colors"
                style={{ background: '#fff1f2', color: '#e11d48' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Inline edit panel */}
          {editingId === entry.id && editState && (
            <div className="px-3 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: '#f0ebe3' }}>
              {/* Food name + Re-analyse */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>
                  Food name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editState.food_name}
                    onChange={e => setEditState(s => s ? { ...s, food_name: e.target.value } : s)}
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
                    {analysing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Sparkles className="w-4 h-4" />}
                    {analysing ? 'Analysing…' : 'Re-analyse'}
                  </button>
                </div>
                {analyseError && (
                  <p className="text-xs mt-1" style={{ color: '#e11d48' }}>{analyseError}</p>
                )}
              </div>

              {field('Description', 'description')}
              <div className="grid grid-cols-2 gap-3">
                {field('Calories', 'calories', 'kcal')}
                {field('Protein', 'protein', 'g')}
                {field('Carbs', 'carbs', 'g')}
                {field('Fat', 'fat', 'g')}
                {field('Fiber', 'fiber', 'g')}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => saveEdit(entry)} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
                  <Check className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={cancelEdit}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#f5f0e8', color: '#9c8e7e' }}>
                  <X className="w-4 h-4" />Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

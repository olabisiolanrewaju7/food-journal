'use client'

import { useState } from 'react'
import { Check, X, Sparkles, Loader2, ClipboardEdit } from 'lucide-react'

interface Props { onConfirm: () => void; onDiscard: () => void }

interface FormState {
  food_name: string
  description: string
  calories: string
  protein: string
  carbs: string
  fat: string
  fiber: string
}

const EMPTY: FormState = { food_name: '', description: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' }

export default function ManualFoodEntry({ onConfirm, onDiscard }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [analysing, setAnalysing] = useState(false)
  const [analyseError, setAnalyseError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function update(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function estimateWithAI() {
    if (!form.food_name.trim()) return
    setAnalysing(true)
    setAnalyseError('')
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: form.food_name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setForm({
        food_name: data.food_name ?? form.food_name,
        description: data.description ?? '',
        calories: String(Math.round(data.calories ?? 0)),
        protein: String(Math.round(data.protein ?? 0)),
        carbs: String(Math.round(data.carbs ?? 0)),
        fat: String(Math.round(data.fat ?? 0)),
        fiber: String(Math.round(data.fiber ?? 0)),
      })
    } catch (err) {
      setAnalyseError(err instanceof Error ? err.message : 'Failed to estimate')
    } finally {
      setAnalysing(false)
    }
  }

  async function handleConfirm() {
    if (!form.food_name.trim()) {
      setSaveError('Give this meal a name first.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: form.food_name.trim(),
          description: form.description,
          calories: Number(form.calories) || 0,
          protein: Number(form.protein) || 0,
          carbs: Number(form.carbs) || 0,
          fat: Number(form.fat) || 0,
          fiber: Number(form.fiber) || 0,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onConfirm()
    } catch {
      setSaveError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function numField(label: string, key: keyof FormState, unit: string) {
    return (
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number" min={0}
            value={form[key]}
            onChange={e => update(key, e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#f5f0e8', color: '#1a1a1a' }}
          />
          <span className="text-xs shrink-0" style={{ color: '#9c8e7e' }}>{unit}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white p-4 space-y-3" style={{ boxShadow: '0 2px 16px rgba(26,61,43,0.12)' }}>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0faf4' }}>
          <ClipboardEdit className="w-4 h-4" style={{ color: '#00c853' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: '#1a3d2b' }}>Log food manually</p>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>Food name</label>
        <div className="flex gap-2">
          <input
            type="text" autoFocus
            value={form.food_name}
            onChange={e => update('food_name', e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: '#f5f0e8', color: '#1a1a1a' }}
            placeholder="e.g. grilled chicken salad"
          />
          <button
            onClick={estimateWithAI}
            disabled={analysing || !form.food_name.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 shrink-0"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}
          >
            {analysing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analysing ? 'Estimating…' : 'Estimate with AI'}
          </button>
        </div>
        {analyseError && <p className="text-xs mt-1" style={{ color: '#e11d48' }}>{analyseError}</p>}
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9c8e7e' }}>Description (optional)</label>
        <input
          type="text"
          value={form.description}
          onChange={e => update('description', e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: '#f5f0e8', color: '#1a1a1a' }}
          placeholder="e.g. large bowl, homemade"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {numField('Calories', 'calories', 'kcal')}
        {numField('Protein', 'protein', 'g')}
        {numField('Carbs', 'carbs', 'g')}
        {numField('Fat', 'fat', 'g')}
        {numField('Fiber', 'fiber', 'g')}
      </div>

      {saveError && <p className="text-xs" style={{ color: '#e11d48' }}>{saveError}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={onDiscard}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'white', color: '#9c8e7e', border: '1.5px solid #e8e0d4' }}>
          <X className="w-4 h-4" /> Cancel
        </button>
        <button onClick={handleConfirm} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
          <Check className="w-4 h-4" />
          {saving ? 'Saving...' : 'Log This Meal'}
        </button>
      </div>
    </div>
  )
}

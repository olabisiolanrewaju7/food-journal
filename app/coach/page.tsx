'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Loader2, Sparkles, RefreshCw } from 'lucide-react'

const QUICK_GOALS = ['Lose weight', 'Build muscle', 'Eat healthier', 'More energy', 'Better sleep']

function cacheKey(goal: string) {
  return `fj-advice-${goal.trim().toLowerCase().replace(/\s+/g, '-') || 'general'}`
}

export default function CoachPage() {
  const [goal, setGoal] = useState('')
  const [advice, setAdvice] = useState('')
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load cached advice when goal changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey(goal))
      if (raw) {
        const { advice: a, ts } = JSON.parse(raw)
        setAdvice(a); setCachedAt(ts)
      } else {
        setAdvice(''); setCachedAt(null)
      }
    } catch { setAdvice(''); setCachedAt(null) }
  }, [goal])

  async function getAdvice(force = false) {
    if (!force) {
      // If cached within 6 hours, show it without fetching
      const raw = localStorage.getItem(cacheKey(goal))
      if (raw) {
        try {
          const { advice: a, ts } = JSON.parse(raw)
          if (Date.now() - ts < 6 * 60 * 60 * 1000) {
            setAdvice(a); setCachedAt(ts); return
          }
        } catch { /* stale, refetch */ }
      }
    }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const ts = Date.now()
      setAdvice(data.advice); setCachedAt(ts)
      try { localStorage.setItem(cacheKey(goal), JSON.stringify({ advice: data.advice, ts })) } catch { /* ignore */ }
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to get advice. Please try again.') }
    finally { setLoading(false) }
  }

  function renderAdvice(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## '))
        return (
          <h3 key={i} className="font-bold text-base mt-5 mb-2 flex items-center gap-2" style={{ color: '#004d1a' }}>
            <span className="w-1 h-5 rounded-full inline-block" style={{ background: '#00c853' }} />
            {line.slice(3)}
          </h3>
        )
      if (line.trim() === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-sm leading-relaxed" style={{ color: '#5a5246' }}>{line}</p>
    })
  }

  const ageLabel = cachedAt
    ? (() => {
        const mins = Math.round((Date.now() - cachedAt) / 60_000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        return `${Math.round(mins / 60)}h ago`
      })()
    : null

  return (
    <div className="min-h-screen">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <p className="text-[#b9f6ca] text-xs font-semibold uppercase tracking-widest mb-1">AI Powered</p>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Coach</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Personalized nutrition advice</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <div className="px-4 pt-4 pb-3">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9c8e7e' }}>What&apos;s your goal?</p>
            <input
              type="text" value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="e.g. lose weight, build muscle..."
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_GOALS.map(g => (
                <button key={g} onClick={() => setGoal(g)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={goal === g
                    ? { background: '#004d1a', color: 'white', borderColor: '#004d1a' }
                    : { background: 'white', color: '#9c8e7e', borderColor: '#e8e0d4' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => getAdvice(false)} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 font-bold text-white disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing your week...</>
              : <><Sparkles className="w-5 h-5" /> Get My Personalized Advice</>}
          </button>
        </div>

        {error && (
          <div className="rounded-2xl p-4 text-sm font-medium" style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}>
            {error}
          </div>
        )}

        {advice ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#f0faf4', borderBottom: '1px solid #d8f3dc' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#00c853' }} />
                <span className="font-bold text-sm" style={{ color: '#004d1a' }}>Your Personalized Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                {ageLabel && <span className="text-xs" style={{ color: '#9c8e7e' }}>{ageLabel}</span>}
                <button onClick={() => getAdvice(true)} disabled={loading}
                  className="p-1.5 rounded-lg disabled:opacity-40"
                  style={{ background: '#e8f5e9' }}>
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: '#007a2e' }} />
                </button>
              </div>
            </div>
            <div className="p-4">{renderAdvice(advice)}</div>
          </div>
        ) : !loading && (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f0faf4' }}>
              <Lightbulb className="w-8 h-8" style={{ color: '#b9f6ca' }} />
            </div>
            <p className="font-bold" style={{ color: '#004d1a' }}>Ready to coach you</p>
            <p className="text-sm mt-1" style={{ color: '#9c8e7e' }}>Analyzes your last 7 days and gives tailored advice</p>
          </div>
        )}
      </div>
    </div>
  )
}

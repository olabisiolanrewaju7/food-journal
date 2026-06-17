'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import NutritionChart from '@/components/NutritionChart'
import DailySummaryCard from '@/components/DailySummaryCard'
import { DailySummary } from '@/types'

export default function HistoryPage() {
  const [days, setDays] = useState(7)
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cacheKey = `fj-summary-${days}`
    // Show cached data instantly
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setSummaries(JSON.parse(cached)); setLoading(false) }
    } catch { /* ignore */ }
    // Fetch fresh in background
    fetch(`/api/daily-summary?days=${days}`)
      .then(r => r.json())
      .then(data => {
        setSummaries(data)
        setLoading(false)
        try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* ignore */ }
      })
  }, [days])

  return (
    <div className="min-h-screen">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <p className="text-[#b9f6ca] text-xs font-semibold uppercase tracking-widest mb-1">Overview</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">History</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Your nutrition over time</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        {/* Range selector */}
        <div className="bg-white rounded-2xl p-1.5 flex gap-1" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={days === d
                ? { background: 'linear-gradient(135deg, #004d1a, #00c853)', color: 'white' }
                : { color: '#9c8e7e' }}>
              {d} days
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
              style={{ borderColor: '#00c853', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#9c8e7e' }}>Loading history...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#f0faf4' }}>
              <TrendingUp className="w-8 h-8" style={{ color: '#b9f6ca' }} />
            </div>
            <p className="font-bold text-gray-700">No data yet</p>
            <p className="text-sm mt-1" style={{ color: '#9c8e7e' }}>Log some meals to see your history</p>
          </div>
        ) : (
          <>
            <NutritionChart data={summaries} />
            <p className="text-xs font-bold uppercase tracking-widest px-1 pt-1" style={{ color: '#9c8e7e' }}>Daily Breakdown</p>
            {summaries.map(s => <DailySummaryCard key={s.date} summary={s} />)}
          </>
        )}
      </div>
    </div>
  )
}

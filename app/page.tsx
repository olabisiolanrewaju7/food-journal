'use client'

import { useState, useEffect, useCallback } from 'react'
import { Salad, LogOut, RefreshCw } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import CameraCapture from '@/components/CameraCapture'
import FoodAnalysisResult from '@/components/FoodAnalysisResult'
import FoodLogList from '@/components/FoodLogList'
import MacroProgressBars from '@/components/MacroProgressBars'
import { FoodAnalysis, FoodEntry } from '@/types'

export default function HomePage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [pendingAnalysis, setPendingAnalysis] = useState<{ analysis: FoodAnalysis; imageDataUrl: string } | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const fetchEntries = useCallback(async (showSpinner = false) => {
    const cacheKey = `fj-entries-${today}`
    if (showSpinner) {
      setRefreshing(true)
    } else {
      // Show cached data instantly on silent load
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) setEntries(JSON.parse(cached))
      } catch { /* ignore */ }
    }
    const res = await fetch(`/api/log?date=${today}`)
    if (res.ok) {
      const data = await res.json()
      setEntries(data)
      try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* ignore */ }
    }
    setRefreshing(false)
  }, [today])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Hide bottom nav while reviewing an analysis so the Log button is always reachable
  useEffect(() => {
    if (pendingAnalysis) {
      document.body.setAttribute('data-analysing', '1')
    } else {
      document.body.removeAttribute('data-analysing')
    }
    return () => document.body.removeAttribute('data-analysing')
  }, [pendingAnalysis])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[#b9f6ca] text-xs font-semibold uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <div className="flex items-center gap-2">
              <Salad className="w-6 h-6 text-white" />
              <h1 className="text-2xl font-bold text-white tracking-tight">FoodJournal</h1>
            </div>
            <p className="text-[#b9f6ca] text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          {session?.user && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchEntries(true)}
                  disabled={refreshing}
                  className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  aria-label="Refresh">
                  <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {session.user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.6)' }}>
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        <MacroProgressBars entries={entries} />

        {pendingAnalysis ? (
          <FoodAnalysisResult
            analysis={pendingAnalysis.analysis}
            imageDataUrl={pendingAnalysis.imageDataUrl}
            onConfirm={() => { setPendingAnalysis(null); fetchEntries() }}
            onDiscard={() => setPendingAnalysis(null)}
          />
        ) : (
          <CameraCapture onAnalysis={(a, img) => setPendingAnalysis({ analysis: a, imageDataUrl: img })} />
        )}

        <FoodLogList
          entries={entries}
          onDelete={id => setEntries(p => p.filter(e => e.id !== id))}
          onUpdate={updated => setEntries(p => p.map(e => e.id === updated.id ? updated : e))}
        />
      </div>
    </div>
  )
}

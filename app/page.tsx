'use client'

import { useState, useEffect, useCallback } from 'react'
import { Salad } from 'lucide-react'
import CameraCapture from '@/components/CameraCapture'
import FoodAnalysisResult from '@/components/FoodAnalysisResult'
import FoodLogList from '@/components/FoodLogList'
import MacroProgressBars from '@/components/MacroProgressBars'
import { FoodAnalysis, FoodEntry } from '@/types'

export default function HomePage() {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [pendingAnalysis, setPendingAnalysis] = useState<{ analysis: FoodAnalysis; imageDataUrl: string } | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/log?date=${today}`)
    setEntries(await res.json())
  }, [today])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        {/* Decorative circle */}
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

        <FoodLogList entries={entries} onDelete={id => setEntries(p => p.filter(e => e.id !== id))} />
      </div>
    </div>
  )
}

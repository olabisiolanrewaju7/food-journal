'use client'

import { useState } from 'react'
import { Lightbulb, Loader2, Sparkles } from 'lucide-react'

export default function AdvicePage() {
  const [goal, setGoal] = useState('')
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function getAdvice() {
    setLoading(true)
    setAdvice('')
    setError('')
    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAdvice(data.advice)
    } catch {
      setError('Failed to get advice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function renderAdvice(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{line.slice(3)}</h3>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-800 dark:text-gray-200">{line.slice(2, -2)}</p>
      }
      if (line.trim() === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-purple-50 to-transparent dark:from-purple-900/20">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-7 h-7 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advice</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personalized nutrition coaching from Claude AI</p>
      </div>

      <div className="px-4 space-y-4 pb-4">
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            What's your goal? (optional)
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. lose weight, build muscle, eat healthier..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={getAdvice}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold text-base shadow-lg shadow-purple-500/30 disabled:opacity-60 active:scale-95 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Claude is analyzing your week...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get My Personalized Advice
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {advice && (
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Your Personalized Analysis</span>
            </div>
            <div className="space-y-1">
              {renderAdvice(advice)}
            </div>
          </div>
        )}

        {!advice && !loading && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-3">🤖</p>
            <p className="font-medium text-gray-500 dark:text-gray-400">Claude will analyze your food logs</p>
            <p className="text-sm mt-1">Based on your last 7 days of meals</p>
          </div>
        )}
      </div>
    </div>
  )
}

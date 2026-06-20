'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, ArrowLeft, Plus, Trash2, Target, TrendingDown, TrendingUp, Minus, Check } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface BodyStat {
  id: number
  recorded_at: string
  weight_kg: number
  body_fat_pct: number | null
  notes: string | null
}

interface BodyGoal {
  target_weight_kg: string
  target_body_fat_pct: string
  target_date: string
}

const DEFAULT_GOAL: BodyGoal = { target_weight_kg: '', target_body_fat_pct: '', target_date: '' }

function loadGoal(): BodyGoal {
  try {
    const raw = localStorage.getItem('healthyyou-body-goal')
    return raw ? JSON.parse(raw) : DEFAULT_GOAL
  } catch { return DEFAULT_GOAL }
}

function saveGoal(g: BodyGoal) {
  try { localStorage.setItem('healthyyou-body-goal', JSON.stringify(g)) } catch { /* ignore */ }
}

function calcETA(stats: BodyStat[], goalWeight: number): string | null {
  if (stats.length < 2) return null
  const sorted = [...stats].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  const first = sorted[0], last = sorted[sorted.length - 1]
  const days = (new Date(last.recorded_at).getTime() - new Date(first.recorded_at).getTime()) / 86400000
  if (days < 1) return null
  const ratePerDay = (Number(last.weight_kg) - Number(first.weight_kg)) / days
  if (ratePerDay === 0) return null
  const current = Number(last.weight_kg)
  const remaining = goalWeight - current
  if ((remaining > 0 && ratePerDay < 0) || (remaining < 0 && ratePerDay > 0)) return null // wrong direction
  const daysLeft = Math.abs(remaining / ratePerDay)
  if (daysLeft > 730) return 'Over 2 years at this rate'
  const eta = new Date(); eta.setDate(eta.getDate() + Math.round(daysLeft))
  const weeks = Math.round(daysLeft / 7)
  if (weeks < 1) return 'Less than a week!'
  if (weeks < 8) return `~${weeks} week${weeks > 1 ? 's' : ''} (${eta.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
  const months = Math.round(daysLeft / 30)
  return `~${months} month${months > 1 ? 's' : ''} (${eta.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})`
}

export default function BodyStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<BodyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState<BodyGoal>(DEFAULT_GOAL)
  const [goalSaved, setGoalSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'log' | 'progress' | 'goal'>('log')
  const [chartMetric, setChartMetric] = useState<'weight' | 'fat'>('weight')

  // Log form
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/body-stats?limit=90')
      if (res.ok) setStats(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchStats()
    setGoal(loadGoal())
  }, [fetchStats])

  async function logStat() {
    if (!weight) return
    setSaving(true)
    try {
      const res = await fetch('/api/body-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight_kg: parseFloat(weight),
          body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
          notes: notes || null,
          recorded_at: logDate,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setWeight(''); setBodyFat(''); setNotes('')
        setTimeout(() => setSaved(false), 2000)
        fetchStats()
      }
    } finally { setSaving(false) }
  }

  async function deleteStat(id: number) {
    await fetch(`/api/body-stats?id=${id}`, { method: 'DELETE' })
    setStats(prev => prev.filter(s => s.id !== id))
  }

  function saveGoalData() {
    saveGoal(goal)
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 2000)
  }

  const sorted = [...stats].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
  const chartData = sorted.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    weight: Number(s.weight_kg),
    fat: s.body_fat_pct !== null ? Number(s.body_fat_pct) : undefined,
  }))

  const latest = sorted[sorted.length - 1]
  const earliest = sorted[0]
  const totalChange = latest && earliest ? Number(latest.weight_kg) - Number(earliest.weight_kg) : null
  const targetWeight = goal.target_weight_kg ? parseFloat(goal.target_weight_kg) : null
  const eta = targetWeight && stats.length >= 2 ? calcETA(stats, targetWeight) : null
  const progressPct = targetWeight && latest && earliest
    ? Math.min(100, Math.max(0, Math.abs(Number(earliest.weight_kg) - Number(latest.weight_kg)) / Math.abs(Number(earliest.weight_kg) - targetWeight) * 100))
    : null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <button onClick={() => router.back()} className="flex items-center gap-1 mb-3" style={{ color: '#b9f6ca' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Settings</span>
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Body Stats</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Track your progress over time</p>

          {/* Quick summary */}
          {latest && (
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-[#b9f6ca] text-[10px] font-semibold uppercase tracking-widest">Current</p>
                <p className="text-white text-xl font-bold">{Number(latest.weight_kg).toFixed(1)} kg</p>
              </div>
              {targetWeight && (
                <div>
                  <p className="text-[#b9f6ca] text-[10px] font-semibold uppercase tracking-widest">Goal</p>
                  <p className="text-white text-xl font-bold">{targetWeight} kg</p>
                </div>
              )}
              {totalChange !== null && stats.length >= 2 && (
                <div>
                  <p className="text-[#b9f6ca] text-[10px] font-semibold uppercase tracking-widest">Total change</p>
                  <div className="flex items-center gap-1">
                    {totalChange < 0
                      ? <TrendingDown className="w-4 h-4 text-[#b9f6ca]" />
                      : totalChange > 0 ? <TrendingUp className="w-4 h-4 text-[#ffcc80]" /> : <Minus className="w-4 h-4 text-[#b9f6ca]" />}
                    <p className="text-white text-xl font-bold">{totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} kg</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar toward goal */}
          {progressPct !== null && (
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-semibold text-[#b9f6ca] uppercase tracking-widest">Progress to goal</span>
                <span className="text-[10px] font-bold text-white">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${progressPct}%`, background: '#00c853' }} />
              </div>
              {eta && <p className="text-[#b9f6ca] text-xs mt-1">🎯 Estimated: {eta}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ background: 'white', borderColor: '#f0f0f0' }}>
        {(['log', 'progress', 'goal'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
            style={activeTab === tab ? { color: '#007a2e', borderBottom: '2px solid #007a2e' } : { color: '#9c8e7e' }}>
            {tab === 'log' ? 'Log Stats' : tab === 'progress' ? 'Progress' : 'My Goal'}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-28 space-y-3">

        {/* ── LOG TAB ── */}
        {activeTab === 'log' && (
          <>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9c8e7e' }}>Log today&apos;s stats</p>

                {/* Date */}
                <div className="mb-3">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Date</label>
                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                </div>

                {/* Weight + Body fat */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Weight (kg) *</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
                      placeholder="e.g. 75.5"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Body fat % (opt.)</label>
                    <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)}
                      placeholder="e.g. 18.5"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-3">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Notes (optional)</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. After morning workout"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                </div>
              </div>

              <div className="px-4 pb-4">
                <button onClick={logStat} disabled={!weight || saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: saved ? '#00c853' : 'linear-gradient(135deg, #004d1a, #00c853)' }}>
                  {saved ? <><Check className="w-4 h-4" /> Logged!</> : <><Plus className="w-4 h-4" /> Log Stats</>}
                </button>
              </div>
            </div>

            {/* History list */}
            {stats.length > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9c8e7e' }}>History</p>
                  <div className="space-y-2">
                    {stats.slice(0, 15).map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#f5f0e8' }}>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>
                            {Number(s.weight_kg).toFixed(1)} kg
                            {s.body_fat_pct !== null && <span className="ml-2 text-xs font-semibold" style={{ color: '#9c8e7e' }}>{Number(s.body_fat_pct).toFixed(1)}% fat</span>}
                          </p>
                          <p className="text-xs" style={{ color: '#9c8e7e' }}>
                            {new Date(s.recorded_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {s.notes && <span> · {s.notes}</span>}
                          </p>
                        </div>
                        <button onClick={() => deleteStat(s.id)} className="p-2 rounded-xl" style={{ background: '#fff1f2' }}>
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#e11d48' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && stats.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
                <p className="font-bold" style={{ color: '#004d1a' }}>No stats logged yet</p>
                <p className="text-sm mt-1" style={{ color: '#9c8e7e' }}>Log your first weigh-in above to start tracking</p>
              </div>
            )}
          </>
        )}

        {/* ── PROGRESS TAB ── */}
        {activeTab === 'progress' && (
          <>
            {stats.length >= 2 ? (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
                <div className="px-4 pt-4 pb-2">
                  {/* Metric toggle */}
                  <div className="flex gap-2 mb-4">
                    {(['weight', 'fat'] as const).map(m => (
                      <button key={m} onClick={() => setChartMetric(m)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={chartMetric === m
                          ? { background: '#004d1a', color: 'white', borderColor: '#004d1a' }
                          : { background: 'white', color: '#9c8e7e', borderColor: '#e8e0d4' }}>
                        {m === 'weight' ? 'Weight (kg)' : 'Body fat (%)'}
                      </button>
                    ))}
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9c8e7e' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: '#9c8e7e' }} tickLine={false} axisLine={false}
                        domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: 'white', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                        labelStyle={{ color: '#1a1a1a', fontWeight: 700 }}
                      />
                      {targetWeight && chartMetric === 'weight' && (
                        <ReferenceLine y={targetWeight} stroke="#00c853" strokeDasharray="4 4"
                          label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#007a2e' }} />
                      )}
                      <Line
                        type="monotone"
                        dataKey={chartMetric === 'weight' ? 'weight' : 'fat'}
                        stroke="#007a2e" strokeWidth={2.5}
                        dot={{ fill: '#007a2e', r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats summary */}
                <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: '#f5f0e8' }}>
                  {[
                    { label: 'Start', value: `${Number(earliest?.weight_kg ?? 0).toFixed(1)} kg` },
                    { label: 'Now', value: `${Number(latest?.weight_kg ?? 0).toFixed(1)} kg` },
                    { label: 'Change', value: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9c8e7e' }}>{label}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#004d1a' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
                <p className="font-bold" style={{ color: '#004d1a' }}>Need at least 2 entries</p>
                <p className="text-sm mt-1" style={{ color: '#9c8e7e' }}>Log your weight on a few different days to see your progress chart</p>
              </div>
            )}
          </>
        )}

        {/* ── GOAL TAB ── */}
        {activeTab === 'goal' && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0faf4' }}>
                  <Target className="w-4 h-4" style={{ color: '#007a2e' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>Set your body goal</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Target weight (kg)</label>
                  <input type="number" step="0.5" value={goal.target_weight_kg}
                    onChange={e => setGoal(p => ({ ...p, target_weight_kg: e.target.value }))}
                    placeholder="e.g. 70"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Target body fat % (optional)</label>
                  <input type="number" step="0.5" value={goal.target_body_fat_pct}
                    onChange={e => setGoal(p => ({ ...p, target_body_fat_pct: e.target.value }))}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#9c8e7e' }}>Target date (optional)</label>
                  <input type="date" value={goal.target_date}
                    onChange={e => setGoal(p => ({ ...p, target_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
                </div>
              </div>

              {/* ETA card */}
              {eta && (
                <div className="mt-4 px-4 py-3 rounded-2xl" style={{ background: '#f0faf4', border: '1px solid #d8f3dc' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#007a2e' }}>Estimated time to goal</p>
                  <p className="text-base font-bold" style={{ color: '#004d1a' }}>🎯 {eta}</p>
                  <p className="text-xs mt-1" style={{ color: '#9c8e7e' }}>Based on your current rate of change</p>
                </div>
              )}

              {stats.length < 2 && goal.target_weight_kg && (
                <div className="mt-4 px-4 py-3 rounded-2xl" style={{ background: '#fff8f0', border: '1px solid #ffe0b2' }}>
                  <p className="text-xs" style={{ color: '#e65100' }}>Log at least 2 weigh-ins to see your estimated time to goal</p>
                </div>
              )}
            </div>

            <div className="px-4 pb-4 pt-2">
              <button onClick={saveGoalData}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: goalSaved ? '#00c853' : 'linear-gradient(135deg, #004d1a, #00c853)' }}>
                {goalSaved ? <><Check className="w-4 h-4" /> Goal Saved!</> : 'Save Goal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

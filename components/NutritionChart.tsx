'use client'

import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { DailySummary } from '@/types'

export default function NutritionChart({ data }: { data: DailySummary[] }) {
  const formatted = [...data].reverse().map(d => ({
    ...d,
    date: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: Math.round(d.calories),
    protein: Math.round(d.protein),
    carbs: Math.round(d.carbs),
    fat: Math.round(d.fat),
  }))

  const tick = { fontSize: 10, fill: '#b5a99a' }

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white rounded-xl p-3 text-xs" style={{ boxShadow: '0 4px 16px rgba(26,61,43,0.15)', border: '1px solid #f0ebe3' }}>
        <p className="font-bold mb-1" style={{ color: '#004d1a' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="font-medium" style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'Calories' ? ' kcal' : 'g'}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9c8e7e' }}>Calorie Trend</p>
        <ResponsiveContainer width="100%" height={155}>
          <LineChart data={formatted} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" />
            <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="calories" stroke="#007a2e" strokeWidth={2.5}
              dot={{ r: 3, fill: '#007a2e', strokeWidth: 0 }} name="Calories" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9c8e7e' }}>Macros Breakdown</p>
        <ResponsiveContainer width="100%" height={155}>
          <BarChart data={formatted} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" />
            <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="protein" stackId="a" fill="#ec4899" name="Protein" />
            <Bar dataKey="carbs"   stackId="a" fill="#f97316" name="Carbs" />
            <Bar dataKey="fat"     stackId="a" fill="#8b5cf6" name="Fat" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

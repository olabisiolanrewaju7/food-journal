'use client'

import { Trash2, Clock, Flame, UtensilsCrossed } from 'lucide-react'
import { FoodEntry } from '@/types'
import { formatTime } from '@/lib/utils'

interface Props { entries: FoodEntry[]; onDelete: (id: number) => void }

export default function FoodLogList({ entries, onDelete }: Props) {
  async function handleDelete(id: number) {
    await fetch(`/api/log?id=${id}`, { method: 'DELETE' })
    onDelete(id)
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
      <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#9c8e7e' }}>Today's Meals</p>
      {entries.map(entry => (
        <div key={entry.id} className="flex gap-3 p-3 rounded-2xl bg-white"
          style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.07)', border: '1px solid #f0ebe3' }}>
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
          <button onClick={() => handleDelete(entry.id)}
            className="flex-shrink-0 p-2 self-start mt-1 rounded-lg transition-colors"
            style={{ color: '#d8cfc4' }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

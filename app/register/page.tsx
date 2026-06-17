'use client'

import { useState } from 'react'
import { Salad } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        let message = `Server error (${res.status})`
        try {
          const data = await res.json()
          message = data.error ?? message
        } catch { /* response wasn't JSON */ }
        setError(message)
        return
      }

      // Hard redirect to login — user signs in with their new credentials
      window.location.href = '/login?registered=1'
    } catch (err) {
      setError(`Network error — ${err instanceof Error ? err.message : 'please try again'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-10 text-center"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Salad className="w-7 h-7 text-white" />
          <h1 className="text-2xl font-bold text-white tracking-tight">FoodJournal</h1>
        </div>
        <p className="text-[#b9f6ca] text-sm">Track your nutrition with AI</p>
      </div>

      <div className="flex-1 px-5 py-8">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: '#1a3d2b' }}>Create account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a' }}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a' }}
                placeholder="Min 8 characters"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#9c8e7e' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#007a2e' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

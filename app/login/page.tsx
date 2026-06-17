'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Salad } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/')
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
          <h2 className="text-lg font-bold mb-5" style={{ color: '#1a3d2b' }}>Sign in</h2>

          {justRegistered && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#f0fdf4', color: '#15803d' }}>
              Account created! Sign in to get started.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid transparent' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid transparent' }}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#9c8e7e' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold" style={{ color: '#007a2e' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Salad, User, Mail, Lock, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    // Auto sign-in after register
    const login = await signIn('credentials', { email, password, redirect: false })
    if (login?.ok) {
      router.push('/')
      router.refresh()
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative px-5 pt-16 pb-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Salad className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FoodJournal</h1>
          <p className="text-[#b9f6ca] text-sm mt-1">Create your free account</p>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-6">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,77,26,0.12)' }}>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5a99a' }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" required autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none"
                  style={{ background: '#f5f0e8', border: '1.5px solid #e8e0d4', color: '#1a1a1a' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5a99a' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none"
                  style={{ background: '#f5f0e8', border: '1.5px solid #e8e0d4', color: '#1a1a1a' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5a99a' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold focus:outline-none"
                  style={{ background: '#f5f0e8', border: '1.5px solid #e8e0d4', color: '#1a1a1a' }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="px-5 py-4 text-center text-sm" style={{ borderTop: '1px solid #f5f0e8', background: '#faf7f2' }}>
            <span style={{ color: '#9c8e7e' }}>Already have an account? </span>
            <Link href="/login" className="font-bold" style={{ color: '#00c853' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

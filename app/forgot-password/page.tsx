'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Salad, ArrowLeft, Mail, Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-5 pt-14 pb-10 text-center"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Salad className="w-7 h-7 text-white" />
          <h1 className="text-2xl font-bold text-white tracking-tight">FoodJournal</h1>
        </div>
        <p className="text-[#b9f6ca] text-sm">Reset your password</p>
      </div>

      <div className="flex-1 px-5 py-8">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#f0faf4' }}>
                <Check className="w-7 h-7" style={{ color: '#007a2e' }} />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: '#1a3d2b' }}>Check your email</h2>
              <p className="text-sm mb-6" style={{ color: '#9c8e7e' }}>
                If <strong>{email}</strong> has an account, we&apos;ve sent a reset link. Check your inbox — it expires in 1 hour.
              </p>
              <Link href="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ color: '#007a2e' }}>
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#1a3d2b' }}>Forgot your password?</h2>
              <p className="text-sm mb-5" style={{ color: '#9c8e7e' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#b5a99a' }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid transparent' }}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm mt-5">
                <Link href="/login" className="flex items-center justify-center gap-1 font-semibold" style={{ color: '#9c8e7e' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

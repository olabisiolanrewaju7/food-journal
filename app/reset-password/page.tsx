'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Salad, Eye, EyeOff, Check, XCircle } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new link.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#f0faf4' }}>
            <Check className="w-7 h-7" style={{ color: '#007a2e' }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#1a3d2b' }}>Password updated!</h2>
          <p className="text-sm mb-6" style={{ color: '#9c8e7e' }}>Your password has been changed. You can now sign in.</p>
          <Link href="/login"
            className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold mb-1" style={{ color: '#1a3d2b' }}>Set new password</h2>
          <p className="text-sm mb-5" style={{ color: '#9c8e7e' }}>Choose a strong password — at least 8 characters.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium flex items-start gap-2"
              style={{ background: '#fef2f2', color: '#dc2626' }}>
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none"
                  style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid transparent' }}
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: '#b5a99a' }} />
                    : <Eye className="w-4 h-4" style={{ color: '#b5a99a' }} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9c8e7e' }}>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid transparent' }}
                placeholder="Repeat your password"
              />
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0ece4' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: password.length >= 12 ? '100%' : password.length >= 8 ? '60%' : '30%',
                    background: password.length >= 12 ? '#00c853' : password.length >= 8 ? '#f97316' : '#e11d48',
                  }} />
                </div>
                <p className="text-xs" style={{
                  color: password.length >= 12 ? '#007a2e' : password.length >= 8 ? '#c2410c' : '#b91c1c'
                }}>
                  {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Too short'}
                </p>
              </div>
            )}

            <button type="submit" disabled={loading || !token}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-5 pt-14 pb-10 text-center"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Salad className="w-7 h-7 text-white" />
          <h1 className="text-2xl font-bold text-white tracking-tight">FoodJournal</h1>
        </div>
        <p className="text-[#b9f6ca] text-sm">Choose a new password</p>
      </div>
      <div className="flex-1 px-5 py-8">
        <Suspense fallback={<div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}

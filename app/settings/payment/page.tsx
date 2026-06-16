'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, ArrowLeft, Check, Lock, Trash2 } from 'lucide-react'

const DEFAULT_PAYMENT = {
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  billingAddress: '',
}

function maskCard(num: string) {
  const digits = num.replace(/\D/g, '')
  const masked = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  return masked.slice(0, 19)
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function PaymentPage() {
  const router = useRouter()
  const [payment, setPayment] = useState(DEFAULT_PAYMENT)
  const [saved, setSaved] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('foodjournal-payment')
    if (stored) { setPayment(JSON.parse(stored)); setHasSaved(true) }
  }, [])

  function save() {
    localStorage.setItem('foodjournal-payment', JSON.stringify(payment))
    setSaved(true); setHasSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function remove() {
    localStorage.removeItem('foodjournal-payment')
    setPayment(DEFAULT_PAYMENT); setHasSaved(false)
  }

  const lastFour = payment.cardNumber.replace(/\D/g, '').slice(-4)

  return (
    <div className="min-h-screen">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <button onClick={() => router.back()} className="flex items-center gap-1 mb-3"
            style={{ color: '#b9f6ca' }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Settings</span>
          </button>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Payment Details</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Manage your billing information</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">

        {/* Saved card preview */}
        {hasSaved && lastFour && (
          <div className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)', boxShadow: '0 4px 20px rgba(0,200,83,0.25)' }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Saved Card</p>
              <p className="text-white font-bold text-lg tracking-widest">•••• •••• •••• {lastFour}</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{payment.cardName || 'Cardholder'} · {payment.expiry || '––/––'}</p>
            </div>
            <CreditCard className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>

          {/* Cardholder name */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>Cardholder Name</p>
            <input
              type="text" value={payment.cardName} placeholder="Name on card"
              onChange={e => setPayment(p => ({ ...p, cardName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none"
              style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
            />
          </div>

          {/* Card number */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>Card Number</p>
            <input
              type="text" inputMode="numeric" value={payment.cardNumber} placeholder="1234 5678 9012 3456"
              onChange={e => setPayment(p => ({ ...p, cardNumber: maskCard(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold tracking-widest focus:outline-none"
              style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
            />
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 divide-x" style={{ borderBottom: '1px solid #f5f0e8', borderColor: '#f5f0e8' }}>
            <div className="px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>Expiry</p>
              <input
                type="text" inputMode="numeric" value={payment.expiry} placeholder="MM/YY"
                onChange={e => setPayment(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
              />
            </div>
            <div className="px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>CVV</p>
              <input
                type="password" inputMode="numeric" value={payment.cvv} placeholder="•••"
                maxLength={4}
                onChange={e => setPayment(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none"
                style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
              />
            </div>
          </div>

          {/* Billing address */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>Billing Address</p>
            <input
              type="text" value={payment.billingAddress} placeholder="Street, City, Postcode"
              onChange={e => setPayment(p => ({ ...p, billingAddress: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none"
              style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
            />
          </div>

          {/* Security note */}
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#f0faf4', borderBottom: '1px solid #f5f0e8' }}>
            <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00c853' }} />
            <p className="text-xs" style={{ color: '#5a5246' }}>Your payment details are stored locally and never shared.</p>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex gap-2" style={{ background: '#faf7f2' }}>
            {hasSaved && (
              <button onClick={remove}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'white', color: '#e11d48', border: '1.5px solid #fecdd3' }}>
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
            <button onClick={save}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: saved ? '#00c853' : 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Payment Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Lock, ShieldCheck, ExternalLink } from 'lucide-react'

export default function PaymentPage() {
  const router = useRouter()

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
            <h1 className="text-2xl font-bold text-white tracking-tight">Payment</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Secure billing via Stripe</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        {/* Security notice */}
        <div className="bg-white rounded-2xl p-5 flex gap-3" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <ShieldCheck className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: '#00c853' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>PCI-compliant payments</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5a5246' }}>
              Card details are handled entirely by Stripe — your numbers never touch our servers and are never stored in this app. Connect your Stripe account below to enable billing.
            </p>
          </div>
        </div>

        {/* Stripe connect CTA */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#f0faf4', borderBottom: '1px solid #d8f3dc' }}>
            <CreditCard className="w-4 h-4" style={{ color: '#00c853' }} />
            <span className="font-bold text-sm" style={{ color: '#004d1a' }}>Connect Payment Method</span>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm" style={{ color: '#5a5246' }}>
              To set up billing, connect a Stripe account. Your payment method is stored securely by Stripe and can be updated or removed at any time.
            </p>

            {/* Placeholder Stripe button */}
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: '#635bff' }}
              onClick={() => alert('Stripe integration: add your publishable key and mount a Stripe Elements form here.')}>
              <ExternalLink className="w-4 h-4" />
              Connect with Stripe
            </button>
          </div>

          <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#faf7f2', borderTop: '1px solid #f5f0e8' }}>
            <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00c853' }} />
            <p className="text-xs" style={{ color: '#9c8e7e' }}>
              Payments are processed by Stripe, Inc. Card numbers, CVV, and expiry are never stored in FoodJournal.
            </p>
          </div>
        </div>

        {/* What's included */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#f0faf4', borderBottom: '1px solid #d8f3dc' }}>
            <ShieldCheck className="w-4 h-4" style={{ color: '#00c853' }} />
            <span className="font-bold text-sm" style={{ color: '#004d1a' }}>Security Guarantees</span>
          </div>
          {[
            'Card data handled by Stripe — never stored here',
            'All traffic encrypted with TLS 1.2+',
            'No CVV is ever retained after authorisation',
            'Cancel or update your card any time',
          ].map(item => (
            <div key={item} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: '1px solid #f5f0e8' }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#00c853' }} />
              <p className="text-sm" style={{ color: '#5a5246' }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

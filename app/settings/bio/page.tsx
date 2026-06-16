'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Check, ArrowLeft } from 'lucide-react'

const DEFAULT_BIO = { name: '', age: '', height: '', weight: '', gender: '' }

export default function BioPage() {
  const router = useRouter()
  const [bio, setBio] = useState(DEFAULT_BIO)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('healthyyou-bio')
    if (stored) setBio(JSON.parse(stored))
  }, [])

  function save() {
    localStorage.setItem('healthyyou-bio', JSON.stringify(bio))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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
            <User className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Your personal details</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>

          {/* Name */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>Name</p>
            <input
              type="text" value={bio.name} placeholder="Your name"
              onChange={e => setBio(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold focus:outline-none"
              style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
            />
          </div>

          {/* Gender */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9c8e7e' }}>Gender</p>
            <div className="flex gap-2">
              {['Male', 'Female', 'Other'].map(g => (
                <button key={g} onClick={() => setBio(p => ({ ...p, gender: g }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
                  style={bio.gender === g
                    ? { background: '#004d1a', color: 'white', borderColor: '#004d1a' }
                    : { background: 'white', color: '#9c8e7e', borderColor: '#e8e0d4' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age / Height / Weight */}
          <div className="grid grid-cols-3 divide-x" style={{ borderBottom: '1px solid #f5f0e8', borderColor: '#f5f0e8' }}>
            {[
              { key: 'age',    label: 'Age',    unit: 'yrs', placeholder: '25'  },
              { key: 'height', label: 'Height', unit: 'cm',  placeholder: '170' },
              { key: 'weight', label: 'Weight', unit: 'kg',  placeholder: '70'  },
            ].map(({ key, label, unit, placeholder }) => (
              <div key={key} className="flex flex-col items-center px-3 py-4 gap-1.5">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9c8e7e' }}>{label}</p>
                <input
                  type="number"
                  value={bio[key as keyof typeof bio]}
                  placeholder={placeholder}
                  onChange={e => setBio(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full text-center px-2 py-2 rounded-xl text-sm font-bold focus:outline-none"
                  style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
                />
                <p className="text-[10px] font-semibold" style={{ color: '#b5a99a' }}>{unit}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3" style={{ background: '#faf7f2' }}>
            <button onClick={save}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: saved ? '#00c853' : 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

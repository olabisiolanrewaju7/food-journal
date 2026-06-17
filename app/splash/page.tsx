'use client'

import { useEffect, useState } from 'react'
import { Salad } from 'lucide-react'

export default function SplashPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    const show = setTimeout(() => setVisible(true), 100)
    // Redirect to login after 2.5s
    const redirect = setTimeout(() => {
      window.location.href = '/login'
    }, 2500)
    return () => { clearTimeout(show); clearTimeout(redirect) }
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #004d1a 0%, #007a2e 50%, #00c853 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #ffffff, transparent)', transform: 'translate(-30%, -30%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #ffffff, transparent)', transform: 'translate(30%, 30%)' }} />

      {/* Content */}
      <div
        className="flex flex-col items-center gap-5 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
      >
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <Salad className="w-12 h-12 text-white" />
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">FoodJournal</h1>
          <p className="text-[#b9f6ca] text-base mt-2 font-medium">Track your nutrition with AI</p>
        </div>
      </div>

      {/* Loading dots */}
      <div
        className="absolute bottom-16 flex gap-2 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.5)',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Send, Flame, Loader2, Plus } from 'lucide-react'

interface Suggestion {
  name: string
  description: string
  cuisine: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  whyItWorks: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  suggestions?: Suggestion[]
}

interface Preferences {
  cuisines: string[]
  pastChoices: string[]
  dietaryNotes: string[]
}

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem('healthyyou-craving-prefs')
    return raw ? JSON.parse(raw) : { cuisines: [], pastChoices: [], dietaryNotes: [] }
  } catch { return { cuisines: [], pastChoices: [], dietaryNotes: [] } }
}

function savePrefs(prefs: Preferences) {
  try { localStorage.setItem('healthyyou-craving-prefs', JSON.stringify(prefs)) } catch { /* ignore */ }
}

function loadGoals() {
  try {
    const raw = localStorage.getItem('healthyyou-goals')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function loadTodayCalories(): number {
  try {
    const today = new Date().toISOString().split('T')[0]
    const raw = localStorage.getItem(`fj-entries-${today}`)
    if (!raw) return 0
    const entries = JSON.parse(raw)
    return entries.reduce((s: number, e: { calories: number }) => s + (e.calories || 0), 0)
  } catch { return 0 }
}

const CUISINE_CHIPS = ['African', 'Asian', 'American', 'Mediterranean', 'Latin', 'Middle Eastern']

export default function CravingsPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefs, setPrefs] = useState<Preferences>({ cuisines: [], pastChoices: [], dietaryNotes: [] })
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [loggedItem, setLoggedItem] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setPrefs(loadPrefs())
    setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput((prev: string) => prev ? `${prev} ${transcript}` : transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  async function send(text = input) {
    const msg = text.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const goals = loadGoals()
      const caloriesConsumedToday = loadTodayCalories()

      const res = await fetch('/api/cravings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          preferences: prefs,
          goals,
          caloriesConsumedToday,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.message,
        suggestions: data.suggestions?.length ? data.suggestions : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Learn cuisine preferences from suggestions
      if (data.suggestions?.length) {
        const cuisines = Array.from(new Set<string>(data.suggestions.map((s: Suggestion) => s.cuisine)))
        setPrefs(prev => {
          const updated = {
            ...prev,
            cuisines: Array.from(new Set([...prev.cuisines, ...cuisines])).slice(0, 10),
          }
          savePrefs(updated)
          return updated
        })
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  async function logSuggestion(s: Suggestion) {
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: s.name,
          description: s.description,
          calories: s.calories,
          protein: s.protein,
          carbs: s.carbs,
          fat: s.fat,
          fiber: s.fiber ?? 0,
        }),
      })
      if (!res.ok) throw new Error()

      // Update today's cache
      const today = new Date().toISOString().split('T')[0]
      const cacheKey = `fj-entries-${today}`
      try {
        const raw = localStorage.getItem(cacheKey)
        const entries = raw ? JSON.parse(raw) : []
        const logged = await res.json()
        localStorage.setItem(cacheKey, JSON.stringify([...entries, logged]))
      } catch { /* ignore */ }

      // Update preferences
      setPrefs(prev => {
        const updated = {
          ...prev,
          pastChoices: [s.name, ...prev.pastChoices].slice(0, 20),
          cuisines: Array.from(new Set([s.cuisine, ...prev.cuisines])).slice(0, 10),
        }
        savePrefs(updated)
        return updated
      })

      setLoggedItem(s.name)
      setTimeout(() => setLoggedItem(null), 2500)
    } catch {
      alert('Failed to log item. Please try again.')
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
        <div className="relative">
          <p className="text-[#b9f6ca] text-xs font-semibold uppercase tracking-widest mb-1">AI Powered</p>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Cravings</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Tell me what you&apos;re in the mood for</p>
        </div>
      </div>

      {/* Cuisine preference chips */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CUISINE_CHIPS.map(c => {
            const active = prefs.cuisines.includes(c)
            return (
              <button key={c}
                onClick={() => {
                  setPrefs(prev => {
                    const updated = {
                      ...prev,
                      cuisines: active
                        ? prev.cuisines.filter(x => x !== c)
                        : [...prev.cuisines, c].slice(0, 10),
                    }
                    savePrefs(updated)
                    return updated
                  })
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={active
                  ? { background: '#004d1a', color: 'white', borderColor: '#004d1a' }
                  : { background: 'white', color: '#9c8e7e', borderColor: '#e8e0d4' }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center pt-10 pb-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#f0faf4' }}>
              <Flame className="w-8 h-8" style={{ color: '#b9f6ca' }} />
            </div>
            <p className="font-bold" style={{ color: '#004d1a' }}>What are you craving?</p>
            <p className="text-sm mt-1 max-w-xs" style={{ color: '#9c8e7e' }}>
              Tap the mic or type below — I&apos;ll suggest options that fit your goals.
            </p>
            <div className="mt-5 space-y-2 w-full max-w-xs">
              {[
                'Something sweet but healthy 🍓',
                'A filling snack under 200 cal',
                'High protein African dish',
              ].map(hint => (
                <button key={hint} onClick={() => send(hint)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'white', color: '#5a5246', boxShadow: '0 2px 8px rgba(26,61,43,0.08)' }}>
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'w-full'}`}>
              {/* Bubble */}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'rounded-bl-sm'
              }`}
                style={m.role === 'user'
                  ? { background: 'linear-gradient(135deg, #004d1a, #007a2e)' }
                  : { background: 'white', color: '#1a1a1a', boxShadow: '0 2px 8px rgba(26,61,43,0.08)' }}>
                {m.content}
              </div>

              {/* Suggestion cards */}
              {m.suggestions?.map((s, j) => (
                <div key={j} className="mt-2 rounded-2xl overflow-hidden"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: '#1a1a1a' }}>{s.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: '#f0faf4', color: '#007a2e' }}>{s.cuisine}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#9c8e7e' }}>{s.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs font-bold" style={{ color: '#f97316' }}>🔥 {s.calories} cal</span>
                      <span className="text-xs font-semibold" style={{ color: '#f43f5e' }}>{s.protein}g P</span>
                      <span className="text-xs font-semibold" style={{ color: '#f97316' }}>{s.carbs}g C</span>
                      <span className="text-xs font-semibold" style={{ color: '#8b5cf6' }}>{s.fat}g F</span>
                    </div>
                    <p className="text-xs mt-1.5 italic" style={{ color: '#007a2e' }}>✓ {s.whyItWorks}</p>
                  </div>
                  <button onClick={() => logSuggestion(s)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold"
                    style={{ background: '#f0faf4', color: '#007a2e', borderTop: '1px solid #d8f3dc' }}>
                    <Plus className="w-3.5 h-3.5" /> Log this meal
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
              style={{ background: 'white', boxShadow: '0 2px 8px rgba(26,61,43,0.08)' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#007a2e' }} />
              <span className="text-sm" style={{ color: '#9c8e7e' }}>Finding options for you…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Toast */}
      {loggedItem && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-sm font-semibold z-50"
          style={{ background: '#007a2e', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          ✓ {loggedItem} logged!
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 pb-28 pt-3 border-t"
        style={{ borderColor: '#e8e0d4', background: '#f5f5f0' }}>
        <div className="flex items-center gap-2">
          {speechSupported && (
            <button onClick={toggleVoice}
              className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
              style={listening
                ? { background: '#e11d48', boxShadow: '0 0 0 4px rgba(225,29,72,0.2)' }
                : { background: 'white', boxShadow: '0 2px 8px rgba(26,61,43,0.1)' }}>
              {listening
                ? <MicOff className="w-5 h-5 text-white" />
                : <Mic className="w-5 h-5" style={{ color: '#007a2e' }} />}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={listening ? 'Listening…' : 'Tell me what you\'re craving…'}
            className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'white', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

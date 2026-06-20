'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Send, Flame, Loader2, Plus, ChefHat, Bike, MapPin, Minus, CheckSquare, Square, ExternalLink } from 'lucide-react'

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

interface Ingredient {
  item: string
  quantity: string
}

interface Recipe {
  prepTime: string
  cookTime: string
  ingredients: Ingredient[]
  steps: string[]
}

interface Restaurant {
  name: string
  reason: string
  uberEatsUrl: string
  doorDashUrl: string
}

type PanelMode = 'make' | 'order'
interface ActivePanel {
  msgIndex: number
  suggIndex: number
  mode: PanelMode
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
  const [isIosNonSafari, setIsIosNonSafari] = useState(false)
  const [loggedItem, setLoggedItem] = useState<string | null>(null)

  // Make it state
  const [activePanel, setActivePanel] = useState<ActivePanel | null>(null)
  const [servings, setServings] = useState(2)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelError, setPanelError] = useState('')

  // Order it state
  const [location, setLocation] = useState('')
  const [locationMode, setLocationMode] = useState<'idle' | 'typing' | 'locating'>('idle')
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPrefs(loadPrefs())
    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
    const iosNonSafari = isIos && !isSafari
    setIsIosNonSafari(iosNonSafari)
    setSpeechSupported(!iosNonSafari && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, activePanel, recipe, restaurants])

  function openPanel(msgIndex: number, suggIndex: number, mode: PanelMode) {
    const same = activePanel?.msgIndex === msgIndex && activePanel?.suggIndex === suggIndex && activePanel?.mode === mode
    if (same) { setActivePanel(null); return }
    setActivePanel({ msgIndex, suggIndex, mode })
    setRecipe(null)
    setRestaurants(null)
    setPanelError('')
    setCheckedIngredients(new Set())
    if (mode === 'make') setServings(2)
    if (mode === 'order') { setLocation(''); setLocationMode('idle') }
  }

  async function generateRecipe(suggestion: Suggestion) {
    setPanelLoading(true); setPanelError(''); setRecipe(null)
    try {
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: suggestion.name, description: suggestion.description, servings }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRecipe(data)
    } catch (e) { setPanelError(e instanceof Error ? e.message : 'Failed to generate recipe') }
    finally { setPanelLoading(false) }
  }

  async function findRestaurants(suggestion: Suggestion, loc: string) {
    if (!loc.trim()) return
    setPanelLoading(true); setPanelError(''); setRestaurants(null)
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: suggestion.name, cuisine: suggestion.cuisine, location: loc }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRestaurants(data.restaurants)
    } catch (e) { setPanelError(e instanceof Error ? e.message : 'Failed to find restaurants') }
    finally { setPanelLoading(false) }
  }

  function requestGeolocation(suggestion: Suggestion) {
    setLocationMode('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude},${pos.coords.longitude}`
        setLocation(loc)
        setLocationMode('idle')
        findRestaurants(suggestion, loc)
      },
      () => {
        setLocationMode('typing')
        setPanelError('Could not get your location. Please type your neighbourhood instead.')
      }
    )
  }

  function toggleVoice() {
    if (isIosNonSafari) { setListening(prev => !prev); return }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript
        } else {
          interim += e.results[i][0].transcript
        }
      }
      // Show interim results live in the input box
      setInput(finalTranscript + interim)

      // Auto-send if user says "send"
      if (finalTranscript.trim().toLowerCase().endsWith('send')) {
        const msgToSend = finalTranscript.replace(/send\s*$/i, '').trim()
        recognition.stop()
        setListening(false)
        setInput('')
        if (msgToSend) send(msgToSend)
      }
    }
    recognition.onerror = () => { setListening(false); setInput(finalTranscript) }
    recognition.onend = () => {
      setListening(false)
      // Auto-send when user taps mic to stop
      const msg = finalTranscript.trim()
      if (msg) { setInput(''); send(msg) } else { setInput('') }
    }
    recognitionRef.current = recognition
    recognition.start(); setListening(true)
  }

  async function send(text = input) {
    const msg = text.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)
    setActivePanel(null)

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
      const assistantMsg: Message = { role: 'assistant', content: data.message, suggestions: data.suggestions?.length ? data.suggestions : undefined }
      setMessages(prev => [...prev, assistantMsg])
      if (data.suggestions?.length) {
        const cuisines = Array.from(new Set<string>(data.suggestions.map((s: Suggestion) => s.cuisine)))
        setPrefs(prev => {
          const updated = { ...prev, cuisines: Array.from(new Set([...prev.cuisines, ...cuisines])).slice(0, 10) }
          savePrefs(updated); return updated
        })
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : 'Something went wrong. Please try again.' }])
    } finally { setLoading(false) }
  }

  async function logSuggestion(s: Suggestion) {
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: s.name, description: s.description, calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat, fiber: s.fiber ?? 0 }),
      })
      if (!res.ok) throw new Error()
      const today = new Date().toISOString().split('T')[0]
      try {
        const raw = localStorage.getItem(`fj-entries-${today}`)
        const entries = raw ? JSON.parse(raw) : []
        const logged = await res.json()
        localStorage.setItem(`fj-entries-${today}`, JSON.stringify([...entries, logged]))
      } catch { /* ignore */ }
      setPrefs(prev => {
        const updated = { ...prev, pastChoices: [s.name, ...prev.pastChoices].slice(0, 20), cuisines: Array.from(new Set([s.cuisine, ...prev.cuisines])).slice(0, 10) }
        savePrefs(updated); return updated
      })
      setLoggedItem(s.name)
      setTimeout(() => setLoggedItem(null), 2500)
    } catch { alert('Failed to log item. Please try again.') }
  }

  function renderMakePanel(suggestion: Suggestion) {
    return (
      <div className="mt-2 rounded-2xl overflow-hidden" style={{ background: '#f0faf4', border: '1.5px solid #d8f3dc' }}>
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#007a2e' }}>Make it yourself</p>

          {/* Servings selector */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Servings</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setServings(s => Math.max(1, s - 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'white', border: '1.5px solid #d8f3dc' }}>
                <Minus className="w-3 h-3" style={{ color: '#007a2e' }} />
              </button>
              <span className="text-sm font-bold w-4 text-center" style={{ color: '#004d1a' }}>{servings}</span>
              <button onClick={() => setServings(s => Math.min(20, s + 1))}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'white', border: '1.5px solid #d8f3dc' }}>
                <Plus className="w-3 h-3" style={{ color: '#007a2e' }} />
              </button>
            </div>
          </div>

          <button onClick={() => generateRecipe(suggestion)} disabled={panelLoading}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
            {panelLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating recipe…</span> : 'Generate Recipe & Grocery List'}
          </button>

          {panelError && <p className="text-xs mt-2 font-medium" style={{ color: '#e11d48' }}>{panelError}</p>}

          {recipe && (
            <div className="mt-4 space-y-4">
              {/* Time */}
              <div className="flex gap-4">
                <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'white' }}>
                  <p className="text-xs" style={{ color: '#9c8e7e' }}>Prep</p>
                  <p className="text-sm font-bold" style={{ color: '#004d1a' }}>{recipe.prepTime}</p>
                </div>
                <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'white' }}>
                  <p className="text-xs" style={{ color: '#9c8e7e' }}>Cook</p>
                  <p className="text-sm font-bold" style={{ color: '#004d1a' }}>{recipe.cookTime}</p>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#007a2e' }}>Grocery List</p>
                <div className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <button key={i} onClick={() => setCheckedIngredients(prev => {
                      const next = new Set(prev)
                      if (next.has(i)) { next.delete(i) } else { next.add(i) }
                      return next
                    })} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left"
                      style={{ background: 'white' }}>
                      {checkedIngredients.has(i)
                        ? <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: '#007a2e' }} />
                        : <Square className="w-4 h-4 flex-shrink-0" style={{ color: '#b5a99a' }} />}
                      <span className="text-sm flex-1" style={{ color: checkedIngredients.has(i) ? '#9c8e7e' : '#1a1a1a', textDecoration: checkedIngredients.has(i) ? 'line-through' : 'none' }}>
                        {ing.item}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#007a2e' }}>{ing.quantity}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#007a2e' }}>Recipe Steps</p>
                <div className="space-y-2">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'white' }}>
                      <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: '#007a2e', marginTop: '1px' }}>{i + 1}</span>
                      <p className="text-sm leading-relaxed" style={{ color: '#1a1a1a' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log button */}
              <button onClick={() => logSuggestion(suggestion)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'white', color: '#007a2e', border: '1.5px solid #d8f3dc' }}>
                <Plus className="w-4 h-4" /> Log this meal
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderOrderPanel(suggestion: Suggestion) {
    return (
      <div className="mt-2 rounded-2xl overflow-hidden" style={{ background: '#fff8f0', border: '1.5px solid #ffe0b2' }}>
        <div className="px-4 pt-3 pb-3">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#e65100' }}>Order it nearby</p>

          {!restaurants && !panelLoading && (
            <div className="space-y-3">
              <button onClick={() => requestGeolocation(suggestion)} disabled={locationMode === 'locating'}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #e65100, #ff9800)' }}>
                {locationMode === 'locating'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting location…</>
                  : <><MapPin className="w-4 h-4" /> Use my location</>}
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: '#ffe0b2' }} />
                <span className="text-xs font-semibold" style={{ color: '#b5a99a' }}>or</span>
                <div className="flex-1 h-px" style={{ background: '#ffe0b2' }} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onFocus={() => setLocationMode('typing')}
                  placeholder="Enter your neighbourhood or city"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'white', color: '#1a1a1a', border: '1.5px solid #ffe0b2' }}
                />
                <button onClick={() => findRestaurants(suggestion, location)} disabled={!location.trim() || panelLoading}
                  className="px-3 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #e65100, #ff9800)' }}>
                  Find
                </button>
              </div>
            </div>
          )}

          {panelLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#e65100' }} />
              <span className="text-sm" style={{ color: '#9c8e7e' }}>Finding restaurants near you…</span>
            </div>
          )}

          {panelError && (
            <div className="space-y-3">
              <p className="text-xs font-medium" style={{ color: '#e11d48' }}>{panelError}</p>
              <div className="flex gap-2">
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Enter your neighbourhood or city"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'white', color: '#1a1a1a', border: '1.5px solid #ffe0b2' }} />
                <button onClick={() => { setPanelError(''); findRestaurants(suggestion, location) }} disabled={!location.trim()}
                  className="px-3 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #e65100, #ff9800)' }}>
                  Find
                </button>
              </div>
            </div>
          )}

          {restaurants && (
            <div className="space-y-3">
              {restaurants.map((r, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #ffe0b2' }}>
                  <div className="px-3 pt-3 pb-2">
                    <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>{r.name}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#5a5246' }}>{r.reason}</p>
                  </div>
                  <div className="flex border-t" style={{ borderColor: '#ffe0b2' }}>
                    <a href={r.uberEatsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold"
                      style={{ color: '#06c167' }}>
                      <ExternalLink className="w-3 h-3" /> Uber Eats
                    </a>
                    <div style={{ width: '1px', background: '#ffe0b2' }} />
                    <a href={r.doorDashUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold"
                      style={{ color: '#ff3008' }}>
                      <ExternalLink className="w-3 h-3" /> DoorDash
                    </a>
                  </div>
                </div>
              ))}
              <button onClick={() => { setRestaurants(null); setPanelError(''); setLocation(''); setLocationMode('idle') }}
                className="w-full py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'white', color: '#9c8e7e', border: '1px solid #ffe0b2' }}>
                Search a different location
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
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

      {/* Cuisine chips */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CUISINE_CHIPS.map(c => {
            const active = prefs.cuisines.includes(c)
            return (
              <button key={c}
                onClick={() => setPrefs(prev => {
                  const updated = { ...prev, cuisines: active ? prev.cuisines.filter(x => x !== c) : [...prev.cuisines, c].slice(0, 10) }
                  savePrefs(updated); return updated
                })}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={active ? { background: '#004d1a', color: 'white', borderColor: '#004d1a' } : { background: 'white', color: '#9c8e7e', borderColor: '#e8e0d4' }}>
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f0faf4' }}>
              <Flame className="w-8 h-8" style={{ color: '#b9f6ca' }} />
            </div>
            <p className="font-bold" style={{ color: '#004d1a' }}>What are you craving?</p>
            <p className="text-sm mt-1 max-w-xs" style={{ color: '#9c8e7e' }}>
              Tap the mic or type — I&apos;ll find something that hits the spot without throwing you off.
            </p>
            <div className="mt-5 space-y-2 w-full max-w-xs">
              {[
                'I want something sweet but healthy 🍓',
                'High protein snack, under 200 calories',
                'Something filling — African vibes 🌍',
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

        {messages.map((m, mi) => (
          <div key={mi} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'w-full'}`}>
              {/* Bubble */}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={m.role === 'user'
                  ? { background: 'linear-gradient(135deg, #004d1a, #007a2e)', color: 'white' }
                  : { background: 'white', color: '#1a1a1a', boxShadow: '0 2px 8px rgba(26,61,43,0.08)' }}>
                {m.content}
              </div>

              {/* Suggestion cards */}
              {m.suggestions?.map((s, si) => {
                const isActivePanel = activePanel?.msgIndex === mi && activePanel?.suggIndex === si
                const isMake = isActivePanel && activePanel?.mode === 'make'
                const isOrder = isActivePanel && activePanel?.mode === 'order'

                return (
                  <div key={si} className="mt-2">
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
                      <div className="px-4 pt-3 pb-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm" style={{ color: '#1a1a1a' }}>{s.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f0faf4', color: '#007a2e' }}>{s.cuisine}</span>
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

                      {/* Action buttons */}
                      <div className="flex border-t" style={{ borderColor: '#f0faf4' }}>
                        <button onClick={() => openPanel(mi, si, 'make')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors"
                          style={isMake ? { background: '#004d1a', color: 'white' } : { background: '#f0faf4', color: '#007a2e' }}>
                          <ChefHat className="w-3.5 h-3.5" /> Make it
                        </button>
                        <div style={{ width: '1px', background: '#e8f5e9' }} />
                        <button onClick={() => openPanel(mi, si, 'order')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors"
                          style={isOrder ? { background: '#e65100', color: 'white' } : { background: '#fff8f0', color: '#e65100' }}>
                          <Bike className="w-3.5 h-3.5" /> Order it
                        </button>
                      </div>
                    </div>

                    {/* Expanded panels */}
                    {isMake && renderMakePanel(s)}
                    {isOrder && renderOrderPanel(s)}
                  </div>
                )
              })}
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
      <div className="flex-shrink-0 px-4 pt-3 pb-24 border-t" style={{ borderColor: '#e8e0d4', background: '#f5f5f0' }}>
        {isIosNonSafari && listening && (
          <div className="flex items-start gap-2 mb-2 px-3 py-2.5 rounded-xl" style={{ background: '#fff8f0', border: '1px solid #ffe0b2' }}>
            <Mic className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#e65100' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#e65100' }}>
              Voice input only works in <strong>Safari</strong> on iPhone. You can still type your craving below.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          {(speechSupported || isIosNonSafari) && (
            <button onClick={toggleVoice}
              className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
              style={listening ? { background: '#e11d48', boxShadow: '0 0 0 4px rgba(225,29,72,0.2)' } : { background: 'white', boxShadow: '0 2px 8px rgba(26,61,43,0.1)' }}>
              {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" style={{ color: '#007a2e' }} />}
            </button>
          )}
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={listening ? 'Listening…' : 'Tell me what you\'re craving…'}
            className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'white', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }} />
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

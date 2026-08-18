'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ArrowLeft, Check, Smartphone } from 'lucide-react'
import { Capacitor } from '@capacitor/core'

const PREFS_KEY = 'healthyyou-notification-prefs'
const REMINDER_BASE_ID = 1001
const MAX_REMINDERS = 8
const INTERVAL_OPTIONS = [2, 3, 4, 6, 8]
const DEFAULT_PREFS = { enabled: false, startTime: '08:00', intervalHours: 4 }

type Prefs = typeof DEFAULT_PREFS

function computeReminderTimes(startTime: string, intervalHours: number) {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const times: { hour: number; minute: number }[] = []
  let totalMinutes = startHour * 60 + startMinute
  for (let i = 0; i < MAX_REMINDERS && totalMinutes < 24 * 60; i++) {
    times.push({ hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 })
    totalMinutes += intervalHours * 60
  }
  return times
}

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}

export default function NotificationsPage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
    const stored = localStorage.getItem(PREFS_KEY)
    if (stored) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) })
      } catch {
        // Corrupted or outdated shape in localStorage — fall back to defaults
      }
    }
  }, [])

  const reminderTimes = useMemo(
    () => computeReminderTimes(prefs.startTime, prefs.intervalHours),
    [prefs.startTime, prefs.intervalHours]
  )

  const registerPushToken = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const perm = await PushNotifications.requestPermissions()
      if (perm.receive !== 'granted') return

      PushNotifications.addListener('registration', async ({ value: token }) => {
        try {
          await fetch('/api/push/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, platform: 'ios' }),
          })
        } catch {
          // Non-critical — local reminders still work without server push
        }
      })
      await PushNotifications.register()
    } catch {
      // Push registration is best-effort; local notifications remain unaffected
    }
  }, [])

  async function cancelReminders() {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({
      notifications: Array.from({ length: MAX_REMINDERS }, (_, i) => ({ id: REMINDER_BASE_ID + i })),
    })
  }

  async function scheduleReminders(startTime: string, intervalHours: number) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await cancelReminders()
    const times = computeReminderTimes(startTime, intervalHours)
    await LocalNotifications.schedule({
      notifications: times.map((t, i) => ({
        id: REMINDER_BASE_ID + i,
        title: 'FoodJournal',
        body: "Don't forget to log your meals today!",
        schedule: { on: { hour: t.hour, minute: t.minute }, repeats: true, allowWhileIdle: true },
      })),
    })
  }

  async function handleToggle(next: boolean) {
    setError('')
    if (!isNative) {
      setError('Notifications are only available in the FoodJournal app on your phone, not in the browser.')
      return
    }
    if (next) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display !== 'granted') {
        setError('Notification permission was denied. Enable it for FoodJournal in your phone\'s Settings app.')
        return
      }
      await scheduleReminders(prefs.startTime, prefs.intervalHours)
      await registerPushToken()
    } else {
      await cancelReminders()
    }
    setPrefs(p => ({ ...p, enabled: next }))
  }

  async function handleStartTimeChange(startTime: string) {
    setPrefs(p => ({ ...p, startTime }))
    if (prefs.enabled && isNative) await scheduleReminders(startTime, prefs.intervalHours)
  }

  async function handleIntervalChange(intervalHours: number) {
    setPrefs(p => ({ ...p, intervalHours }))
    if (prefs.enabled && isNative) await scheduleReminders(prefs.startTime, intervalHours)
  }

  function save() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden safe-area-pt"
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
            <Bell className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          </div>
          <p className="text-[#b9f6ca] text-sm mt-0.5">Reminders to log your meals</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3 pb-4">
        {!isNative && (
          <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <Smartphone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#c2410c' }} />
            <p className="text-xs" style={{ color: '#9a3412' }}>
              Notifications only work in the FoodJournal app installed on your phone — not in a web browser.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: prefs.enabled ? '1px solid #f5f0e8' : undefined }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0faf4' }}>
              <Bell className="w-4 h-4" style={{ color: '#00c853' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Meal reminders</p>
              <p className="text-xs" style={{ color: '#b5a99a' }}>Recurring nudges throughout the day</p>
            </div>
            <button
              onClick={() => handleToggle(!prefs.enabled)}
              className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
              style={{ background: prefs.enabled ? '#00c853' : '#e8e0d4' }}
              aria-label="Toggle meal reminders"
            >
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: prefs.enabled ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>

          {prefs.enabled && (
            <>
              <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
                <div className="w-9 h-9 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Start reminding me at</p>
                </div>
                <input
                  type="time" value={prefs.startTime}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm font-bold focus:outline-none"
                  style={{ background: '#f5f0e8', color: '#1a1a1a', border: '1.5px solid #e8e0d4' }}
                />
              </div>

              <div className="px-4 py-4" style={{ borderBottom: '1px solid #f5f0e8' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 flex-shrink-0" />
                  <p className="text-sm font-semibold flex-1" style={{ color: '#1a1a1a' }}>Every</p>
                </div>
                <div className="flex gap-2 flex-wrap pl-12">
                  {INTERVAL_OPTIONS.map(h => (
                    <button key={h} onClick={() => handleIntervalChange(h)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={prefs.intervalHours === h
                        ? { background: '#004d1a', color: 'white', borderColor: '#004d1a' }
                        : { background: 'white', color: '#9c8e7e', borderColor: '#e8e0d4' }}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4 pl-16">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#b5a99a' }}>
                  Reminders at
                </p>
                <p className="text-sm" style={{ color: '#5a5246' }}>
                  {reminderTimes.map(t => formatTime(t.hour, t.minute)).join(' · ')}
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-2xl px-4 py-3" style={{ background: '#fef2f2' }}>
            <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        <button onClick={save}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: saved ? '#00c853' : 'linear-gradient(135deg, #004d1a, #00c853)' }}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save'}
        </button>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function NotificationSetup() {
  const [state, setState] = useState<'idle' | 'prompt' | 'subscribed' | 'denied'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})

    const perm = Notification.permission
    if (perm === 'denied') { setState('denied'); return }
    if (perm === 'granted') {
      subscribeIfNeeded().then((ok) => setState(ok ? 'subscribed' : 'prompt'))
      return
    }
    // First time — show prompt after a short delay
    const t = setTimeout(() => setState('prompt'), 3000)
    return () => clearTimeout(t)
  }, [])

  async function subscribeIfNeeded(): Promise<boolean> {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        })
      } catch { return false }
    }
    const json = sub.toJSON()
    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
    })
    return true
  }

  async function enable() {
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      await subscribeIfNeeded()
      setState('subscribed')
    } else {
      setState('denied')
    }
  }

  if (state !== 'prompt') return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border-2 border-indigo-300"
      style={{ background: '#EEF2FF' }}>
      <span className="text-2xl flex-shrink-0">🔔</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-indigo-900">Enable reminders?</div>
        <div className="text-xs text-indigo-700 font-semibold">Grocery &amp; schedule alerts</div>
      </div>
      <button onClick={enable}
        className="px-4 py-2 rounded-xl text-sm font-black text-white border-2 border-indigo-600 flex-shrink-0"
        style={{ background: '#4F46E5' }}>
        Yes!
      </button>
      <button onClick={() => setState('idle')}
        className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 font-black text-lg flex items-center justify-center flex-shrink-0">
        ×
      </button>
    </div>
  )
}

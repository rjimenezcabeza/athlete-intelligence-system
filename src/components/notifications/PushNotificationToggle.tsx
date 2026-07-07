'use client'

import { useState, useEffect } from 'react'

interface PushNotificationToggleProps {
  language?: string
}

export function PushNotificationToggle({ language = 'es' }: PushNotificationToggleProps) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const t = {
    title: language === 'en' ? 'Push Notifications' : 'Notificaciones Push',
    description: language === 'en'
      ? 'Get notified about progression and insights'
      : 'Recibe avisos de progresión e insights',
    enable: language === 'en' ? 'Enable' : 'Activar',
    disable: language === 'en' ? 'Disable' : 'Desactivar',
    not_supported: language === 'en' ? 'Not supported in this browser' : 'No soportado en este navegador',
  }

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  const togglePush = async () => {
    if (loading) return
    setLoading(true)

    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        setSubscribed(false)
      } else {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey)

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as unknown as BufferSource
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() })
        })

        setSubscribed(true)
      }
    } catch (err) {
      console.error('Push toggle error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-white/60 text-sm">{t.title}</p>
          <p className="text-white/30 text-xs">{t.not_supported}</p>
        </div>
        <div className="w-10 h-5 rounded-full bg-white/10" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-white text-sm">{t.title}</p>
        <p className="text-white/40 text-xs">{t.description}</p>
      </div>
      <button
        onClick={togglePush}
        disabled={loading}
        className={`w-10 h-5 rounded-full transition-all duration-200 relative ${
          subscribed ? 'bg-[#C8FF00]' : 'bg-white/20'
        } disabled:opacity-50`}
        aria-label={subscribed ? t.disable : t.enable}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
          subscribed ? 'left-5' : 'left-0.5'
        }`} />
      </button>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

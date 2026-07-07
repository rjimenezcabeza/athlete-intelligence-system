'use client'

import { useParams } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'

const PRO_FEATURES = [
  { es: 'Sesiones ilimitadas', en: 'Unlimited sessions' },
  { es: 'Importaciones ilimitadas (foto, PDF, Excel)', en: 'Unlimited imports (photo, PDF, Excel)' },
  { es: 'Progresion automatica con IA', en: 'AI auto-progression' },
  { es: 'AI Coach con historial real', en: 'AI Coach with real history' },
  { es: 'Patrones avanzados del Athlete Memory Engine', en: 'Advanced Athlete Memory Engine patterns' },
  { es: 'Wearables (Strava, Garmin, Polar)', en: 'Wearables (Strava, Garmin, Polar)' },
  { es: 'Soporte prioritario', en: 'Priority support' },
]

const FREE_LIMITS = [
  { es: '30 sesiones/mes', en: '30 sessions/month' },
  { es: '3 importaciones/mes', en: '3 imports/month' },
  { es: 'Progresion manual', en: 'Manual progression' },
  { es: 'Sin AI Coach', en: 'No AI Coach' },
]

export default function UpgradePage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const { startCheckout, loading, error } = useSubscription(locale)

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0A0A0F' }}>
      <div className="px-4 pt-8 pb-6">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#C8FF00' }}>
          AIS Pro
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Desbloquea el sistema completo' : 'Unlock the full system'}
        </h1>
        <p className="text-sm" style={{ color: '#666' }}>
          {isEs
            ? 'Todo lo que necesitas para optimizar tu hipertrofia con IA'
            : 'Everything you need to optimize hypertrophy with AI'}
        </p>
      </div>

      <div className="px-4 space-y-4">
        <div className="rounded-2xl p-6" style={{ background: '#111118', border: '1px solid #C8FF0033' }}>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-bold" style={{ color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>
              14.99
            </span>
            <span className="text-lg mb-1" style={{ color: '#888' }}>EUR/mes</span>
          </div>
          <p className="text-xs" style={{ color: '#555' }}>
            {isEs ? 'Cancela cuando quieras. Sin permanencia.' : 'Cancel anytime. No commitment.'}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555' }}>
            {isEs ? 'Todo incluido en Pro' : 'Everything included in Pro'}
          </p>
          <div className="space-y-3">
            {PRO_FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: '#C8FF0022', color: '#C8FF00' }}>
                  v
                </div>
                <span className="text-sm" style={{ color: '#ddd' }}>{isEs ? f.es : f.en}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555' }}>
            {isEs ? 'Plan Free actual' : 'Current Free plan'}
          </p>
          <div className="space-y-2">
            {FREE_LIMITS.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: '#FF6B6B22', color: '#FF6B6B' }}>
                  x
                </div>
                <span className="text-sm" style={{ color: '#666' }}>{isEs ? f.es : f.en}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={startCheckout}
          disabled={loading}
          className="w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#C8FF00', color: '#0A0A0F', fontFamily: 'Syne, sans-serif' }}
        >
          {loading
            ? (isEs ? 'Redirigiendo...' : 'Redirecting...')
            : (isEs ? 'Activar Pro - 14.99 EUR/mes' : 'Activate Pro - EUR 14.99/month')}
        </button>

        {error && <p className="text-sm text-center" style={{ color: '#FF6B6B' }}>{error}</p>}

        <p className="text-xs text-center" style={{ color: '#444' }}>
          {isEs
            ? 'Pago seguro via Stripe. Cancela en cualquier momento.'
            : 'Secure payment via Stripe. Cancel anytime.'}
        </p>
      </div>
    </div>
  )
}

'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

interface Props { locale?: string }

export function PushNotificationToggle({ locale = 'es' }: Props) {
  const { supported, subscribed, loading, permission, subscribe, unsubscribe } = usePushNotifications()
  const isEs = locale === 'es'

  const title = isEs ? 'Notificaciones Push' : 'Push Notifications'
  const desc = isEs ? 'Recordatorios de entrenamiento y alertas del Coach' : 'Training reminders and Coach alerts'
  const noSupport = isEs ? 'Tu navegador no soporta notificaciones push' : "Your browser doesn't support push notifications"
  const denied = isEs ? 'Permisos denegados. Habilita en ajustes del navegador.' : 'Permission denied. Enable in browser settings.'
  const enableLabel = isEs ? 'Activar' : 'Enable'
  const disableLabel = isEs ? 'Desactivar' : 'Disable'

  if (!supported) {
    return (
      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
        <span style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{noSupport}</span>
      </div>
    )
  }

  return (
    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd', fontFamily: 'DM Mono, monospace', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '11px', color: '#555' }}>{permission === 'denied' ? denied : desc}</div>
      </div>
      {permission !== 'denied' && (
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          style={{
            padding: '7px 13px',
            background: subscribed ? 'rgba(255,82,82,0.1)' : 'rgba(200,255,0,0.1)',
            border: `1px solid ${subscribed ? 'rgba(255,82,82,0.25)' : 'rgba(200,255,0,0.25)'}`,
            borderRadius: '8px',
            color: subscribed ? '#FF5252' : '#C8FF00',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Mono, monospace',
            opacity: loading ? 0.5 : 1,
            flexShrink: 0
          }}
        >
          {loading ? '...' : subscribed ? disableLabel : enableLabel}
        </button>
      )}
    </div>
  )
}

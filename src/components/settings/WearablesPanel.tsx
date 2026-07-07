'use client'

import { useState, useEffect } from 'react'

interface WearableStatus {
  available: boolean
  connected: boolean
  lastSync: string | null
  syncError: string | null
  providerData?: any
  setupUrl?: string | null
}

interface WearablesData {
  strava: WearableStatus
  garmin: WearableStatus
  polar: WearableStatus
}

const WEARABLE_META = {
  strava: {
    name: 'Strava',
    icon: 'S',
    color: '#FC4C02',
    description_es: 'Sincroniza actividades, frecuencia cardiaca y esfuerzo percibido',
    description_en: 'Sync activities, heart rate and perceived effort',
    connectPath: '/api/wearables/strava/connect'
  },
  garmin: {
    name: 'Garmin',
    icon: 'G',
    color: '#009BDE',
    description_es: 'Body Battery, HRV y metricas de recuperacion avanzadas',
    description_en: 'Body Battery, HRV and advanced recovery metrics',
    connectPath: '/api/wearables/garmin/connect'
  },
  polar: {
    name: 'Polar',
    icon: 'P',
    color: '#D5001C',
    description_es: 'Carga de entrenamiento y estado de recuperacion',
    description_en: 'Training load and recovery status',
    connectPath: '/api/wearables/polar/connect'
  }
}

interface Props {
  locale?: string
}

export function WearablesPanel({ locale = 'es' }: Props) {
  const [data, setData] = useState<WearablesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const isEs = locale === 'es'

  useEffect(() => {
    fetch('/api/wearables/status')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async (provider: string) => {
    setSyncing(provider)
    try {
      await fetch(`/api/wearables/${provider}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })
      const updated = await fetch('/api/wearables/status').then(r => r.json())
      setData(updated)
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (provider: string) => {
    if (!confirm(isEs ? `¿Desconectar ${provider}?` : `Disconnect ${provider}?`)) return
    setDisconnecting(provider)
    try {
      await fetch('/api/wearables/status', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })
      const updated = await fetch('/api/wearables/status').then(r => r.json())
      setData(updated)
    } finally {
      setDisconnecting(null)
    }
  }

  const connectLabel = isEs ? 'Conectar' : 'Connect'
  const connectedLabel = isEs ? 'Conectado' : 'Connected'
  const syncLabel = isEs ? 'Sincronizar' : 'Sync'
  const disconnectLabel = isEs ? 'Desconectar' : 'Disconnect'
  const lastSyncLabel = isEs ? 'Ultima sync' : 'Last sync'
  const pendingLabel = isEs ? 'Pendiente' : 'Pending setup'
  const comingSoonLabel = isEs ? 'Proximo' : 'Coming soon'

  if (loading) {
    return (
      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
        <div style={{ height: '14px', width: '80px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '16px' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ddd', fontFamily: 'Syne, sans-serif', marginBottom: '3px' }}>
          {isEs ? 'Wearables' : 'Wearables'}
        </div>
        <div style={{ fontSize: '11px', color: '#555' }}>
          {isEs
            ? 'Conecta tus dispositivos para datos de recuperacion en el Coach'
            : 'Connect your devices for recovery data in Coach'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(Object.entries(WEARABLE_META) as [keyof WearablesData, typeof WEARABLE_META.strava][]).map(([key, meta]) => {
          const status = data?.[key]
          const isConnected = status?.connected || false
          const isAvailable = status?.available !== false
          const isPolar = key === 'polar'

          return (
            <div
              key={key}
              style={{
                padding: '12px 14px',
                background: isConnected ? `${meta.color}08` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isConnected ? `${meta.color}25` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                opacity: isPolar ? 0.5 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '800', color: meta.color,
                  fontFamily: 'DM Mono, monospace', flexShrink: 0
                }}>
                  {meta.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#ddd', fontFamily: 'DM Mono, monospace' }}>{meta.name}</span>
                    {isConnected && (
                      <span style={{ fontSize: '9px', color: meta.color, fontFamily: 'DM Mono, monospace', padding: '1px 5px', background: `${meta.color}15`, borderRadius: '4px' }}>
                        {connectedLabel}
                      </span>
                    )}
                    {isPolar && (
                      <span style={{ fontSize: '9px', color: '#555', fontFamily: 'DM Mono, monospace', padding: '1px 5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        {comingSoonLabel}
                      </span>
                    )}
                    {!isPolar && !isAvailable && (
                      <span style={{ fontSize: '9px', color: '#FF9800', fontFamily: 'DM Mono, monospace', padding: '1px 5px', background: 'rgba(255,152,0,0.1)', borderRadius: '4px' }}>
                        {pendingLabel}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isConnected && status?.lastSync
                      ? `${lastSyncLabel}: ${new Date(status.lastSync).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : isEs ? meta.description_es : meta.description_en}
                  </div>
                  {status?.syncError && (
                    <div style={{ fontSize: '10px', color: '#FF5252', marginTop: '2px' }}>
                      Error: {status.syncError}
                    </div>
                  )}
                </div>
              </div>

              {!isPolar && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(key)}
                        disabled={syncing === key}
                        style={{
                          padding: '6px 10px', background: `${meta.color}15`,
                          border: `1px solid ${meta.color}30`, borderRadius: '6px',
                          color: meta.color, fontSize: '11px',
                          cursor: syncing === key ? 'not-allowed' : 'pointer',
                          fontFamily: 'DM Mono, monospace', opacity: syncing === key ? 0.5 : 1
                        }}
                      >
                        {syncing === key ? '...' : syncLabel}
                      </button>
                      <button
                        onClick={() => handleDisconnect(key)}
                        disabled={disconnecting === key}
                        style={{
                          padding: '6px 10px', background: 'rgba(255,82,82,0.1)',
                          border: '1px solid rgba(255,82,82,0.2)', borderRadius: '6px',
                          color: '#FF5252', fontSize: '11px',
                          cursor: disconnecting === key ? 'not-allowed' : 'pointer',
                          fontFamily: 'DM Mono, monospace', opacity: disconnecting === key ? 0.5 : 1
                        }}
                      >
                        {disconnecting === key ? '...' : disconnectLabel}
                      </button>
                    </>
                  ) : (
                    <a
                      href={isAvailable ? meta.connectPath : (status?.setupUrl || '#')}
                      style={{
                        padding: '7px 12px',
                        background: isAvailable ? `${meta.color}15` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isAvailable ? `${meta.color}30` : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '6px',
                        color: isAvailable ? meta.color : '#666',
                        fontSize: '11px', textDecoration: 'none',
                        fontFamily: 'DM Mono, monospace', display: 'inline-block'
                      }}
                      target={!isAvailable ? '_blank' : undefined}
                      rel={!isAvailable ? 'noopener noreferrer' : undefined}
                    >
                      {isAvailable ? connectLabel : (isEs ? 'Configurar' : 'Setup')}
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: '12px', padding: '10px 12px',
        background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.1)',
        borderRadius: '8px', fontSize: '11px', color: '#666', lineHeight: '1.5'
      }}>
        {isEs
          ? 'Con wearables conectados, el AI Coach incluye tu frecuencia cardiaca, estado de recuperacion y carga de entrenamiento en sus analisis.'
          : 'With wearables connected, the AI Coach includes your heart rate, recovery status and training load in its analysis.'}
      </div>
    </div>
  )
}

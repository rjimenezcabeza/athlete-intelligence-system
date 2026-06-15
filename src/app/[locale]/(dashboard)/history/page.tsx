'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SessionRow {
  id: string
  session_date: string
  duration_minutes: number | null
  pump_rating: number | null
  local_fatigue: number | null
  perceived_recovery: number | null
  status: string
}

export default function HistoryPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: profile } = await (supabase as any).from('athlete_profiles').select('id').single()
      if (!profile) { setLoading(false); return }
      const { data } = await (supabase as any)
        .from('training_sessions')
        .select('id, session_date, duration_minutes, pump_rating, local_fatigue, perceived_recovery, status')
        .eq('athlete_id', profile.id)
        .order('session_date', { ascending: false })
        .limit(50)
      setSessions(data || [])
      setLoading(false)
    })()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C8FF00', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0A0A0F' }}>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Historial' : 'History'}
        </h1>
        <p className="text-sm" style={{ color: '#555' }}>{sessions.length} {isEs ? 'sesiones' : 'sessions'}</p>
      </div>

      {sessions.length === 0 ? (
        <div className="px-4">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
            <p className="font-bold mb-1" style={{ color: '#fff' }}>{isEs ? 'Sin sesiones todavia' : 'No sessions yet'}</p>
            <p className="text-sm mb-4" style={{ color: '#666' }}>{isEs ? 'Completa tu primer entrenamiento' : 'Complete your first workout'}</p>
            <Link href={`/${locale}/session/new`} className="inline-block px-6 py-3 rounded-xl font-bold" style={{ background: '#C8FF00', color: '#0A0A0F' }}>
              {isEs ? 'Entrenar' : 'Train'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {sessions.map(s => {
            const date = new Date(s.session_date)
            const label = date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
            return (
              <Link key={s.id} href={`/${locale}/session/${s.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
                <div className="flex-1">
                  <p className="font-medium capitalize" style={{ color: '#ddd' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {s.duration_minutes ? `${s.duration_minutes}min` : '-'}
                    {s.status === 'feedback_pending' ? (isEs ? ' · Feedback pendiente' : ' · Feedback pending') : ''}
                  </p>
                </div>
                <div className="flex gap-2 text-xs" style={{ fontFamily: 'DM Mono, monospace' }}>
                  {s.pump_rating && <span style={{ color: '#C8FF00' }}>{s.pump_rating}</span>}
                  {s.local_fatigue && <span style={{ color: '#FF6B6B' }}>{s.local_fatigue}</span>}
                  {s.perceived_recovery && <span style={{ color: '#4ECDC4' }}>{s.perceived_recovery}</span>}
                </div>
                <span style={{ color: '#333' }}>{'>'}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

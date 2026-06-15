'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await (supabase as any)
        .from('athlete_profiles')
        .select('display_name, primary_goal, training_experience_years, body_weight_kg, subscription_tier')
        .single()
      setProfile(data)
    })()
  }, [])

  const handleLogout = async () => {
    await (supabase as any).auth.signOut()
    router.push(`/${locale}/login`)
  }

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C8FF00', borderTopColor: 'transparent' }} />
    </div>
  )

  const rows = [
    { label: isEs ? 'Objetivo' : 'Goal', value: profile.primary_goal ?? '-' },
    { label: isEs ? 'Experiencia' : 'Experience', value: profile.training_experience_years ? `${profile.training_experience_years} ${isEs ? 'anos' : 'years'}` : '-' },
    { label: isEs ? 'Peso corporal' : 'Body weight', value: profile.body_weight_kg ? `${profile.body_weight_kg}kg` : '-' },
    { label: 'Plan', value: profile.subscription_tier.toUpperCase() },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0A0A0F' }}>
      <div className="px-4 pt-8 pb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4" style={{ background: '#C8FF00', color: '#0A0A0F' }}>
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>{profile.display_name}</h1>
      </div>

      <div className="px-4 space-y-3">
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a1a2e' }}>
          {rows.map((r, i) => (
            <div key={r.label} className="flex justify-between px-4 py-3" style={{ background: '#111118', borderTop: i > 0 ? '1px solid #1a1a2e' : 'none' }}>
              <span className="text-sm" style={{ color: '#666' }}>{r.label}</span>
              <span className="text-sm font-medium" style={{ color: '#ddd' }}>{r.value}</span>
            </div>
          ))}
        </div>

        {profile.subscription_tier === 'free' && (
          <div className="rounded-2xl p-4" style={{ background: '#1a2a00', border: '1px solid #C8FF0033' }}>
            <p className="font-bold mb-1" style={{ color: '#C8FF00' }}>{isEs ? 'Actualiza a Pro' : 'Upgrade to Pro'}</p>
            <p className="text-xs mb-3" style={{ color: '#888' }}>{isEs ? 'AI Coach, progresion automatica, sin limites' : 'AI Coach, auto progression, unlimited'}</p>
            <button className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: '#C8FF00', color: '#0A0A0F' }}>
              {isEs ? 'Ver planes' : 'See plans'} — E14.99/mes
            </button>
          </div>
        )}

        <button onClick={handleLogout} className="w-full py-3 rounded-xl text-sm" style={{ background: '#111118', color: '#FF6B6B', border: '1px solid #FF6B6B33' }}>
          {isEs ? 'Cerrar sesion' : 'Log out'}
        </button>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle'
import { WearablesPanel } from '@/components/settings/WearablesPanel'
import { useTheme } from '@/components/providers/ThemeProvider'

const BG = '#0A0A0F'
const CARD = 'rgba(255,255,255,0.03)'
const BORDER = 'rgba(255,255,255,0.07)'
const T1 = '#ddd'
const T2 = '#888'
const T3 = '#444'

type View = 'main' | 'settings' | 'account'

const GOALS = [
  { key: 'hypertrophy', es: 'Hipertrofia', en: 'Hypertrophy' },
  { key: 'strength',    es: 'Fuerza',       en: 'Strength'     },
  { key: 'recomp',     es: 'Recomposición', en: 'Recomp'       },
  { key: 'cut',        es: 'Definición',    en: 'Cut'          },
]
const EXP = [
  { key: 1, es: '< 1 año',  en: '< 1 yr'  },
  { key: 2, es: '1-2 años', en: '1-2 yr'  },
  { key: 4, es: '2-4 años', en: '2-4 yr'  },
  { key: 7, es: '4+ años',  en: '4+ yr'   },
]
const LANGUAGES = [
  { key: 'es', label: 'Español' }, { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' }, { key: 'de', label: 'Deutsch' },
  { key: 'it', label: 'Italiano' }, { key: 'nl', label: 'Nederlands' },
]
const ACCENT_COLORS = [
  { color: '#C8FF00', name: 'Lime' },
  { color: '#00D4FF', name: 'Cyan' },
  { color: '#FF6B35', name: 'Orange' },
  { color: '#A855F7', name: 'Purple' },
  { color: '#EC4899', name: 'Pink' },
  { color: '#10B981', name: 'Emerald' },
  { color: '#F59E0B', name: 'Amber' },
  { color: '#EF4444', name: 'Red' },
]
const THEMES = [
  { value: 'dark',      label: 'Dark',        bg: '#0A0A0F', preview: '#1a1a24' },
  { value: 'dark_soft', label: 'Soft dark',   bg: '#111318', preview: '#1c2030' },
  { value: 'midnight',  label: 'Midnight',    bg: '#080C14', preview: '#0f1624' },
  { value: 'forest',    label: 'Forest',      bg: '#0A0F0A', preview: '#111a11' },
  { value: 'ocean',     label: 'Ocean',       bg: '#090D14', preview: '#0f1520' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, margin: '0 0 10px' }}>
      {children}
    </p>
  )
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: `1px solid ${BORDER}` }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: T2, cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 0 }}>‹</button>
      <span style={{ fontSize: 16, fontWeight: 700, color: T1, fontFamily: 'Syne, sans-serif' }}>{title}</span>
    </div>
  )
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const acc = '#C8FF00'
  return (
    <button onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? acc : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 3, left: enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const { accentColor, setAccentColor, uiTheme, setUiTheme } = useTheme()

  const [view, setView] = useState<View>('main')
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingField, setSavingField] = useState(false)

  const [dailyForm, setDailyForm] = useState({ weight: '', energy: 0, sleep: '', stress: 0, notes: '' })
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [savingDaily, setSavingDaily] = useState(false)
  const [dailyMsg, setDailyMsg] = useState<string | null>(null)

  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)

  const updateProfile = useCallback(async (updates: Record<string, any>) => {
    setProfile((p: any) => ({ ...p, ...updates }))
    await fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {})
  }, [])

  const saveField = async (field: string, value: any) => {
    setSavingField(true)
    await updateProfile({ [field]: value })
    setSavingField(false)
    setEditingField(null)
  }

  useEffect(() => {
    fetch('/api/profile/me').then(r => r.json()).then(d => {
      if (d.profile) setProfile(d.profile)
    })
    fetch('/api/dashboard/summary').then(r => r.json()).then(d => setStats(d.stats))
    fetch('/api/daily-log').then(r => r.json()).then(d => setDailyLogs(d.logs ?? []))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${locale}/login`)
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'ELIMINAR') return
    setDeleting(true)
    try {
      const res = await fetch('/api/profile/me', { method: 'DELETE' })
      if (res.ok) {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push(`/${locale}/login`)
      }
    } catch {} finally { setDeleting(false) }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const signedRes = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      })
      if (!signedRes.ok) return
      const { signedUrl, publicUrl } = await signedRes.json()
      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      })
      await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl })
      })
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }))
    } catch {}
  }

  const handleDailySave = async () => {
    setSavingDaily(true); setDailyMsg(null)
    try {
      const res = await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: dailyForm.weight || null,
          energy: dailyForm.energy || null,
          sleep: dailyForm.sleep || null,
          stress: dailyForm.stress || null,
          notes: dailyForm.notes || null,
        })
      })
      if (res.ok) {
        setDailyMsg(isEs ? 'Registrado ✓' : 'Logged ✓')
        const d = await fetch('/api/daily-log').then(r => r.json())
        setDailyLogs(d.logs ?? [])
        setDailyForm({ weight: '', energy: 0, sleep: '', stress: 0, notes: '' })
        setTimeout(() => setDailyMsg(null), 3000)
      }
    } catch {}
    setSavingDaily(false)
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${accentColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const isPro = profile.subscription_tier === 'pro'

  /* ─── VIEW: SETTINGS ─── */
  if (view === 'settings') return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <BackHeader title={isEs ? 'Ajustes' : 'Settings'} onBack={() => setView('main')} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Idioma */}
        <div>
          <SectionLabel>{isEs ? 'Idioma' : 'Language'}</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LANGUAGES.map(l => (
              <button key={l.key}
                onClick={async () => {
                  await updateProfile({ language: l.key })
                  window.location.href = `/${l.key}/profile`
                }}
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: locale === l.key ? `${accentColor}15` : CARD, color: locale === l.key ? accentColor : T2, border: `1px solid ${locale === l.key ? accentColor + '40' : BORDER}`, fontFamily: 'DM Mono, monospace', transition: 'all 0.15s' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unidad de peso */}
        <div>
          <SectionLabel>{isEs ? 'Unidad de peso' : 'Weight unit'}</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {['kg', 'lbs'].map(unit => (
              <button key={unit}
                onClick={() => updateProfile({ weight_unit: unit })}
                style={{ padding: '8px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: (profile.weight_unit || 'kg') === unit ? `${accentColor}15` : CARD, color: (profile.weight_unit || 'kg') === unit ? accentColor : T2, border: `1px solid ${(profile.weight_unit || 'kg') === unit ? accentColor + '40' : BORDER}`, fontFamily: 'DM Mono, monospace', fontWeight: 700, transition: 'all 0.15s' }}>
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Color de acento */}
        <div>
          <SectionLabel>{isEs ? 'Color de acento' : 'Accent color'}</SectionLabel>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ACCENT_COLORS.map(({ color, name }) => (
              <button key={color} onClick={() => setAccentColor(color)} title={name}
                style={{ width: 36, height: 36, borderRadius: '50%', background: color, border: accentColor === color ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer', outline: 'none', boxShadow: accentColor === color ? `0 0 0 2px ${color}40` : 'none', transition: 'all 0.2s' }} />
            ))}
          </div>
        </div>

        {/* Tema */}
        <div>
          <SectionLabel>{isEs ? 'Tema base' : 'Base theme'}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {THEMES.map(theme => (
              <button key={theme.value} onClick={() => setUiTheme(theme.value)}
                style={{ padding: 10, background: theme.bg, border: `1px solid ${uiTheme === theme.value ? accentColor : BORDER}`, borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s' }}>
                <div style={{ width: '100%', height: 16, borderRadius: 4, background: theme.preview }} />
                <span style={{ fontSize: 11, color: uiTheme === theme.value ? accentColor : T3, fontFamily: 'DM Mono, monospace' }}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notificaciones */}
        <div>
          <SectionLabel>{isEs ? 'Notificaciones' : 'Notifications'}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'notification_workout_reminders', es: 'Recordatorios entrenamiento', en: 'Workout reminders' },
              { key: 'notification_progression_alerts', es: 'Alertas de progresión', en: 'Progression alerts' },
              { key: 'notification_coach_insights', es: 'Insights del Coach', en: 'Coach insights' },
              { key: 'notification_weekly_summary', es: 'Resumen semanal', en: 'Weekly summary' },
            ].map(notif => {
              const enabled = (profile as any)?.[notif.key] !== false
              return (
                <div key={notif.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: T1, fontFamily: 'DM Mono, monospace' }}>{isEs ? notif.es : notif.en}</span>
                  <Toggle enabled={enabled} onToggle={() => updateProfile({ [notif.key]: !enabled })} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Push + Wearables */}
        <div>
          <SectionLabel>{isEs ? 'Notificaciones push' : 'Push notifications'}</SectionLabel>
          <PushNotificationToggle locale={locale} />
        </div>

        <div>
          <SectionLabel>Wearables</SectionLabel>
          <WearablesPanel locale={locale} />
        </div>

        {/* Version */}
        <div style={{ padding: '10px 14px', background: CARD, borderRadius: 8, fontSize: 11, color: T3, fontFamily: 'DM Mono, monospace', display: 'flex', justifyContent: 'space-between' }}>
          <span>AIS v1.0.0</span>
          <span>Sprints A–O</span>
        </div>
      </div>
    </div>
  )

  /* ─── VIEW: ACCOUNT ─── */
  if (view === 'account') return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <BackHeader title={isEs ? 'Cuenta' : 'Account'} onBack={() => setView('main')} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Plan */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: T2 }}>{isEs ? 'Plan actual' : 'Current plan'}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: isPro ? accentColor : T2, fontFamily: 'Syne, sans-serif' }}>{isPro ? 'Pro' : 'Free'}</span>
        </div>

        {/* Upgrade CTA */}
        {!isPro && (
          <a href={`/${locale}/upgrade`} style={{ display: 'block', background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: 14, padding: '14px 16px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: accentColor, fontSize: 14 }}>
                  {isEs ? 'Actualizar a Pro' : 'Upgrade to Pro'}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: T2 }}>
                  {isEs ? 'AI Coach, progresión automática, sin límites' : 'AI Coach, auto progression, unlimited'}
                </p>
              </div>
              <span style={{ color: accentColor, fontSize: 20 }}>›</span>
            </div>
          </a>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          style={{ width: '100%', background: CARD, color: T1, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 15, fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
          {isEs ? 'Cerrar sesión' : 'Log out'}
        </button>

        {/* Danger zone */}
        <div style={{ background: 'rgba(255,107,107,0.04)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 14, padding: '16px' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FF6B6B', marginBottom: 8 }}>
            {isEs ? 'Zona de peligro' : 'Danger zone'}
          </p>
          <p style={{ fontSize: 12, color: T3, marginBottom: 12 }}>
            {isEs ? 'Acción irreversible. Se eliminan todos tus datos.' : 'Irreversible. All your data will be deleted.'}
          </p>
          <button onClick={() => setShowDelete(true)}
            style={{ background: 'transparent', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
            {isEs ? 'Eliminar cuenta' : 'Delete account'}
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div onClick={() => !deleting && setShowDelete(false)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111118', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 20, padding: '28px 24px', maxWidth: 320, width: '100%' }}>
            <p style={{ fontSize: 18, margin: '0 0 10px' }}>⚠️</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#FF6B6B', margin: '0 0 8px' }}>
              {isEs ? '¿Eliminar cuenta?' : 'Delete account?'}
            </p>
            <p style={{ fontSize: 13, color: T2, margin: '0 0 18px', lineHeight: 1.5 }}>
              {isEs ? 'Escribe ELIMINAR para confirmar.' : 'Type DELETE to confirm.'}
            </p>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
              placeholder={isEs ? 'ELIMINAR' : 'DELETE'}
              style={{ width: '100%', background: '#0d0d14', border: `1.5px solid ${deleteInput === 'ELIMINAR' ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: T1, fontSize: 15, padding: '12px 14px', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowDelete(false); setDeleteInput('') }} style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#1a1a2e', color: T2, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteInput !== 'ELIMINAR' || deleting}
                style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: deleteInput === 'ELIMINAR' ? 'rgba(255,107,107,0.2)' : '#1a1a2e', color: deleteInput === 'ELIMINAR' ? '#FF6B6B' : T3, border: `1px solid ${deleteInput === 'ELIMINAR' ? 'rgba(255,107,107,0.4)' : 'transparent'}`, cursor: deleteInput === 'ELIMINAR' ? 'pointer' : 'not-allowed', fontFamily: 'Syne, sans-serif', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? '...' : (isEs ? 'Eliminar' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  /* ─── VIEW: MAIN ─── */
  const cal = profile.nutrition_calories_target || 0
  const prot = profile.nutrition_protein_g || 0
  const carbs = profile.nutrition_carbs_g || 0
  const fat = profile.nutrition_fat_g || 0
  const protKcal = prot * 4, carbKcal = carbs * 4, fatKcal = fat * 9
  const totalKcal = protKcal + carbKcal + fatKcal || 1

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

      {/* ── HERO ── */}
      <div style={{ padding: '32px 20px 20px', background: `linear-gradient(180deg, ${accentColor}08 0%, transparent 100%)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
          <div onClick={() => avatarInputRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: 20, background: profile.avatar_url ? 'transparent' : `${accentColor}15`, border: `1.5px solid ${accentColor}25`, overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: accentColor, fontFamily: 'Syne, sans-serif' }}>
                  {profile.display_name?.[0]?.toUpperCase() || 'A'}
                </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.3px' }}>
              {profile.display_name || 'Atleta'}
            </h1>
            <div style={{ fontSize: 12, color: T3, fontFamily: 'DM Mono, monospace', marginTop: 3 }}>
              {profile.primary_goal || 'hypertrophy'} · {profile.training_experience_years || '?'} {isEs ? 'años' : 'yr'}{profile.training_split_detected ? ` · ${profile.training_split_detected}` : ''}
            </div>
          </div>
          {isPro && (
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40`, flexShrink: 0 }}>PRO</span>
          )}
        </div>

        {/* Stats rápidas */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: isEs ? 'Sesiones' : 'Sessions', value: stats.totalSessions ?? 0 },
              { label: isEs ? 'Racha' : 'Streak', value: `${stats.streak ?? 0}d` },
              { label: isEs ? 'Esta semana' : 'This week', value: stats.weekSessions ?? stats.weeklyVolume ?? 0 },
            ].map(k => (
              <div key={k.label} style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}15`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, color: '#fff' }}>{k.value}</div>
                <div style={{ fontSize: 9, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Métricas editables ── */}
        <div>
          <SectionLabel>{isEs ? 'Métricas' : 'Metrics'}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { field: 'body_weight_kg', label: isEs ? 'Peso' : 'Weight', value: profile.body_weight_kg ? `${profile.body_weight_kg} ${profile.weight_unit || 'kg'}` : '—', type: 'number', placeholder: '80' },
              { field: 'height_cm', label: isEs ? 'Altura' : 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : '—', type: 'number', placeholder: '175' },
              { field: 'training_experience_years', label: isEs ? 'Experiencia' : 'Experience', value: profile.training_experience_years ? `${profile.training_experience_years} ${isEs ? 'años' : 'yr'}` : '—', type: 'number', placeholder: '2' },
              { field: 'primary_goal', label: isEs ? 'Objetivo' : 'Goal', value: GOALS.find(g => g.key === profile.primary_goal)?.[isEs ? 'es' : 'en'] ?? profile.primary_goal ?? '—', type: 'select', placeholder: '' },
            ].map(m => (
              <div key={m.field}
                onClick={() => { if (editingField !== m.field) { setEditingField(m.field); setEditValue(profile[m.field] ?? '') } }}
                style={{ background: CARD, border: `1px solid ${editingField === m.field ? accentColor + '50' : BORDER}`, borderRadius: 14, padding: '14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 9, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>{m.label}</div>
                {editingField === m.field ? (
                  m.type === 'select' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {GOALS.map(g => (
                        <button key={g.key}
                          onClick={e => { e.stopPropagation(); saveField('primary_goal', g.key) }}
                          style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', background: profile.primary_goal === g.key ? `${accentColor}20` : 'transparent', color: profile.primary_goal === g.key ? accentColor : T2, border: `1px solid ${profile.primary_goal === g.key ? accentColor + '40' : 'transparent'}`, textAlign: 'left', fontFamily: 'DM Mono, monospace' }}>
                          {isEs ? g.es : g.en}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      autoFocus type={m.type} value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveField(m.field, editValue); if (e.key === 'Escape') setEditingField(null) }}
                      onBlur={() => saveField(m.field, editValue)}
                      onClick={e => e.stopPropagation()}
                      placeholder={m.placeholder}
                      style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${accentColor}50`, color: '#fff', fontSize: 18, fontFamily: 'DM Mono, monospace', fontWeight: 700, outline: 'none', padding: '2px 0', boxSizing: 'border-box' }} />
                  )
                ) : (
                  <div style={{ fontSize: 18, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#fff' }}>{m.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Nombre editable ── */}
        <div style={{ background: CARD, border: `1px solid ${editingField === 'display_name' ? accentColor + '50' : BORDER}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
          onClick={() => { if (editingField !== 'display_name') { setEditingField('display_name'); setEditValue(profile.display_name ?? '') } }}>
          <div style={{ fontSize: 9, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>{isEs ? 'Nombre' : 'Name'}</div>
          {editingField === 'display_name' ? (
            <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveField('display_name', editValue); if (e.key === 'Escape') setEditingField(null) }}
              onBlur={() => saveField('display_name', editValue)}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${accentColor}50`, color: '#fff', fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, outline: 'none', padding: '2px 0', boxSizing: 'border-box' }} />
          ) : (
            <div style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff' }}>{profile.display_name || '—'}</div>
          )}
        </div>

        {/* ── Nutrición ── */}
        {(cal || prot || carbs || fat) ? (
          <div>
            <SectionLabel>{isEs ? 'Nutrición' : 'Nutrition'}</SectionLabel>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px' }}>
              {cal > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{isEs ? 'Calorías objetivo' : 'Target calories'}</span>
                    <span style={{ fontSize: 24, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#fff' }}>{cal}<span style={{ fontSize: 13, color: T3 }}>  kcal</span></span>
                  </div>
                  {(prot || carbs || fat) && (
                    <>
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 8 }}>
                        {protKcal > 0 && <div style={{ flex: protKcal, background: '#60A5FA' }} />}
                        {carbKcal > 0 && <div style={{ flex: carbKcal, background: accentColor }} />}
                        {fatKcal > 0 && <div style={{ flex: fatKcal, background: '#F97316' }} />}
                      </div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        {prot > 0 && <span style={{ fontSize: 11, color: '#60A5FA', fontFamily: 'DM Mono, monospace' }}>P {prot}g</span>}
                        {carbs > 0 && <span style={{ fontSize: 11, color: accentColor, fontFamily: 'DM Mono, monospace' }}>C {carbs}g</span>}
                        {fat > 0 && <span style={{ fontSize: 11, color: '#F97316', fontFamily: 'DM Mono, monospace' }}>F {fat}g</span>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Registro diario ── */}
        <div>
          <SectionLabel>{isEs ? 'Registro diario' : 'Daily log'}</SectionLabel>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { key: 'weight', label: isEs ? 'Peso (kg)' : 'Weight (kg)', placeholder: '80.5', type: 'number' },
                { key: 'sleep', label: isEs ? 'Horas sueño' : 'Sleep hours', placeholder: '8', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 9, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} placeholder={f.placeholder} value={(dailyForm as any)[f.key] ?? ''}
                    onChange={e => setDailyForm((d: any) => ({ ...d, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: '#0d0d14', border: `1.5px solid ${BORDER}`, borderRadius: 8, color: T1, fontSize: 14, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'DM Mono, monospace' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { key: 'energy', label: isEs ? 'Energía 1-5' : 'Energy 1-5', color: accentColor },
                { key: 'stress', label: isEs ? 'Estrés 1-5' : 'Stress 1-5', color: '#FF6B6B' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 9, color: T3, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{f.label}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5].map(v => (
                      <button key={v}
                        onClick={() => setDailyForm((d: any) => ({ ...d, [f.key]: d[f.key] === v ? 0 : v }))}
                        style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 700, border: `1.5px solid ${(dailyForm as any)[f.key] === v ? f.color + '60' : BORDER}`, background: (dailyForm as any)[f.key] === v ? f.color + '20' : '#0d0d14', color: (dailyForm as any)[f.key] === v ? f.color : T3, cursor: 'pointer', fontFamily: 'DM Mono, monospace', transition: 'all 0.15s' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <textarea value={dailyForm.notes ?? ''} onChange={e => setDailyForm((d: any) => ({ ...d, notes: e.target.value }))}
              placeholder={isEs ? 'Cómo te has sentido hoy...' : 'How you felt today...'} rows={2}
              style={{ width: '100%', background: '#0d0d14', border: `1.5px solid ${BORDER}`, borderRadius: 8, color: T1, fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'DM Mono, monospace', marginBottom: 10 }} />
            <button onClick={handleDailySave} disabled={savingDaily}
              style={{ width: '100%', background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}25`, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: savingDaily ? 'not-allowed' : 'pointer' }}>
              {savingDaily ? '...' : (isEs ? 'Registrar día' : 'Log day')}
            </button>
            {dailyMsg && <p style={{ textAlign: 'center', fontSize: 12, color: accentColor, margin: '8px 0 0' }}>{dailyMsg}</p>}

            {dailyLogs.length > 0 && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>{[isEs ? 'Fecha' : 'Date', isEs ? 'Peso' : 'Wt', isEs ? 'E' : 'E', isEs ? 'Z' : 'S', isEs ? 'Est' : 'Str'].map(h => (
                      <th key={h} style={{ padding: '4px 6px', fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: T3, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {dailyLogs.map((log: any) => (
                      <tr key={log.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '5px 6px', color: T2 }}>{new Date(log.date).toLocaleDateString(isEs ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ padding: '5px 6px', color: T1, fontFamily: 'DM Mono, monospace' }}>{log.weight ? `${log.weight}` : '—'}</td>
                        <td style={{ padding: '5px 6px', color: accentColor, fontFamily: 'DM Mono, monospace' }}>{log.energy ?? '—'}</td>
                        <td style={{ padding: '5px 6px', color: T2, fontFamily: 'DM Mono, monospace' }}>{log.sleep ?? '—'}</td>
                        <td style={{ padding: '5px 6px', color: '#FF6B6B', fontFamily: 'DM Mono, monospace' }}>{log.stress ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Acceso a submenús ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'settings', icon: '⚙️', title: isEs ? 'Ajustes y personalización' : 'Settings & customization', desc: isEs ? 'Idioma, colores, tema, notificaciones' : 'Language, colors, theme, notifications' },
            { key: 'account', icon: '👤', title: isEs ? 'Cuenta y plan' : 'Account & plan', desc: isEs ? 'Sesión, plan actual, zona de peligro' : 'Session, current plan, danger zone' },
          ].map(item => (
            <button key={item.key} onClick={() => setView(item.key as View)}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 14, padding: '15px 16px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: T1, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{item.desc}</div>
              </div>
              <span style={{ color: T3, fontSize: 20 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

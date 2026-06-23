'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle'

const BG = '#0A0A0F', CARD = '#111118', ACC = '#C8FF00', T1 = '#F0F0F5', T2 = '#8888AA', T3 = '#44445a', BORDER = 'rgba(255,255,255,0.06)'

const GOALS = [
  { key: 'hypertrophy', es: 'Hipertrofia máxima', en: 'Max hypertrophy' },
  { key: 'strength',    es: 'Fuerza y masa',       en: 'Strength & mass'  },
  { key: 'recomp',     es: 'Recomposición',        en: 'Recomposition'    },
  { key: 'cut',        es: 'Definición',            en: 'Cut / Definition' },
]
const EXP = [
  { key: 1, es: '< 1 año',  en: '< 1 year'  },
  { key: 2, es: '1-2 años', en: '1-2 years' },
  { key: 4, es: '2-4 años', en: '2-4 years' },
  { key: 7, es: '4+ años',  en: '4+ years'  },
]
const LANGUAGES = [
  { key: 'es', label: 'Español' }, { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' }, { key: 'de', label: 'Deutsch' },
  { key: 'it', label: 'Italiano' }, { key: 'nl', label: 'Nederlands' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d14', border: '1.5px solid rgba(255,255,255,0.08)',
  borderRadius: 14, color: T1, fontFamily: 'Inter, sans-serif', fontSize: 15,
  padding: '13px 16px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 8,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 10 }}>{title}</p>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'

  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [focusField, setFocusField] = useState<string | null>(null)

  // Daily log state
  const [dailyForm, setDailyForm] = useState<any>({ weight: '', energy: '', sleep: '', stress: '', notes: '' })
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [savingDaily, setSavingDaily] = useState(false)
  const [dailyMsg, setDailyMsg] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState<any>(null)

  // Delete account
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/profile/me').then(r => r.json()).then(d => {
      if (d.profile) { setProfile(d.profile); setForm(d.profile) }
    })
    fetch('/api/daily-log').then(r => r.json()).then(d => setDailyLogs(d.logs ?? []))
    fetch('/api/dashboard/summary').then(r => r.json()).then(d => setStats(d.stats))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${locale}/login`)
  }

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null)
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setProfile({ ...profile, ...form })
        setSaveMsg(isEs ? 'Guardado ✓' : 'Saved ✓')
        setEditing(false)
        setTimeout(() => setSaveMsg(null), 3000)
      }
    } catch {}
    setSaving(false)
  }

  const handleDailySave = async () => {
    setSavingDaily(true); setDailyMsg(null)
    try {
      const res = await fetch('/api/daily-log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        setDailyForm({ weight: '', energy: '', sleep: '', stress: '', notes: '' })
        setTimeout(() => setDailyMsg(null), 3000)
      }
    } catch {}
    setSavingDaily(false)
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
    } catch {}
    setDeleting(false)
  }

  const animStyle = (delay: number): React.CSSProperties => ({
    animation: `fadeUp 0.3s ease-out ${delay}ms both`,
  })

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid ' + ACC, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )

  const isPro = profile.subscription_tier === 'pro'
  const avatar = (profile.display_name ?? 'A').charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } } @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{ padding: '40px 20px 24px', ...animStyle(0) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#C8FF00,#88DD00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: BG, fontFamily: 'Syne, sans-serif', flexShrink: 0, boxShadow: '0 0 24px rgba(200,255,0,0.2)' }}>
            {avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: T1 }}>{profile.display_name}</h1>
              {isPro && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif', background: 'rgba(200,255,0,0.15)', color: ACC, border: '1px solid rgba(200,255,0,0.3)' }}>PRO</span>}
            </div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3 }}>
              {GOALS.find(g => g.key === profile.primary_goal)?.[isEs ? 'es' : 'en'] ?? profile.primary_goal ?? ''}
            </p>
          </div>
          <button onClick={() => setEditing(!editing)} style={{ background: editing ? 'rgba(200,255,0,0.1)' : CARD, color: editing ? ACC : T2, border: '1px solid ' + (editing ? 'rgba(200,255,0,0.25)' : BORDER), borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', flexShrink: 0 }}>
            {editing ? (isEs ? 'Cancelar' : 'Cancel') : (isEs ? 'Editar' : 'Edit')}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Stats del perfil */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, ...animStyle(40) }}>
            {[
              { label: isEs ? 'Sesiones' : 'Sessions', value: stats.totalSessions, unit: '' },
              { label: isEs ? 'Racha' : 'Streak', value: stats.streak, unit: 'd' },
            ].map(k => (
              <div key={k.label} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '14px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>{k.label}</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, fontWeight: 700, color: T1 }}>{k.value}<span style={{ fontSize: 13, color: T3 }}>{k.unit}</span></p>
              </div>
            ))}
          </div>
        )}

        {/* Perfil — vista / edición */}
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, overflow: 'hidden', ...animStyle(80) }}>
          <div style={{ padding: '14px 20px 10px' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3 }}>
              {isEs ? 'Mi perfil' : 'My profile'}
            </p>
          </div>
          {editing ? (
            <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>{isEs ? 'Nombre' : 'Name'}</label>
                <input type="text" value={form.display_name ?? ''} onChange={e => setForm((f: any) => ({ ...f, display_name: e.target.value }))}
                  style={{ ...inputStyle, borderColor: focusField === 'name' ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)' }}
                  onFocus={() => setFocusField('name')} onBlur={() => setFocusField(null)} />
              </div>
              <div>
                <label style={labelStyle}>{isEs ? 'Objetivo' : 'Goal'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {GOALS.map(g => (
                    <button key={g.key} onClick={() => setForm((f: any) => ({ ...f, primary_goal: g.key }))} style={{ padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer', background: form.primary_goal === g.key ? 'rgba(200,255,0,0.12)' : '#16161f', color: form.primary_goal === g.key ? ACC : T2, border: '1px solid ' + (form.primary_goal === g.key ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.05)'), fontFamily: 'Inter, sans-serif' }}>
                      {isEs ? g.es : g.en}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{isEs ? 'Experiencia' : 'Experience'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EXP.map(e => (
                    <button key={e.key} onClick={() => setForm((f: any) => ({ ...f, training_experience_years: e.key }))} style={{ padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer', background: form.training_experience_years === e.key ? 'rgba(200,255,0,0.12)' : '#16161f', color: form.training_experience_years === e.key ? ACC : T2, border: '1px solid ' + (form.training_experience_years === e.key ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.05)'), fontFamily: 'Inter, sans-serif' }}>
                      {isEs ? e.es : e.en}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{isEs ? 'Peso corporal' : 'Body weight'}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={form.body_weight_kg ?? ''} onChange={e => setForm((f: any) => ({ ...f, body_weight_kg: e.target.value }))} placeholder="80"
                    style={{ ...inputStyle, flex: 1, borderColor: focusField === 'weight' ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)' }}
                    onFocus={() => setFocusField('weight')} onBlur={() => setFocusField(null)} />
                  <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                    {['kg', 'lbs'].map(u => (
                      <button key={u} onClick={() => setForm((f: any) => ({ ...f, weight_unit: u }))} style={{ padding: '0 16px', fontSize: 13, fontWeight: 700, background: form.weight_unit === u ? ACC : '#16161f', color: form.weight_unit === u ? BG : T3, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{u}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{isEs ? 'Altura (cm)' : 'Height (cm)'}</label>
                <input type="number" value={form.height_cm ?? ''} onChange={e => setForm((f: any) => ({ ...f, height_cm: e.target.value }))} placeholder="175"
                  style={{ ...inputStyle, borderColor: focusField === 'height' ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)' }}
                  onFocus={() => setFocusField('height')} onBlur={() => setFocusField(null)} />
              </div>
              <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: saving ? '#1a1a2e' : 'linear-gradient(135deg,#C8FF00,#88DD00)', color: saving ? T2 : BG, border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 800, fontFamily: 'Syne, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 20px rgba(200,255,0,0.3)' }}>
                {saving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar cambios' : 'Save changes')}
              </button>
            </div>
          ) : (
            <div>
              {[
                { label: isEs ? 'Objetivo' : 'Goal', value: GOALS.find(g => g.key === profile.primary_goal)?.[isEs ? 'es' : 'en'] ?? profile.primary_goal ?? '-' },
                { label: isEs ? 'Experiencia' : 'Experience', value: profile.training_experience_years ? `${profile.training_experience_years}${isEs ? ' años' : ' years'}` : '-' },
                { label: isEs ? 'Peso' : 'Weight', value: profile.body_weight_kg ? `${profile.body_weight_kg} ${profile.weight_unit ?? 'kg'}` : '-' },
                { label: isEs ? 'Altura' : 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : '-' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 13, color: T2 }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {saveMsg && <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: ACC }}>{saveMsg}</p>}

        {/* Nutricion */}
        {(profile.nutrition_calories_target || profile.nutrition_protein_g || profile.training_split_detected || editing) && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, overflow: 'hidden', ...animStyle(100) }}>
            <div style={{ padding: '14px 20px 10px' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3 }}>
                {isEs ? 'Nutrición' : 'Nutrition'}
              </p>
            </div>
            {editing ? (
              <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { key: 'nutrition_calories_target', label: isEs ? 'Calorías objetivo' : 'Target calories', ph: '2500', unit: 'kcal' },
                    { key: 'nutrition_protein_g', label: isEs ? 'Proteínas (g)' : 'Protein (g)', ph: '180', unit: 'g' },
                    { key: 'nutrition_carbs_g', label: isEs ? 'Carbohidratos (g)' : 'Carbs (g)', ph: '300', unit: 'g' },
                    { key: 'nutrition_fat_g', label: isEs ? 'Grasas (g)' : 'Fat (g)', ph: '70', unit: 'g' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input type="number" value={form[f.key] ?? ''} onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.ph}
                        style={{ ...inputStyle, fontSize: 14, padding: '10px 14px' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>{isEs ? 'Comidas al día' : 'Meals per day'}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setForm((prev: any) => ({ ...prev, nutrition_meals_per_day: n }))}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: form.nutrition_meals_per_day === n ? 'rgba(200,255,0,0.12)' : '#0d0d14', color: form.nutrition_meals_per_day === n ? ACC : T3, border: '1px solid ' + (form.nutrition_meals_per_day === n ? 'rgba(200,255,0,0.3)' : BORDER), fontFamily: 'DM Mono, monospace' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{isEs ? 'Notas nutricionales' : 'Nutrition notes'}</label>
                  <textarea value={form.nutrition_notes ?? ''} onChange={e => setForm((prev: any) => ({ ...prev, nutrition_notes: e.target.value }))} rows={2}
                    style={{ ...inputStyle, resize: 'none' as const, fontSize: 14, padding: '10px 14px' }} />
                </div>
              </div>
            ) : (
              <div>
                {[
                  { label: isEs ? 'Calorías' : 'Calories', value: profile.nutrition_calories_target ? `${profile.nutrition_calories_target} kcal` : null },
                  { label: isEs ? 'Proteínas' : 'Protein', value: profile.nutrition_protein_g ? `${profile.nutrition_protein_g}g` : null },
                  { label: isEs ? 'Carbohidratos' : 'Carbs', value: profile.nutrition_carbs_g ? `${profile.nutrition_carbs_g}g` : null },
                  { label: isEs ? 'Grasas' : 'Fat', value: profile.nutrition_fat_g ? `${profile.nutrition_fat_g}g` : null },
                  { label: isEs ? 'Comidas/día' : 'Meals/day', value: profile.nutrition_meals_per_day ? String(profile.nutrition_meals_per_day) : null },
                  { label: isEs ? 'Split detectado' : 'Detected split', value: profile.training_split_detected ?? null },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 13, color: T2 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>{row.value}</span>
                  </div>
                ))}
                {!profile.nutrition_calories_target && !profile.nutrition_protein_g && (
                  <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 12, color: T3 }}>{isEs ? 'Sin datos nutricionales. Importa tu programa para autocompletar.' : 'No nutrition data. Import your program to auto-fill.'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Registro Diario */}
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, overflow: 'hidden', ...animStyle(120) }}>
          <div style={{ padding: '14px 20px 14px' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 14 }}>
              {isEs ? 'Registro diario' : 'Daily log'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {[
                { key: 'weight', label: isEs ? 'Peso (kg)' : 'Weight (kg)', placeholder: '80.5', type: 'number' },
                { key: 'sleep', label: isEs ? 'Horas sueño' : 'Sleep hours', placeholder: '8', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={dailyForm[f.key] ?? ''} onChange={e => setDailyForm((d: any) => ({ ...d, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, fontSize: 14, padding: '10px 14px', borderColor: focusField === 'df_' + f.key ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)' }}
                    onFocus={() => setFocusField('df_' + f.key)} onBlur={() => setFocusField(null)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              {[
                { key: 'energy', label: isEs ? 'Energía 1-5' : 'Energy 1-5' },
                { key: 'stress', label: isEs ? 'Estrés 1-5' : 'Stress 1-5' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>{f.label}</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5].map(v => (
                      <button key={v} onClick={() => setDailyForm((d: any) => ({ ...d, [f.key]: d[f.key] === v ? '' : v }))} style={{ flex: 1, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1.5px solid ' + (dailyForm[f.key] === v ? (f.key === 'stress' ? '#FF6B6B44' : 'rgba(200,255,0,0.4)') : BORDER), background: dailyForm[f.key] === v ? (f.key === 'stress' ? 'rgba(255,107,107,0.12)' : 'rgba(200,255,0,0.12)') : '#0d0d14', color: dailyForm[f.key] === v ? (f.key === 'stress' ? '#FF6B6B' : ACC) : T3, cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>{v}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...labelStyle, marginBottom: 6 }}>{isEs ? 'Notas' : 'Notes'}</label>
              <textarea value={dailyForm.notes ?? ''} onChange={e => setDailyForm((d: any) => ({ ...d, notes: e.target.value }))} placeholder={isEs ? 'Cómo te has sentido hoy...' : 'How you felt today...'} rows={2}
                style={{ ...inputStyle, resize: 'none', fontSize: 14, padding: '10px 14px', borderColor: focusField === 'df_notes' ? 'rgba(200,255,0,0.5)' : 'rgba(255,255,255,0.08)' }}
                onFocus={() => setFocusField('df_notes')} onBlur={() => setFocusField(null)} />
            </div>
            <button onClick={handleDailySave} disabled={savingDaily} style={{ width: '100%', background: 'rgba(200,255,0,0.1)', color: ACC, border: '1px solid rgba(200,255,0,0.2)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: savingDaily ? 'not-allowed' : 'pointer' }}>
              {savingDaily ? '...' : (isEs ? 'Registrar día' : 'Log day')}
            </button>
            {dailyMsg && <p style={{ textAlign: 'center', fontSize: 12, color: ACC, marginTop: 8 }}>{dailyMsg}</p>}
          </div>
          {/* Historial últimos 7 días */}
          {dailyLogs.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ padding: '10px 20px 8px', fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T3 }}>
                {isEs ? 'Últimos 7 días' : 'Last 7 days'}
              </p>
              <div style={{ overflowX: 'auto', padding: '0 20px 16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {[isEs ? 'Fecha' : 'Date', isEs ? 'Peso' : 'Weight', isEs ? 'Energía' : 'Energy', isEs ? 'Sueño' : 'Sleep', isEs ? 'Estrés' : 'Stress'].map(h => (
                        <th key={h} style={{ padding: '4px 8px', fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: T3, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyLogs.map((log: any) => (
                      <tr key={log.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px', color: T2 }}>{new Date(log.date).toLocaleDateString(isEs ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ padding: '6px 8px', color: T1, fontFamily: 'DM Mono, monospace' }}>{log.weight ? `${log.weight}kg` : '—'}</td>
                        <td style={{ padding: '6px 8px', color: ACC, fontFamily: 'DM Mono, monospace' }}>{log.energy ?? '—'}</td>
                        <td style={{ padding: '6px 8px', color: T2, fontFamily: 'DM Mono, monospace' }}>{log.sleep ?? '—'}</td>
                        <td style={{ padding: '6px 8px', color: '#FF6B6B', fontFamily: 'DM Mono, monospace' }}>{log.stress ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Configuración */}
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, overflow: 'hidden', ...animStyle(160) }}>
          <div style={{ padding: '14px 20px 14px' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 14 }}>
              {isEs ? 'Configuración' : 'Settings'}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{isEs ? 'Idioma' : 'Language'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {LANGUAGES.map(l => (
                  <button key={l.key} onClick={() => setForm((f: any) => ({ ...f, language: l.key }))} style={{ padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: form.language === l.key ? 'rgba(200,255,0,0.12)' : '#0d0d14', color: form.language === l.key ? ACC : T2, border: '1px solid ' + (form.language === l.key ? 'rgba(200,255,0,0.3)' : BORDER), fontFamily: 'Syne, sans-serif' }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 13, color: T2 }}>{isEs ? 'Unidades de peso' : 'Weight units'}</span>
              <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                {['kg', 'lbs'].map(u => (
                  <button key={u} onClick={() => setForm((f: any) => ({ ...f, weight_unit: u }))} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, background: form.weight_unit === u ? ACC : '#0d0d14', color: form.weight_unit === u ? BG : T3, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>{u}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ marginTop: 14, width: '100%', background: 'rgba(200,255,0,0.08)', color: ACC, border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '...' : (isEs ? 'Guardar configuración' : 'Save settings')}
            </button>
            <div style={{ marginTop: 14 }}>
              <PushNotificationToggle locale={locale} />
            </div>
          </div>
        </div>

        {/* Plan actual */}
        <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, ...animStyle(200) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
            <span style={{ fontSize: 13, color: T2 }}>{isEs ? 'Plan actual' : 'Current plan'}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: isPro ? ACC : T2, fontFamily: 'Syne, sans-serif' }}>{isPro ? 'Pro' : 'Free'}</span>
          </div>
        </div>

        {/* Upgrade CTA */}
        {!isPro && (
          <Link href={`/${locale}/upgrade`} style={{ display: 'block', background: 'linear-gradient(135deg, rgba(17,24,10,0.95), rgba(13,21,10,0.95))', border: '1px solid rgba(200,255,0,0.18)', borderRadius: 18, padding: '16px 20px', textDecoration: 'none', ...animStyle(220) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif', color: ACC, marginBottom: 4, fontSize: 15 }}>
                  {isEs ? 'Actualiza a Pro' : 'Upgrade to Pro'}
                </p>
                <p style={{ fontSize: 12, color: T2 }}>
                  {isEs ? 'AI Coach, progresión automática, sin límites' : 'AI Coach, auto progression, unlimited'}
                </p>
              </div>
              <span style={{ color: ACC, fontSize: 22 }}>›</span>
            </div>
          </Link>
        )}

        {/* Logout */}
        <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255,107,107,0.08)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 14, padding: '15px', fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', ...animStyle(240) }}>
          {isEs ? 'Cerrar sesión' : 'Log out'}
        </button>

        {/* Danger zone */}
        <div style={{ background: 'rgba(255,107,107,0.04)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 18, padding: '16px 20px', ...animStyle(260) }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FF6B6B', marginBottom: 8 }}>
            {isEs ? 'Zona de peligro' : 'Danger zone'}
          </p>
          <p style={{ fontSize: 12, color: T3, marginBottom: 12 }}>
            {isEs ? 'Esta acción es irreversible. Se eliminarán todos tus datos.' : 'This action is irreversible. All your data will be deleted.'}
          </p>
          <button onClick={() => setShowDelete(true)} style={{ background: 'transparent', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
            {isEs ? 'Eliminar cuenta' : 'Delete account'}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDelete && (
        <div onClick={() => !deleting && setShowDelete(false)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD, border: '1px solid rgba(255,107,107,0.3)', borderRadius: 22, padding: '28px 24px', maxWidth: 340, width: '100%' }}>
            <p style={{ fontSize: 20, marginBottom: 12 }}>⚠️</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#FF6B6B', marginBottom: 8 }}>
              {isEs ? '¿Eliminar cuenta?' : 'Delete account?'}
            </p>
            <p style={{ fontSize: 13, color: T2, marginBottom: 20, lineHeight: 1.5 }}>
              {isEs ? 'Para confirmar, escribe ELIMINAR en el campo de abajo.' : 'To confirm, type DELETE in the field below.'}
            </p>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder={isEs ? 'ELIMINAR' : 'DELETE'}
              style={{ ...inputStyle, marginBottom: 16, borderColor: deleteInput === (isEs ? 'ELIMINAR' : 'DELETE') ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowDelete(false); setDeleteInput('') }} disabled={deleting} style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#1a1a2e', color: T2, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteInput !== 'ELIMINAR' || deleting} style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: deleteInput === 'ELIMINAR' ? 'rgba(255,107,107,0.2)' : '#1a1a2e', color: deleteInput === 'ELIMINAR' ? '#FF6B6B' : T3, border: '1px solid ' + (deleteInput === 'ELIMINAR' ? 'rgba(255,107,107,0.4)' : 'transparent'), cursor: deleteInput === 'ELIMINAR' ? 'pointer' : 'not-allowed', fontFamily: 'Syne, sans-serif', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? '...' : (isEs ? 'Eliminar' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

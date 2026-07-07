'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

// ── Design tokens ──────────────────────────────────────────────────────────────
const CARD = 'var(--card-bg,rgba(255,255,255,.04))'
const BDR  = 'var(--card-border,rgba(255,255,255,.08))'
const T1   = 'var(--text-primary,#fff)'
const T2   = 'var(--text-secondary,#888)'
const T3   = 'var(--text-tertiary,#333345)'
const ACC  = 'var(--accent-color,#C8FF00)'

// ── Muscle group colors ────────────────────────────────────────────────────────
const MC: Record<string, string> = {
  chest:'#FF6B6B',   pecho:'#FF6B6B',
  back:'#4ECDC4',    espalda:'#4ECDC4',
  shoulders:'#A78BFA', hombros:'#A78BFA',
  arms:'#FBBF24',    brazos:'#FBBF24',
  legs:'#60A5FA',    piernas:'#60A5FA',
  core:'#F97316',    abdominales:'#F97316',
  glutes:'#EC4899',  gluteos:'#EC4899',
  triceps:'#FB923C', biceps:'#34D399',
  hamstrings:'#818CF8', cuadriceps:'#60A5FA',
  calves:'#94A3B8',  pantorrillas:'#94A3B8',
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? '#445566'

// ── Split accent gradients ─────────────────────────────────────────────────────
const SPLIT_GRAD: Record<string, string> = {
  'PPL':            'linear-gradient(135deg,#A78BFA,#6366F1)',
  'Upper/Lower':    'linear-gradient(135deg,#60A5FA,#3B82F6)',
  'Full Body':      'linear-gradient(135deg,#34D399,#10B981)',
  'Bro Split':      'linear-gradient(135deg,#FF6B6B,#EF4444)',
  'Torso/Pierna':   'linear-gradient(135deg,#FBBF24,#F59E0B)',
  'Arnold Split':   'linear-gradient(135deg,#F97316,#EA580C)',
}
const splitGrad = (s: string | null) =>
  (s && SPLIT_GRAD[s]) ?? 'linear-gradient(135deg,#C8FF00,#86EFAC)'

// Extract first color from gradient string for badges
const firstColor = (grad: string) =>
  grad.replace('linear-gradient(135deg,','').split(',')[0].trim()

// ── Types ──────────────────────────────────────────────────────────────────────
interface Exercise { id: string; name: string; muscle_group_primary: string }
interface TemplateExercise {
  id: string; day_number: number; day_label: string | null
  order_in_day: number; sets_target: number | null
  rep_range_min: number | null; rep_range_max: number | null
  exercise: Exercise
}
interface Template {
  id: string; name: string; description: string | null
  training_days_per_week: number | null; split_type: string | null
  template_exercises: TemplateExercise[]
}
interface ProgressionMethod { id: string; name: string; method_type: string }

// ── Muscle strip ───────────────────────────────────────────────────────────────
function MuscleStrip({ muscles }: { muscles: string[] }) {
  if (!muscles.length) return null
  const pct = 100 / muscles.length
  return (
    <div style={{ display:'flex', height:3, margin:'0 16px 12px', borderRadius:2, overflow:'hidden' }}>
      {muscles.map((m, i) => (
        <div key={i} style={{ width:`${pct}%`, background: mc(m) }} />
      ))}
    </div>
  )
}

// ── Day pill ───────────────────────────────────────────────────────────────────
function DayPill({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'5px 10px', borderRadius:8, whiteSpace:'nowrap',
      background:'rgba(255,255,255,0.04)', border:`1px solid ${BDR}`,
      flexShrink: 0,
    }}>
      <span style={{ fontSize:10, fontWeight:700, color:T2, fontFamily:'DM Mono,monospace' }}>
        {label}
      </span>
      <span style={{
        width:16, height:16, borderRadius:4,
        background:'rgba(255,255,255,0.07)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:9, fontWeight:800, color:T3, fontFamily:'DM Mono,monospace',
      }}>{count}</span>
    </div>
  )
}

// ── Template card ──────────────────────────────────────────────────────────────
function TemplateCard({ t, locale, idx }: { t: Template; locale: string; idx: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const days = [...new Set(t.template_exercises.map(te => te.day_number))].sort()
  const muscles = [...new Set(
    t.template_exercises.map(te => te.exercise.muscle_group_primary).filter(Boolean)
  )]
  const grad = splitGrad(t.split_type)
  const accent1 = firstColor(grad)

  const dayMeta = days.map(d => {
    const exs = t.template_exercises
      .filter(te => te.day_number === d)
      .sort((a, b) => a.order_in_day - b.order_in_day)
    return { d, label: exs[0]?.day_label ?? `Día ${d}`, exs }
  })

  return (
    <div style={{
      marginBottom: 12,
      background: CARD,
      border: `1px solid ${open ? 'rgba(200,255,0,.16)' : BDR}`,
      borderRadius: 20,
      overflow: 'hidden',
      transition: 'border-color .2s, box-shadow .2s',
      boxShadow: open ? '0 0 0 1px rgba(200,255,0,.05)' : 'none',
      animation: `fadeUp .35s ease-out ${idx * 55}ms both`,
    }}>

      {/* Gradient accent bar */}
      <div style={{ height:3, background: grad, opacity:.7 }} />

      {/* Header — tappable to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'block', width:'100%', textAlign:'left',
          background:'transparent', border:'none', cursor:'pointer',
          padding:'14px 16px 10px',
        }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{
              margin:0, fontSize:16, fontWeight:800,
              fontFamily:'Syne,sans-serif', color:T1,
              letterSpacing:'-0.02em', lineHeight:1.2,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{t.name}</p>
            {t.description && (
              <p style={{
                margin:'3px 0 0', fontSize:11, color:T2,
                fontFamily:'Inter,sans-serif',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>{t.description}</p>
            )}
          </div>
          {/* Days badge */}
          <div style={{
            flexShrink:0, padding:'4px 11px', borderRadius:10,
            background:`${accent1}15`, border:`1px solid ${accent1}30`,
            display:'flex', flexDirection:'column', alignItems:'center',
          }}>
            <span style={{
              fontSize:22, fontWeight:900, fontFamily:'DM Mono,monospace',
              lineHeight:1, color:T1, letterSpacing:'-0.03em',
            }}>{t.training_days_per_week ?? days.length}</span>
            <span style={{ fontSize:8, color:T2, fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'.08em' }}>d/sem</span>
          </div>
        </div>

        {/* Info row */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
          {t.split_type && (
            <span style={{
              fontSize:9, fontWeight:800, fontFamily:'Syne,sans-serif',
              letterSpacing:'.1em', textTransform:'uppercase',
              padding:'3px 7px', borderRadius:5,
              background:'rgba(255,255,255,.05)', color:T2, border:`1px solid ${BDR}`,
            }}>{t.split_type}</span>
          )}
          <span style={{ fontSize:10, color:T3, fontFamily:'DM Mono,monospace' }}>
            {t.template_exercises.length} ejercicios
          </span>
          <span style={{
            marginLeft:'auto', fontSize:12, fontFamily:'DM Mono,monospace',
            color: open ? ACC : T3, transition:'color .2s', fontWeight:700,
          }}>{open ? '↑' : '↓'}</span>
        </div>
      </button>

      {/* Muscle color strip */}
      <MuscleStrip muscles={muscles} />

      {/* Day pills */}
      {dayMeta.length > 0 && (
        <div style={{
          display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none',
          padding:'0 16px 14px',
        }}>
          {dayMeta.map(({ d, label, exs }) => (
            <DayPill key={d} label={label} count={exs.length} />
          ))}
        </div>
      )}

      {/* Expanded exercise list */}
      {open && (
        <div style={{ borderTop:`1px solid ${BDR}`, paddingTop:4 }}>
          {dayMeta.map(({ d, label, exs }) => (
            <div key={d} style={{ padding:'10px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                <div style={{
                  width:18, height:18, borderRadius:5,
                  background: grad, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:9, fontWeight:900,
                  color:'#000', fontFamily:'DM Mono,monospace', flexShrink:0,
                }}>{d}</div>
                <span style={{
                  fontSize:10, fontWeight:800, color:T2,
                  fontFamily:'Syne,sans-serif', textTransform:'uppercase', letterSpacing:'.1em',
                }}>{label}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {exs.map(te => {
                  const col = mc(te.exercise.muscle_group_primary)
                  return (
                    <div key={te.id} style={{
                      display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'5px 8px', borderRadius:8,
                      background:'rgba(255,255,255,.025)',
                      borderLeft:`2px solid ${col}55`, gap:8,
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
                        <div style={{
                          width:6, height:6, borderRadius:2, flexShrink:0, background: col,
                        }} />
                        <span style={{
                          fontSize:11, color:T2, fontFamily:'Inter,sans-serif',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        }}>{te.exercise.name}</span>
                      </div>
                      <span style={{
                        fontSize:10, color:T3, fontFamily:'DM Mono,monospace',
                        flexShrink:0, fontWeight:600,
                      }}>
                        {te.sets_target ?? 3}×{te.rep_range_min ?? 8}{te.rep_range_max ? `-${te.rep_range_max}` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entrenar CTA */}
      <div style={{ padding: open ? '8px 14px 14px' : '0 14px 14px' }}>
        <button
          onClick={() => router.push(`/${locale}/training/session?templateId=${t.id}`)}
          style={{
            width:'100%', padding:'14px 0', border:'none', borderRadius:14,
            background: grad, color:'#000',
            fontSize:13, fontWeight:800, fontFamily:'Syne,sans-serif',
            letterSpacing:'.07em', textTransform:'uppercase', cursor:'pointer',
            transition:'opacity .15s, transform .1s',
            boxShadow:'0 4px 20px rgba(0,0,0,.3)',
          }}
          onMouseDown={e => { (e.currentTarget as any).style.opacity='.85'; (e.currentTarget as any).style.transform='scale(.99)' }}
          onMouseUp={e => { (e.currentTarget as any).style.opacity='1'; (e.currentTarget as any).style.transform='scale(1)' }}
          onTouchStart={e => { (e.currentTarget as any).style.opacity='.85' }}
          onTouchEnd={e => { (e.currentTarget as any).style.opacity='1' }}
        >
          🏋️ Entrenar ahora
        </button>
      </div>
    </div>
  )
}

// ── Input style ────────────────────────────────────────────────────────────────
const iStyle = (focused: boolean): React.CSSProperties => ({
  width:'100%', background:'rgba(255,255,255,.04)', borderRadius:12, color:T1,
  border:`1.5px solid ${focused ? ACC + '55' : BDR}`,
  fontFamily:'Inter,sans-serif', fontSize:14, padding:'11px 14px',
  outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
})

// ── New template form ──────────────────────────────────────────────────────────
function NewTemplateForm({ onCancel, onCreated }: {
  onCancel: () => void
  onCreated: () => void
}) {
  const router = useRouter()
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState('4')
  const [splitType, setSplitType]     = useState('PPL')
  const [loading, setLoading]         = useState(false)
  const [focus, setFocus]             = useState<string | null>(null)

  const create = async () => {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/training/templates', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        name: name.trim(), description: description.trim() || null,
        trainingDaysPerWeek: parseInt(daysPerWeek) || 4,
        splitType: splitType || null,
      }),
    })
    if (res.ok) { router.refresh(); onCreated() }
    setLoading(false)
  }

  const grad = splitGrad(splitType)

  return (
    <div style={{
      background: CARD, border:`1px solid ${ACC}22`,
      borderRadius:20, padding:20, marginBottom:12,
      boxShadow:'0 0 40px rgba(200,255,0,.05)',
    }}>
      <div style={{ height:2, borderRadius:1, background: grad, marginBottom:18 }} />

      <p style={{
        margin:'0 0 16px', fontSize:14, fontWeight:800,
        color:T1, fontFamily:'Syne,sans-serif', letterSpacing:'-0.01em',
      }}>Nueva plantilla</p>

      <div style={{ marginBottom:12 }}>
        <label style={{
          display:'block', fontSize:9, color:T3, fontFamily:'DM Mono,monospace',
          textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6,
        }}>Nombre *</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && create()}
          placeholder="ej. PPL Powerbuilding" autoFocus
          style={iStyle(focus === 'name')}
          onFocus={() => setFocus('name')} onBlur={() => setFocus(null)}
        />
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{
          display:'block', fontSize:9, color:T3, fontFamily:'DM Mono,monospace',
          textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6,
        }}>Descripción</label>
        <input
          type="text" value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Opcional"
          style={iStyle(focus === 'desc')}
          onFocus={() => setFocus('desc')} onBlur={() => setFocus(null)}
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
        <div>
          <label style={{
            display:'block', fontSize:9, color:T3, fontFamily:'DM Mono,monospace',
            textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6,
          }}>Días/sem</label>
          <select
            value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)}
            style={{ ...iStyle(false), appearance:'none' as any, cursor:'pointer' }}
          >
            {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} días</option>)}
          </select>
        </div>
        <div>
          <label style={{
            display:'block', fontSize:9, color:T3, fontFamily:'DM Mono,monospace',
            textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6,
          }}>Split</label>
          <select
            value={splitType} onChange={e => setSplitType(e.target.value)}
            style={{ ...iStyle(false), appearance:'none' as any, cursor:'pointer' }}
          >
            {Object.keys(SPLIT_GRAD).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Live split preview bar */}
      <div style={{ height:2, borderRadius:1, background: grad, marginBottom:16, transition:'background .2s' }} />

      <div style={{ display:'flex', gap:10 }}>
        <button
          onClick={create} disabled={loading || !name.trim()}
          style={{
            flex:2, padding:'13px 0', border:'none', borderRadius:12,
            background: name.trim() ? ACC : 'rgba(200,255,0,.12)',
            color: name.trim() ? '#0A0A0F' : T3,
            fontWeight:800, fontSize:13, fontFamily:'Syne,sans-serif',
            letterSpacing:'.06em', textTransform:'uppercase',
            cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
            transition:'all .15s',
          }}
        >{loading ? 'Creando...' : 'Crear plantilla'}</button>
        <button
          onClick={onCancel}
          style={{
            flex:1, padding:'13px 0', background:'transparent',
            border:`1px solid ${BDR}`, borderRadius:12,
            color:T2, fontWeight:700, fontSize:13,
            fontFamily:'Syne,sans-serif', cursor:'pointer',
          }}
        >Cancelar</button>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ textAlign:'center', padding:'52px 24px' }}>
      <div style={{
        width:72, height:72, borderRadius:20, margin:'0 auto 20px',
        background:'rgba(255,255,255,.04)', border:`1px solid ${BDR}`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="#334" strokeWidth="1.5"/>
          <path d="M8 9h8M8 12h5" stroke="#445" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="18" cy="18" r="5" fill="#0A0A0F" stroke="#C8FF00" strokeWidth="1.5"/>
          <path d="M18 16v2l1 1" stroke="#C8FF00" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{
        margin:'0 0 6px', fontSize:16, fontWeight:800,
        fontFamily:'Syne,sans-serif', color:T1, letterSpacing:'-0.01em',
      }}>Sin plantillas todavía</p>
      <p style={{
        margin:'0 0 28px', fontSize:12, color:T2,
        fontFamily:'Inter,sans-serif', lineHeight:1.6,
        maxWidth:240, marginLeft:'auto', marginRight:'auto',
      }}>
        Crea tu primera rutina para empezar a registrar sesiones estructuradas.
      </p>
      <button
        onClick={onNew}
        style={{
          padding:'13px 28px', border:'none', borderRadius:14,
          background: ACC, color:'#0A0A0F',
          fontWeight:800, fontSize:13, fontFamily:'Syne,sans-serif',
          letterSpacing:'.07em', textTransform:'uppercase', cursor:'pointer',
          boxShadow:'0 4px 20px rgba(200,255,0,.25)',
        }}
      >+ Nueva plantilla</button>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export function TemplateList({
  templates,
  progressionMethods,
}: {
  templates: Template[]
  progressionMethods: ProgressionMethod[]
}) {
  void progressionMethods
  const params = useParams()
  const locale = (params?.locale as string) ?? 'es'
  const [showForm, setShowForm] = useState(false)

  if (!templates.length && !showForm) {
    return <EmptyState onNew={() => setShowForm(true)} />
  }

  return (
    <div>
      {templates.map((t, idx) => (
        <TemplateCard key={t.id} t={t} locale={locale} idx={idx} />
      ))}

      {showForm ? (
        <NewTemplateForm
          onCancel={() => setShowForm(false)}
          onCreated={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width:'100%', padding:'15px 0', background:'transparent',
            border:`1px dashed rgba(255,255,255,.1)`, borderRadius:16,
            color:T3, fontWeight:700, fontSize:13,
            fontFamily:'Syne,sans-serif', cursor:'pointer',
            letterSpacing:'.04em', transition:'border-color .15s, color .15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as any).style.borderColor = ACC + '40'
            ;(e.currentTarget as any).style.color = ACC
          }}
          onMouseLeave={e => {
            (e.currentTarget as any).style.borderColor = 'rgba(255,255,255,.1)'
            ;(e.currentTarget as any).style.color = T3
          }}
        >+ Nueva plantilla</button>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CARD = 'var(--card-bg,rgba(255,255,255,.04))'
const BDR  = 'var(--card-border,rgba(255,255,255,.08))'
const T1   = 'var(--text-primary,#fff)'
const T2   = 'var(--text-secondary,#888)'
const T3   = 'var(--text-tertiary,#44445a)'
const ACC  = 'var(--accent-color,#C8FF00)'

const MC: Record<string,string> = {
  chest:'#FF6B6B', back:'#4ECDC4', shoulders:'#A78BFA', arms:'#FBBF24',
  legs:'#60A5FA', core:'#F97316', glutes:'#EC4899',
  pecho:'#FF6B6B', espalda:'#4ECDC4', hombros:'#A78BFA', brazos:'#FBBF24',
  piernas:'#60A5FA', abdominales:'#F97316', gluteos:'#EC4899',
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? '#8888AA'

interface Exercise { id: string; name: string; muscle_group_primary: string }
interface TemplateExercise { id: string; day_number: number; day_label: string | null; order_in_day: number; sets_target: number | null; rep_range_min: number | null; rep_range_max: number | null; exercise: Exercise }
interface Template { id: string; name: string; description: string | null; training_days_per_week: number | null; split_type: string | null; template_exercises: TemplateExercise[] }
interface ProgressionMethod { id: string; name: string; method_type: string }

export function TemplateList({ templates, progressionMethods }: { templates: Template[]; progressionMethods: ProgressionMethod[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState('4')
  const [splitType, setSplitType] = useState('PPL')
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<string|null>(null)
  const [inputFocus, setInputFocus] = useState<string|null>(null)

  void progressionMethods

  const createTemplate = async () => {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/training/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim()||null, trainingDaysPerWeek: parseInt(daysPerWeek)||4, splitType: splitType||null }),
    })
    if (res.ok) { router.refresh(); setShowForm(false); setName(''); setDescription('') }
    setLoading(false)
  }

  const iStyle = (focused: boolean): React.CSSProperties => ({
    width:'100%', background:'#0d0d14', borderRadius:12, color:T1,
    border:`1.5px solid ${focused?ACC+'60':BDR}`,
    fontFamily:'Inter,sans-serif', fontSize:14, padding:'11px 14px',
    outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
  })

  if (!templates.length && !showForm) {
    return (
      <div style={{textAlign:'center',padding:'60px 0'}}>
        <p style={{fontSize:40,margin:'0 0 12px'}}>📋</p>
        <p style={{fontSize:15,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif',margin:'0 0 6px'}}>Sin plantillas</p>
        <p style={{fontSize:12,color:T3,fontFamily:'DM Mono,monospace',margin:'0 0 24px'}}>Crea tu primera rutina de entrenamiento</p>
        <button onClick={()=>setShowForm(true)} style={{
          padding:'12px 28px',background:ACC,border:'none',borderRadius:12,
          color:'#0A0A0F',fontWeight:700,fontSize:14,fontFamily:'Syne,sans-serif',cursor:'pointer'
        }}>+ Nueva plantilla</button>
      </div>
    )
  }

  return (
    <div>
      {/* Template cards */}
      {templates.map((t,idx) => {
        const days = [...new Set(t.template_exercises.map(te => te.day_number))].sort()
        const isOpen = openId === t.id
        // Get muscle groups
        const muscles = [...new Set(t.template_exercises.map(te => te.exercise.muscle_group_primary).filter(Boolean))]
        return (
          <div key={t.id} style={{
            marginBottom:10, background:CARD, border:`1px solid ${isOpen?ACC+'40':BDR}`,
            borderRadius:16, overflow:'hidden', transition:'border-color .2s',
            animation:`fadeUp .4s ease-out ${idx*60}ms both`
          }}>
            {/* Header row */}
            <div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
              <button onClick={()=>setOpenId(isOpen?null:t.id)} style={{
                flex:1,textAlign:'left',background:'transparent',border:'none',cursor:'pointer',padding:0
              }}>
                <p style={{margin:0,fontSize:15,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif'}}>{t.name}</p>
                <p style={{margin:'3px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
                  {t.training_days_per_week??4}d/sem
                  {t.split_type?` · ${t.split_type}`:''}
                  {' · '}{t.template_exercises.length} ejercicios
                </p>
              </button>
              <button
                onClick={()=>router.push(`/es/training/session?templateId=${t.id}`)}
                style={{
                  padding:'8px 14px',background:`${ACC}15`,border:`1px solid ${ACC}30`,
                  borderRadius:10,color:ACC,fontSize:11,fontWeight:700,
                  fontFamily:'Syne,sans-serif',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0
                }}
              >Entrenar →</button>
            </div>

            {/* Muscle group chips */}
            {muscles.length > 0 && (
              <div style={{padding:'0 16px 10px',display:'flex',gap:6,flexWrap:'wrap'}}>
                {muscles.slice(0,6).map(m=>(
                  <span key={m} style={{
                    padding:'3px 8px',borderRadius:6,fontSize:9,fontWeight:700,
                    fontFamily:'Syne,sans-serif',letterSpacing:'.06em',textTransform:'uppercase',
                    color:mc(m),background:mc(m)+'18',border:`1px solid ${mc(m)}30`
                  }}>{m}</span>
                ))}
              </div>
            )}

            {/* Expanded: day-by-day breakdown */}
            {isOpen && days.length > 0 && (
              <div style={{borderTop:`1px solid ${BDR}`,padding:'8px 0'}}>
                {days.map(d=>{
                  const dayExs = t.template_exercises.filter(te=>te.day_number===d).sort((a,b)=>a.order_in_day-b.order_in_day)
                  const label = dayExs[0]?.day_label ?? `Día ${d}`
                  return (
                    <div key={d} style={{padding:'8px 16px',borderBottom:`1px solid rgba(255,255,255,.03)`}}>
                      <p style={{margin:'0 0 6px',fontSize:11,fontWeight:700,color:ACC,fontFamily:'Syne,sans-serif',textTransform:'uppercase',letterSpacing:'.08em'}}>
                        {label}
                      </p>
                      {dayExs.map((te,j)=>(
                        <div key={te.id} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:j<dayExs.length-1?`1px solid rgba(255,255,255,.02)`:'none'}}>
                          <span style={{fontSize:12,color:T2,fontFamily:'DM Mono,monospace'}}>{te.exercise.name}</span>
                          <span style={{fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
                            {te.sets_target??3}×{te.rep_range_min??8}{te.rep_range_max?`-${te.rep_range_max}`:''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* New template form */}
      {showForm ? (
        <div style={{background:CARD,border:`1px solid ${ACC}30`,borderRadius:16,padding:18,marginBottom:12}}>
          <p style={{margin:'0 0 14px',fontSize:14,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif'}}>Nueva plantilla</p>

          <div style={{marginBottom:12}}>
            <label style={{display:'block',fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Nombre *</label>
            <input
              type="text" value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&createTemplate()}
              placeholder="ej. PPL Powerbuilding"
              autoFocus
              style={iStyle(inputFocus==='name')}
              onFocus={()=>setInputFocus('name')} onBlur={()=>setInputFocus(null)}
            />
          </div>

          <div style={{marginBottom:12}}>
            <label style={{display:'block',fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Descripción</label>
            <input
              type="text" value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Opcional"
              style={iStyle(inputFocus==='desc')}
              onFocus={()=>setInputFocus('desc')} onBlur={()=>setInputFocus(null)}
            />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            <div>
              <label style={{display:'block',fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Días/sem</label>
              <select value={daysPerWeek} onChange={e=>setDaysPerWeek(e.target.value)} style={{...iStyle(false),appearance:'none' as any}}>
                {[2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Split</label>
              <select value={splitType} onChange={e=>setSplitType(e.target.value)} style={{...iStyle(false),appearance:'none' as any}}>
                {['PPL','Upper/Lower','Full Body','Bro Split','Torso/Pierna','Arnold Split'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{display:'flex',gap:10}}>
            <button onClick={createTemplate} disabled={loading||!name.trim()} style={{
              flex:1,padding:'12px 0',background:ACC,border:'none',borderRadius:12,
              color:'#0A0A0F',fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',
              cursor:loading||!name.trim()?'not-allowed':'pointer',opacity:!name.trim()?0.4:1,
              transition:'opacity .15s'
            }}>{loading?'Creando...':'Crear plantilla'}</button>
            <button onClick={()=>{setShowForm(false);setName('');setDescription('')}} style={{
              flex:1,padding:'12px 0',background:'transparent',border:`1px solid ${BDR}`,
              borderRadius:12,color:T2,fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',cursor:'pointer'
            }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowForm(true)} style={{
          width:'100%',padding:'14px 0',background:'transparent',
          border:`1px dashed ${BDR}`,borderRadius:14,color:T3,
          fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',cursor:'pointer',
          transition:'border-color .15s,color .15s'
        }}
          onMouseEnter={e=>{(e.currentTarget as any).style.borderColor=ACC+'40';(e.currentTarget as any).style.color=ACC}}
          onMouseLeave={e=>{(e.currentTarget as any).style.borderColor=BDR;(e.currentTarget as any).style.color=T3}}
        >+ Nueva plantilla</button>
      )}
    </div>
  )
}

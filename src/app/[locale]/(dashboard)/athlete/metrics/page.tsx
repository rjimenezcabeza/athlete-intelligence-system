'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AthleteTabBar } from '@/components/athlete/AthleteTabBar'

const BG='var(--bg-primary,#0A0A0F)',CARD='var(--card-bg,rgba(255,255,255,.04))',BDR='var(--card-border,rgba(255,255,255,.08))',T1='var(--text-primary,#fff)',T2='var(--text-secondary,#888)',T3='var(--text-tertiary,#44445a)',ACC='var(--accent-color,#C8FF00)'

interface Metric {
  id: string; recorded_date: string; body_weight_kg?: number; body_fat_pct?: number;
  muscle_mass_kg?: number; lean_mass_kg?: number; water_pct?: number; waist_cm?: number;
  chest_cm?: number; left_arm_cm?: number; notes?: string; bmi?: number;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const W = 80, H = 32
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`)
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={H - ((values[values.length - 1] - min) / range) * (H - 4) - 2} r="3" fill={color} />
    </svg>
  )
}

function WeightChart({ history }: { history: Metric[] }) {
  const data = history.filter(m => m.body_weight_kg).slice(0, 20).reverse()
  if (data.length < 2) return null
  const weights = data.map(m => m.body_weight_kg!)
  const min = Math.floor(Math.min(...weights)) - 1
  const max = Math.ceil(Math.max(...weights)) + 1
  const W = 320, H = 80
  const pts = data.map((m, i) => {
    const x = (i / (data.length - 1)) * (W - 20) + 10
    const y = H - ((m.body_weight_kg! - min) / (max - min)) * (H - 10) - 5
    return `${x},${y}`
  })
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACC} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ACC} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`10,${H} ${pts.join(' ')} ${(data.length-1)/(data.length-1)*(W-20)+10},${H}`} fill="url(#wGrad)" />
        <polyline points={pts.join(' ')} fill="none" stroke={ACC} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {(() => { const last = pts[pts.length-1].split(','); return <circle cx={last[0]} cy={last[1]} r="4" fill={ACC} stroke="#0A0A0F" strokeWidth="2" /> })()}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {new Date(data[0].recorded_date+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
        </span>
        <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono,monospace' }}>Hoy</span>
      </div>
    </div>
  )
}

const FORM_FIELDS = [
  {key:'body_weight_kg',label:'Peso',unit:'kg',icon:'⚖️',step:'0.1'},
  {key:'body_fat_pct',label:'Grasa corporal',unit:'%',icon:'💧',step:'0.1'},
  {key:'muscle_mass_kg',label:'Masa muscular',unit:'kg',icon:'💪',step:'0.1'},
  {key:'lean_mass_kg',label:'Masa magra',unit:'kg',icon:'🏋️',step:'0.1'},
  {key:'water_pct',label:'Agua corporal',unit:'%',icon:'🫧',step:'0.1'},
  {key:'waist_cm',label:'Cintura',unit:'cm',icon:'📏',step:'0.5'},
  {key:'chest_cm',label:'Pecho',unit:'cm',icon:'📐',step:'0.5'},
  {key:'left_arm_cm',label:'Brazo (izq)',unit:'cm',icon:'💪',step:'0.5'},
]

export default function MetricsPage() {
  const params = useParams()
  const locale = (params?.locale as string)||'es'
  const [history,setHistory] = useState<Metric[]>([])
  const [loading,setLoading] = useState(true)
  const [showForm,setShowForm] = useState(false)
  const [saving,setSaving] = useState(false)
  const [form,setForm] = useState<Record<string,string>>({recorded_date:new Date().toISOString().split('T')[0]})
  const [profileWeight,setProfileWeight] = useState<number|null>(null)
  const [profileHeight,setProfileHeight] = useState<number|null>(null)
  const [notes,setNotes] = useState('')

  useEffect(()=>{
    fetch('/api/body-metrics').then(r=>r.json()).then(d=>{
      setHistory(d.history||[])
      setProfileWeight(d.profile_weight)
      setProfileHeight(d.profile_height)
    }).finally(()=>setLoading(false))
  },[])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const payload: Record<string,any> = {notes}
      for (const [k,v] of Object.entries(form)) {
        if (!v) continue
        payload[k] = k==='recorded_date' ? v : parseFloat(v)
      }
      const res = await fetch('/api/body-metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const data = await res.json()
      if (data.metric) {
        setHistory(prev=>[data.metric,...prev.filter(m=>m.recorded_date!==data.metric.recorded_date)])
        setShowForm(false); setForm({recorded_date:new Date().toISOString().split('T')[0]}); setNotes('')
      }
    } finally { setSaving(false) }
  }

  const latest = history[0]
  const prev = history[1]
  const weightTrend = latest?.body_weight_kg&&prev?.body_weight_kg ? (latest.body_weight_kg-prev.body_weight_kg) : null
  const bmi = (latest?.body_weight_kg||profileWeight)&&profileHeight
    ? (((latest?.body_weight_kg||profileWeight)!)/((profileHeight/100)**2)).toFixed(1) : null

  const KPIs = [
    {label:'Peso',value:latest?.body_weight_kg??profileWeight,unit:'kg',color:ACC,trend:weightTrend,
     sparkline:history.filter(m=>m.body_weight_kg).slice(0,10).reverse().map(m=>m.body_weight_kg!)},
    {label:'Grasa',value:latest?.body_fat_pct,unit:'%',color:'#60A5FA',trend:null,
     sparkline:history.filter(m=>m.body_fat_pct).slice(0,10).reverse().map(m=>m.body_fat_pct!)},
    {label:'Músculo',value:latest?.muscle_mass_kg,unit:'kg',color:'#4ADE80',trend:null,
     sparkline:history.filter(m=>m.muscle_mass_kg).slice(0,10).reverse().map(m=>m.muscle_mass_kg!)},
    {label:'IMC',value:bmi?parseFloat(bmi):null,unit:'',color:bmi&&parseFloat(bmi)<25?'#4ADE80':'#FFA500',trend:null,sparkline:[]},
  ]

  return (
    <div style={{minHeight:'100vh',background:BG,color:T1,paddingBottom:110}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        input,textarea{outline:none;font-family:inherit}
        input:focus,textarea:focus{border-color:var(--accent-color,#C8FF00)!important}
      `}</style>
      <div style={{paddingTop:52}}><AthleteTabBar locale={locale}/></div>

      <div style={{padding:'20px 20px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1 style={{margin:0,fontSize:24,fontWeight:800,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em'}}>⚖️ Métricas</h1>
          <p style={{margin:'4px 0 0',fontSize:13,color:T2}}>
            {history.length} registros · {loading?'...':latest?`Último: ${new Date(latest.recorded_date+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}`:'Sin datos aún'}
          </p>
        </div>
        <button onClick={()=>setShowForm(true)} style={{padding:'10px 16px',background:ACC,color:'#0A0A0F',border:'none',borderRadius:12,fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif',cursor:'pointer'}}>+ Registrar</button>
      </div>

      <div style={{padding:'0 16px 16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {KPIs.map((kpi,i)=>(
          <div key={i} style={{padding:'14px',background:CARD,border:`1px solid ${BDR}`,borderRadius:16,animation:`fadeUp .35s ease-out ${i*60}ms both`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <p style={{margin:0,fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>{kpi.label}</p>
                <p style={{margin:'6px 0 0',fontSize:22,fontWeight:800,color:kpi.color,fontFamily:'DM Mono,monospace',lineHeight:1}}>
                  {loading?'···':kpi.value!=null?`${kpi.value}`:'-'}
                  {kpi.value!=null&&kpi.unit&&<span style={{fontSize:12,color:T3,marginLeft:3}}>{kpi.unit}</span>}
                </p>
                {kpi.trend!=null&&(
                  <p style={{margin:'4px 0 0',fontSize:10,color:kpi.trend<0?'#4ADE80':'#FF6B6B',fontFamily:'DM Mono,monospace'}}>
                    {kpi.trend>0?'+':''}{kpi.trend.toFixed(1)} kg
                  </p>
                )}
              </div>
              {kpi.sparkline.length>=2&&<MiniSparkline values={kpi.sparkline} color={kpi.color}/>}
            </div>
          </div>
        ))}
      </div>

      {history.filter(m=>m.body_weight_kg).length>=2&&(
        <div style={{margin:'0 16px 16px',background:CARD,border:`1px solid ${BDR}`,borderRadius:16,overflow:'hidden',animation:'fadeUp .4s ease-out .2s both'}}>
          <div style={{padding:'14px 16px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:700,color:T2,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>Evolución de Peso</span>
            <span style={{fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>últimas {Math.min(history.filter(m=>m.body_weight_kg).length,20)} med.</span>
          </div>
          <WeightChart history={history}/>
        </div>
      )}

      <div style={{margin:'0 16px',animation:'fadeUp .4s ease-out .3s both'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:13,fontWeight:700,color:T2,fontFamily:'DM Mono,monospace'}}>HISTORIAL</span>
          <span style={{fontSize:11,color:T3}}>{history.length} entradas</span>
        </div>
        {loading?(
          Array.from({length:4}).map((_,i)=><div key={i} style={{height:56,background:CARD,borderRadius:12,marginBottom:8,backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite'}}/>)
        ):history.length===0?(
          <div style={{textAlign:'center',padding:'36px 24px',color:T3}}>
            <div style={{fontSize:40,marginBottom:12}}>📊</div>
            <p style={{margin:0,fontSize:14,color:T2}}>Sin registros aún</p>
            <p style={{margin:'6px 0 16px',fontSize:13}}>Registra tu primera medición</p>
            <button onClick={()=>setShowForm(true)} style={{padding:'12px 24px',background:ACC,color:'#0A0A0F',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer'}}>+ Registrar ahora</button>
          </div>
        ):(
          <div style={{background:CARD,border:`1px solid ${BDR}`,borderRadius:16,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'80px 1fr 60px 60px 60px',padding:'10px 14px',borderBottom:`1px solid ${BDR}`}}>
              {['Fecha','Peso','Grasa','Músculo','IMC'].map(h=>(
                <span key={h} style={{fontSize:9,fontWeight:700,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</span>
              ))}
            </div>
            {history.map((m,i)=>(
              <div key={m.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 60px 60px 60px',padding:'12px 14px',borderBottom:i<history.length-1?`1px solid rgba(255,255,255,.04)`:'none',animation:`fadeUp .3s ease-out ${i*30}ms both`}}>
                <span style={{fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
                  {new Date(m.recorded_date+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                </span>
                <span style={{fontSize:13,fontWeight:700,color:m.body_weight_kg?ACC:T3,fontFamily:'DM Mono,monospace'}}>
                  {m.body_weight_kg?`${m.body_weight_kg} kg`:'—'}
                </span>
                <span style={{fontSize:12,color:T2,fontFamily:'DM Mono,monospace'}}>{m.body_fat_pct?`${m.body_fat_pct}%`:'—'}</span>
                <span style={{fontSize:12,color:T2,fontFamily:'DM Mono,monospace'}}>{m.muscle_mass_kg?`${m.muscle_mass_kg}`:'—'}</span>
                <span style={{fontSize:12,color:T2,fontFamily:'DM Mono,monospace'}}>{m.bmi?`${m.bmi}`:'—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(12px)',zIndex:200,display:'flex',alignItems:'flex-end'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
          <div style={{width:'100%',maxHeight:'90vh',overflow:'auto',background:'#111118',borderRadius:'24px 24px 0 0',border:`1px solid ${BDR}`,padding:'24px 20px 40px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:800,fontFamily:'Syne,sans-serif'}}>Registrar Medición</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:T2,fontSize:22,cursor:'pointer'}}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{fontSize:11,color:T3,fontFamily:'DM Mono,monospace',display:'block',marginBottom:6}}>FECHA</label>
                <input type="date" value={form.recorded_date||''} onChange={e=>setForm(f=>({...f,recorded_date:e.target.value}))}
                  style={{width:'100%',padding:'12px 14px',background:CARD,border:`1px solid ${BDR}`,borderRadius:12,color:T1,fontSize:14,boxSizing:'border-box'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {FORM_FIELDS.map(field=>(
                  <div key={field.key}>
                    <label style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace',display:'block',marginBottom:5}}>
                      {field.icon} {field.label.toUpperCase()} ({field.unit})
                    </label>
                    <input type="number" step={field.step} placeholder="—"
                      value={form[field.key]||''} onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))}
                      style={{width:'100%',padding:'10px 12px',background:CARD,border:`1px solid ${BDR}`,borderRadius:10,color:T1,fontSize:14,boxSizing:'border-box'}}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace',display:'block',marginBottom:5}}>📝 NOTAS</label>
                <textarea placeholder="Observaciones..." value={notes} onChange={e=>setNotes(e.target.value)}
                  rows={2} style={{width:'100%',padding:'10px 12px',background:CARD,border:`1px solid ${BDR}`,borderRadius:10,color:T1,fontSize:14,resize:'none',boxSizing:'border-box'}}/>
              </div>
              <button type="submit" disabled={saving} style={{padding:'14px',background:ACC,color:'#0A0A0F',border:'none',borderRadius:14,fontSize:15,fontWeight:800,fontFamily:'Syne,sans-serif',cursor:saving?'not-allowed':'pointer',opacity:saving?.7:1,marginTop:4}}>
                {saving?'Guardando...':'💾 Guardar Medición'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

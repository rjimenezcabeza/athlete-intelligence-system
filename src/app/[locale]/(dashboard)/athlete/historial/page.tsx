'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AthleteTabBar } from '@/components/athlete/AthleteTabBar'
import Link from 'next/link'

const BG='var(--bg-primary,#0A0A0F)',CARD='var(--card-bg,rgba(255,255,255,.04))',BDR='var(--card-border,rgba(255,255,255,.08))',T1='var(--text-primary,#fff)',T2='var(--text-secondary,#888)',T3='var(--text-tertiary,#44445a)',ACC='var(--accent-color,#C8FF00)'

interface SessionRow {
  id: string; session_date: string; duration_minutes: number|null; day_label: string|null;
  pump_rating: number|null; local_fatigue: number|null; perceived_recovery: number|null;
  performance_rating: number|null; readiness_score: number|null; body_weight_kg: number|null;
  volume_kg?: number; sets_count?: number; exercises_count?: number; notes: string|null;
}

function RatingDot({ value, max=10, color }: { value: number|null; max?: number; color: string }) {
  if (!value) return <span style={{color:T3,fontFamily:'DM Mono,monospace',fontSize:12}}>—</span>
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',
      width:26,height:26,borderRadius:8,background:`${color}18`,
      color,fontWeight:800,fontSize:12,fontFamily:'DM Mono,monospace',
    }}>{value}</span>
  )
}

function VolumeBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max((value/max)*100, 4) : 0
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <div style={{width:40,height:6,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:ACC,borderRadius:3}}/>
      </div>
      <span style={{fontSize:11,color:ACC,fontFamily:'DM Mono,monospace',whiteSpace:'nowrap'}}>
        {value>=1000?`${(value/1000).toFixed(1)}k`:value}
      </span>
    </div>
  )
}

export default function HistorialAtletaPage() {
  const params = useParams()
  const locale = (params?.locale as string)||'es'
  const [sessions,setSessions] = useState<SessionRow[]>([])
  const [loading,setLoading] = useState(true)
  const [sort,setSort] = useState<'date'|'volume'|'duration'>('date')
  const [filter,setFilter] = useState<'all'|'month'|'3month'>('3month')

  useEffect(()=>{
    fetch('/api/sessions/history?limit=100').then(r=>r.json()).then(d=>{
      setSessions(d.sessions||[])
    }).catch(()=>setSessions([])).finally(()=>setLoading(false))
  },[])

  const now = new Date()
  const filtered = sessions.filter(s=>{
    if (filter==='all') return true
    const days = filter==='month'?30:90
    const cutoff = new Date(now.getTime()-days*24*60*60*1000)
    return new Date(s.session_date)>=cutoff
  })

  const sorted = [...filtered].sort((a,b)=>{
    if (sort==='volume') return (b.volume_kg||0)-(a.volume_kg||0)
    if (sort==='duration') return (b.duration_minutes||0)-(a.duration_minutes||0)
    return new Date(b.session_date).getTime()-new Date(a.session_date).getTime()
  })

  const maxVol = Math.max(...sorted.map(s=>s.volume_kg||0),1)
  const totalVol = filtered.reduce((s,r)=>s+(r.volume_kg||0),0)
  const avgDuration = filtered.length ? Math.round(filtered.reduce((s,r)=>s+(r.duration_minutes||0),0)/filtered.filter(r=>r.duration_minutes).length||0) : 0
  const avgPump = filtered.filter(r=>r.pump_rating).length ? Math.round(filtered.reduce((s,r)=>s+(r.pump_rating||0),0)/filtered.filter(r=>r.pump_rating).length*10)/10 : null

  const fmtDate = (d: string) => new Date(d+'T12:00:00Z').toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'2-digit'})

  return (
    <div style={{minHeight:'100vh',background:BG,color:T1,paddingBottom:110}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .row-hover:hover{background:rgba(255,255,255,.03)!important}
      `}</style>
      <div style={{paddingTop:52}}><AthleteTabBar locale={locale}/></div>

      <div style={{padding:'20px 20px 16px'}}>
        <h1 style={{margin:0,fontSize:24,fontWeight:800,fontFamily:'Syne,sans-serif',letterSpacing:'-0.02em'}}>📋 Historial de Entrenamientos</h1>
        <p style={{margin:'4px 0 0',fontSize:13,color:T2}}>{filtered.length} sesiones</p>
      </div>

      {/* Summary KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,padding:'0 16px 16px',animation:'fadeUp .35s ease-out .1s both'}}>
        {[
          {label:'Total',value:filtered.length.toString(),unit:'sesiones',color:ACC},
          {label:'Volumen',value:totalVol>=1000?`${(totalVol/1000).toFixed(0)}k`:`${totalVol}`,unit:'kg',color:'#60A5FA'},
          {label:'Duración media',value:avgDuration?`${avgDuration}`:'—',unit:avgDuration?'min':'',color:'#A78BFA'},
        ].map((kpi,i)=>(
          <div key={i} style={{padding:'12px',background:CARD,border:`1px solid ${BDR}`,borderRadius:14,textAlign:'center'}}>
            <p style={{margin:0,fontSize:9,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.1em'}}>{kpi.label}</p>
            <p style={{margin:'6px 0 0',fontSize:18,fontWeight:800,color:kpi.color,fontFamily:'DM Mono,monospace',lineHeight:1}}>
              {kpi.value}<span style={{fontSize:10,color:T3,marginLeft:2}}>{kpi.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Filters + Sort */}
      <div style={{padding:'0 16px 14px',display:'flex',gap:8,justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',gap:6}}>
          {(['3month','month','all'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'6px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'DM Mono,monospace',
              background:filter===f?ACC:'rgba(255,255,255,.06)',color:filter===f?'#0A0A0F':T3,
            }}>
              {f==='3month'?'3 meses':f==='month'?'1 mes':'Todo'}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value as any)}
          style={{padding:'6px 10px',background:CARD,border:`1px solid ${BDR}`,borderRadius:10,color:T2,fontSize:11,fontFamily:'DM Mono,monospace'}}>
          <option value="date">Por fecha</option>
          <option value="volume">Por volumen</option>
          <option value="duration">Por duración</option>
        </select>
      </div>

      {/* Table */}
      <div style={{margin:'0 16px',animation:'fadeUp .4s ease-out .2s both'}}>
        {loading?(
          Array.from({length:6}).map((_,i)=><div key={i} style={{height:60,background:CARD,borderRadius:12,marginBottom:8,backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite'}}/>)
        ):sorted.length===0?(
          <div style={{textAlign:'center',padding:'40px 24px',color:T3}}>
            <div style={{fontSize:44,marginBottom:12}}>🏋️</div>
            <p style={{margin:0,fontSize:15,color:T2}}>Sin sesiones en este período</p>
            <Link href={`/${locale}/session/new`} style={{display:'inline-block',marginTop:16,padding:'12px 24px',background:ACC,color:'#0A0A0F',borderRadius:12,fontSize:14,fontWeight:700,textDecoration:'none'}}>
              + Nueva sesión
            </Link>
          </div>
        ):(
          <div style={{background:CARD,border:`1px solid ${BDR}`,borderRadius:16,overflow:'hidden'}}>
            {/* Header */}
            <div style={{display:'grid',gridTemplateColumns:'90px 1fr 70px 50px 40px 40px',padding:'10px 12px',borderBottom:`1px solid ${BDR}`,gap:4}}>
              {['Fecha','Volumen','Dur.','Pump','Fat.','Rec.'].map(h=>(
                <span key={h} style={{fontSize:9,fontWeight:700,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</span>
              ))}
            </div>
            {sorted.map((s,i)=>(
              <Link key={s.id} href={`/${locale}/session/${s.id}/feedback`} style={{textDecoration:'none',color:'inherit'}}>
                <div className="row-hover" style={{
                  display:'grid',gridTemplateColumns:'90px 1fr 70px 50px 40px 40px',
                  padding:'12px',gap:4,
                  borderBottom:i<sorted.length-1?`1px solid rgba(255,255,255,.04)`:'none',
                  transition:'background .15s',
                  animation:`fadeUp .3s ease-out ${Math.min(i,15)*25}ms both`,
                }}>
                  <div>
                    <p style={{margin:0,fontSize:11,color:T1,fontFamily:'DM Mono,monospace',fontWeight:600}}>{fmtDate(s.session_date)}</p>
                    {s.day_label&&<p style={{margin:'2px 0 0',fontSize:10,color:T3}}>{s.day_label}</p>}
                  </div>
                  <div>{s.volume_kg?<VolumeBar value={s.volume_kg} max={maxVol}/>:<span style={{fontSize:12,color:T3}}>—</span>}</div>
                  <span style={{fontSize:11,color:T2,fontFamily:'DM Mono,monospace',alignSelf:'center'}}>
                    {s.duration_minutes?`${s.duration_minutes}'`:'—'}
                  </span>
                  <div style={{alignSelf:'center'}}><RatingDot value={s.pump_rating} color="#FF6B6B"/></div>
                  <div style={{alignSelf:'center'}}><RatingDot value={s.local_fatigue} color="#FFA500"/></div>
                  <div style={{alignSelf:'center'}}><RatingDot value={s.perceived_recovery} color="#4ADE80"/></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      {sorted.length>0&&(
        <div style={{margin:'12px 16px 0',display:'flex',gap:16,flexWrap:'wrap'}}>
          {[{label:'Pump',color:'#FF6B6B'},{label:'Fatiga',color:'#FFA500'},{label:'Rec.',color:'#4ADE80'}].map(l=>(
            <span key={l.label} style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace',display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:l.color,display:'inline-block'}}/>
              {l.label} (1-10)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

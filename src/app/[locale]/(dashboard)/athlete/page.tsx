'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BG   = 'var(--bg-primary,#0A0A0F)'
const CARD = 'var(--card-bg,rgba(255,255,255,0.04))'
const BDR  = 'var(--card-border,rgba(255,255,255,0.08))'
const T1   = 'var(--text-primary,#fff)'
const T2   = 'var(--text-secondary,#888)'
const T3   = 'var(--text-tertiary,#44445a)'
const ACC  = 'var(--accent-color,#C8FF00)'

interface AthleteData {
  profile: {
    displayName: string | null
    bodyWeightKg: number | null
    heightCm?: number | null
    trainingExperienceYears: number | null
    primaryGoal: string | null
    trainingSplitDetected: string | null
    trainingDaysDetected: number | null
    avatarUrl: string | null
  }
  nutrition: {
    caloriesTarget: number | null
    proteinG: number | null
    carbsG: number | null
    fatG: number | null
    mealsPerDay: number | null
    nutritionNotes: string | null
  }
  latestImport: {
    id: string
    filename: string
    confidence: number
    extractedData: any
    uploadedAt: string
  } | null
  stats: {
    totalSessions: number
    totalPRs: number
    activeMesocycle: string | null
    lastSessionDate: string | null
    currentStreak?: number
  }
}

const Skel = ({ h, w = '100%' }: { h: number; w?: string }) => (
  <div style={{
    height: h, width: w,
    background: 'linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: 10,
  }} />
)

export default function AthletePage() {
  const params  = useParams()
  const locale  = (params?.locale as string) || 'es'
  const isEs    = locale !== 'en'
  const [data, setData]       = useState<AthleteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/athlete/profile-summary')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const ed           = data?.latestImport?.extractedData
  const program      = ed?.training_program
  const programDays: any[]  = program?.days ?? []
  const supplements: any[]  = ed?.supplements ?? []
  const hasNutrition  = !!data?.nutrition?.caloriesTarget
  const hasProgram    = programDays.length > 0
  const hasSupplements = supplements.length > 0

  const kpis = [
    { label: isEs ? 'Sesiones' : 'Sessions', value: data?.stats?.totalSessions ?? 0, color: T1 },
    { label: 'PRs', value: data?.stats?.totalPRs ?? 0, color: ACC },
    { label: isEs ? 'Racha' : 'Streak', value: `${data?.stats?.currentStreak ?? 0}d`, color: '#FFC107' },
  ]

  const cards = [
    {
      id: 'program', icon: '💪',
      title: isEs ? 'Programa' : 'Program',
      sub: hasProgram ? `${program?.split_type ?? ''} · ${programDays.length} ${isEs ? 'días' : 'days'}` : isEs ? 'Sin datos' : 'No data',
      preview: hasProgram
        ? programDays.slice(0, 3).map((d: any) => d.day_label || `Día ${d.day_number}`).join(' · ')
        : isEs ? 'Importa tu programa de entreno' : 'Import your training plan',
      hasData: hasProgram, href: `/${locale}/athlete/program`, accentColor: '#4ADE80',
    },
    {
      id: 'nutrition', icon: '🥗',
      title: isEs ? 'Nutrición' : 'Nutrition',
      sub: hasNutrition ? `${data!.nutrition.caloriesTarget} kcal/día` : isEs ? 'Sin datos' : 'No data',
      preview: hasNutrition
        ? `P:${data!.nutrition.proteinG}g · C:${data!.nutrition.carbsG}g · G:${data!.nutrition.fatG}g`
        : isEs ? 'Importa tu plan nutricional' : 'Import your nutrition plan',
      hasData: hasNutrition, href: `/${locale}/athlete/nutrition`, accentColor: '#FFA500',
    },
    {
      id: 'supplements', icon: '💊',
      title: isEs ? 'Suplementos' : 'Supplements',
      sub: hasSupplements ? `${supplements.length} ${isEs ? 'productos' : 'products'}` : isEs ? 'Sin datos' : 'No data',
      preview: hasSupplements
        ? supplements.slice(0, 2).map((s: any) => s.name).join(', ')
        : isEs ? 'Extrae tu pila de suplementos' : 'Extract your supplement stack',
      hasData: hasSupplements, href: `/${locale}/athlete/nutrition#supplements`, accentColor: '#A78BFA',
    },
    {
      id: 'metrics', icon: '⚖️',
      title: isEs ? 'Métricas' : 'Metrics',
      sub: data?.profile?.bodyWeightKg ? `${data.profile.bodyWeightKg} kg` : isEs ? 'Sin datos' : 'No data',
      preview: data?.profile?.heightCm
        ? `${data.profile.heightCm}cm · ${data.profile.trainingExperienceYears ?? '?'} ${isEs ? 'años exp.' : 'yrs exp.'}`
        : isEs ? 'Peso, talla, experiencia' : 'Weight, height, experience',
      hasData: !!data?.profile?.bodyWeightKg, href: `/${locale}/athlete/metrics`, accentColor: '#38BDF8',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 100 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .card-tap { transition: transform .13s; }
        .card-tap:active { transform: scale(0.96); }
      `}</style>

      {/* HEADER */}
      <div style={{ padding:'52px 20px 16px', animation:'fadeUp .35s ease-out' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
          <div style={{
            width:52, height:52, borderRadius:'50%', flexShrink:0,
            background: data?.profile?.avatarUrl ? 'transparent' : 'rgba(255,255,255,.06)',
            border:`2px solid ${BDR}`, overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {loading ? <Skel h={52} w="52px" /> :
              data?.profile?.avatarUrl
                ? <img src={data.profile.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <span style={{fontSize:18,fontWeight:800,color:ACC,fontFamily:'Syne,sans-serif'}}>
                    {data?.profile?.displayName?.[0]?.toUpperCase() ?? 'A'}
                  </span>
            }
          </div>
          <div style={{flex:1,minWidth:0}}>
            {loading ? <Skel h={20} w="140px" /> :
              <h1 style={{margin:0,fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',color:T1,letterSpacing:'-0.02em'}}>
                {data?.profile?.displayName ?? (isEs ? 'Mi perfil' : 'My profile')}
              </h1>
            }
            <p style={{margin:'3px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
              {data?.profile?.primaryGoal ?? 'hypertrophy'}
              {data?.profile?.trainingSplitDetected ? ` · ${data.profile.trainingSplitDetected}` : ''}
              {data?.profile?.trainingExperienceYears ? ` · ${data.profile.trainingExperienceYears} ${isEs?'años':'yrs'}` : ''}
            </p>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {kpis.map(k => (
            <div key={k.label} style={{background:CARD,border:`1px solid ${BDR}`,borderRadius:12,padding:'10px 0',textAlign:'center'}}>
              {loading ? <div style={{display:'flex',justifyContent:'center'}}><Skel h={22} w="60%"/></div> :
                <p style={{margin:0,fontFamily:'DM Mono,monospace',fontSize:22,fontWeight:700,color:k.color}}>{k.value}</p>
              }
              <p style={{margin:'3px 0 0',fontSize:9,color:T3,fontFamily:'Syne,sans-serif',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase'}}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:'0 16px',animation:'fadeUp .45s ease-out .1s both'}}>

        {/* PENDING IMPORT BANNER */}
        {!loading && data?.latestImport && (
          <div style={{
            marginBottom:14,padding:'12px 14px',
            background:'rgba(200,255,0,.05)',border:'1px solid rgba(200,255,0,.18)',
            borderRadius:12,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,
          }}>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:11,color:ACC,fontFamily:'DM Mono,monospace',fontWeight:600}}>
                {'📎 '}{isEs?'Archivo analizado':'Analyzed file'}
                <span style={{marginLeft:8,opacity:.6}}>{Math.round((data.latestImport.confidence||0)*100)}% precisión</span>
              </p>
              <p style={{margin:'2px 0 0',fontSize:11,color:T2,fontFamily:'DM Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {data.latestImport.filename}
              </p>
            </div>
            <Link href={`/${locale}/import`} style={{
              padding:'6px 14px',borderRadius:8,background:ACC,
              color:'#0A0A0F',fontSize:11,fontWeight:700,fontFamily:'Syne,sans-serif',
              textDecoration:'none',whiteSpace:'nowrap',flexShrink:0,
            }}>
              {isEs?'Ver →':'View →'}
            </Link>
          </div>
        )}

        {/* CARDS GRID 2×2 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          {cards.map((card,i)=>(
            <Link key={card.id} href={card.href} style={{textDecoration:'none'}}>
              <div className="card-tap" style={{
                padding:'16px 14px',background:CARD,border:`1px solid ${BDR}`,borderRadius:16,
                display:'flex',flexDirection:'column',gap:8,minHeight:130,
                position:'relative',overflow:'hidden',
                animation:`fadeUp .4s ease-out ${i*60+200}ms both`,
              }}>
                {card.hasData && (
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${card.accentColor},transparent)`,borderRadius:'16px 16px 0 0'}}/>
                )}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <span style={{fontSize:26}}>{card.icon}</span>
                  {card.hasData && <div style={{width:8,height:8,borderRadius:'50%',background:card.accentColor}}/>}
                </div>
                <div>
                  <p style={{margin:0,fontSize:13,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif'}}>{card.title}</p>
                  <p style={{margin:'2px 0 0',fontSize:11,color:card.hasData?card.accentColor:T3,fontFamily:'DM Mono,monospace'}}>{card.sub}</p>
                </div>
                <p style={{margin:0,fontSize:10,color:T3,fontFamily:'DM Mono,monospace',lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                  {loading?'···':card.preview}
                </p>
                <div style={{position:'absolute',bottom:12,right:12,fontSize:14,color:T3}}>→</div>
              </div>
            </Link>
          ))}
        </div>

        {/* COACH IA BANNER */}
        <Link href={`/${locale}/coach`} style={{textDecoration:'none',display:'block',marginBottom:12}}>
          <div className="card-tap" style={{
            padding:'16px 20px',
            background:'linear-gradient(135deg,rgba(200,255,0,.07),rgba(200,255,0,.03))',
            border:'1px solid rgba(200,255,0,.20)',borderRadius:16,
            display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
            animation:'fadeUp .4s ease-out 440ms both',
          }}>
            <div>
              <p style={{margin:0,fontSize:14,fontWeight:800,color:T1,fontFamily:'Syne,sans-serif'}}>
                {'🤖 '}{isEs?'Coach IA':'AI Coach'}
              </p>
              <p style={{margin:'4px 0 0',fontSize:11,color:T2,fontFamily:'DM Mono,monospace'}}>
                {isEs?'Analiza tu historial y te guía':'Analyzes your history and guides you'}
              </p>
            </div>
            <div style={{padding:'10px 18px',background:ACC,borderRadius:10,color:'#0A0A0F',fontSize:12,fontWeight:700,fontFamily:'Syne,sans-serif',whiteSpace:'nowrap',flexShrink:0}}>
              {isEs?'Hablar →':'Chat →'}
            </div>
          </div>
        </Link>

        {/* IMPORT CTA if no import */}
        {!loading && !data?.latestImport && (
          <Link href={`/${locale}/import`} style={{textDecoration:'none',display:'block',animation:'fadeUp .4s ease-out 500ms both'}}>
            <div style={{padding:'20px',textAlign:'center',background:CARD,border:`1px dashed ${BDR}`,borderRadius:16}}>
              <p style={{fontSize:28,margin:'0 0 8px'}}>📎</p>
              <p style={{margin:0,fontSize:14,fontWeight:700,color:ACC,fontFamily:'Syne,sans-serif'}}>
                {isEs?'Importa tu programa':'Import your program'}
              </p>
              <p style={{margin:'4px 0 0',fontSize:11,color:T2,fontFamily:'DM Mono,monospace'}}>
                {isEs?'PDF · Imagen · Excel — la IA extrae todo automáticamente':'PDF · Image · Excel — AI extracts everything automatically'}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}

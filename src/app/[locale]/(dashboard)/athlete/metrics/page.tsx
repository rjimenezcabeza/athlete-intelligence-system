'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AthleteTabBar } from '@/components/athlete/AthleteTabBar'

const BG=`var(--bg-primary,#0A0A0F)`,CARD=`var(--card-bg,rgba(255,255,255,.04))`,BDR=`var(--card-border,rgba(255,255,255,.08))`,T1=`var(--text-primary,#fff)`,T2=`var(--text-secondary,#888)`,T3=`var(--text-tertiary,#44445a)`,ACC=`var(--accent-color,#C8FF00)`

export default function MetricsPage() {
  const params = useParams()
  const locale = (params?.locale as string)||'es'
  const isEs = locale!=='en'
  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/athlete/profile-summary')
      .then(r=>r.json()).then(setData).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const p = data?.profile
  const bmi = p?.bodyWeightKg&&p?.heightCm ? (p.bodyWeightKg/((p.heightCm/100)**2)).toFixed(1) : null
  const bmiLabel = !bmi ? '-' : Number(bmi)<18.5?'Bajo':(Number(bmi)<25?'Normal':(Number(bmi)<30?'Sobrepeso':'Obesidad'))

  const rows = [
    {icon:'⚖️', label:isEs?'Peso corporal':'Body weight', value:p?.bodyWeightKg?`${p.bodyWeightKg} kg`:'-', color:ACC},
    {icon:'📏', label:isEs?'Talla':'Height', value:p?.heightCm?`${p.heightCm} cm`:'-', color:T1},
    {icon:'📊', label:'IMC / BMI', value:bmi?`${bmi} — ${bmiLabel}`:'-', color:bmi&&Number(bmi)<25?'#4ADE80':'#FFA500'},
    {icon:'🗓️', label:isEs?'Fecha de nacimiento':'Date of birth', value:p?.dateOfBirth||'-', color:T1},
    {icon:'🎯', label:isEs?'Objetivo principal':'Primary goal', value:p?.primaryGoal||'-', color:T1},
    {icon:'💪', label:isEs?'Años de experiencia':'Training experience', value:p?.trainingExperienceYears?`${p.trainingExperienceYears} ${isEs?'años':'years'}`:'-', color:T1},
    {icon:'🧬', label:isEs?'Género':'Gender', value:p?.gender||'-', color:T1},
    {icon:'📅', label:isEs?'Días/semana detectados':'Detected days/week', value:p?.trainingDaysDetected?`${p.trainingDaysDetected} ${isEs?'días':'days'}`:'-', color:T1},
  ]

  return (
    <div style={{minHeight:'100vh',background:BG,color:T1,paddingBottom:100}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{paddingTop:52}}>
        <AthleteTabBar locale={locale} />
      </div>

      <div style={{padding:'16px 20px 12px',background:`linear-gradient(180deg,rgba(56,189,248,.06) 0%,transparent 100%)`}}>
        <h1 style={{margin:0,fontSize:22,fontWeight:800,fontFamily:'Syne,sans-serif',color:T1,letterSpacing:'-0.02em'}}>
          {'⚖️ '}{isEs?'Métricas Corporales':'Body Metrics'}
        </h1>
      </div>

      <div style={{padding:'0 16px',animation:'fadeUp .4s ease-out .1s both'}}>
        {/* Big weight display if available */}
        {!loading&&p?.bodyWeightKg&&(
          <div style={{padding:'20px',background:`linear-gradient(135deg,rgba(56,189,248,.08),rgba(56,189,248,.03))`,border:'1px solid rgba(56,189,248,.2)',borderRadius:16,textAlign:'center',marginBottom:16}}>
            <p style={{margin:0,fontSize:52,fontWeight:800,color:'#38BDF8',fontFamily:'DM Mono,monospace',lineHeight:1}}>{p.bodyWeightKg}</p>
            <p style={{margin:'4px 0 0',fontSize:13,color:T2,fontFamily:'Syne,sans-serif'}}>kg</p>
          </div>
        )}

        {/* Metrics list */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {rows.map((row,i)=>(
            <div key={i} style={{
              padding:'14px 16px',background:CARD,border:`1px solid ${BDR}`,borderRadius:14,
              display:'flex',alignItems:'center',gap:14,
              animation:`fadeUp .4s ease-out ${i*40+100}ms both`,
            }}>
              <span style={{fontSize:22,flexShrink:0}}>{row.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>{row.label}</p>
                <p style={{margin:'3px 0 0',fontSize:14,fontWeight:600,color:row.color,fontFamily:'DM Mono,monospace'}}>
                  {loading?'···':row.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Edit link */}
        <div style={{marginTop:20,textAlign:'center'}}>
          <Link href={`/${locale}/profile`} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',background:CARD,border:`1px solid ${BDR}`,borderRadius:12,color:T2,fontSize:13,fontFamily:'DM Mono,monospace',textDecoration:'none'}}>
            ✏️ {isEs?'Editar en Perfil':'Edit in Profile'}
          </Link>
        </div>
      </div>
    </div>
  )
}

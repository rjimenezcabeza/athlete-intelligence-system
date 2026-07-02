'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BG=`var(--bg-primary,#0A0A0F)`,CARD=`var(--card-bg,rgba(255,255,255,.04))`,BDR=`var(--card-border,rgba(255,255,255,.08))`,T1=`var(--text-primary,#fff)`,T2=`var(--text-secondary,#888)`,T3=`var(--text-tertiary,#44445a)`,ACC=`var(--accent-color,#C8FF00)`

function MacroRow({ label, value, unit, color, pct }: { label:string, value:any, unit:string, color:string, pct?:number }) {
  if (value == null) return null
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid rgba(255,255,255,.04)`}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
        <span style={{fontSize:13,color:T2,fontFamily:'DM Mono,monospace'}}>{label}</span>
      </div>
      <div style={{textAlign:'right'}}>
        <span style={{fontSize:15,fontWeight:700,color,fontFamily:'DM Mono,monospace'}}>{value}</span>
        <span style={{fontSize:11,color:T3,marginLeft:3,fontFamily:'DM Mono,monospace'}}>{unit}</span>
        {pct!=null&&pct>0&&<span style={{fontSize:10,color:T3,marginLeft:6,fontFamily:'DM Mono,monospace'}}>({pct}%)</span>}
      </div>
    </div>
  )
}

function NutritionCard({ title, icon, nut, color, isEs }: { title:string, icon:string, nut:any, color:string, isEs:boolean }) {
  if (!nut || !nut.caloriesTarget) return null
  const cal = nut.caloriesTarget
  const macros = [
    { label: isEs?'Proteína':'Protein', value: nut.proteinG, unit:'g', color:'#4ADE80', pct: nut.proteinG ? Math.round(nut.proteinG*4/cal*100) : 0 },
    { label: isEs?'Carbohidratos':'Carbs', value: nut.carbsG, unit:'g', color:'#FBBF24', pct: nut.carbsG ? Math.round(nut.carbsG*4/cal*100) : 0 },
    { label: isEs?'Grasas':'Fats', value: nut.fatG, unit:'g', color:'#60A5FA', pct: nut.fatG ? Math.round(nut.fatG*9/cal*100) : 0 },
    { label: isEs?'Fibra':'Fiber', value: nut.fiberG, unit:'g', color:'#A78BFA', pct: null },
  ]
  const filledMacros = macros.filter(m => m.value != null)
  return (
    <div style={{background:CARD,border:`1px solid ${color}30`,borderRadius:16,marginBottom:12,overflow:'hidden'}}>
      <div style={{background:`linear-gradient(135deg,${color}10,${color}04)`,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${color}18`}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>{icon}</span>
          <div>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif'}}>{title}</p>
            {nut.mealsPerDay&&<p style={{margin:0,fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>{nut.mealsPerDay} {isEs?'comidas/día':'meals/day'}</p>}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{margin:0,fontSize:30,fontWeight:800,color,fontFamily:'DM Mono,monospace',lineHeight:1}}>{cal.toLocaleString()}</p>
          <p style={{margin:0,fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>kcal</p>
        </div>
      </div>
      {/* Macro bar */}
      {filledMacros.filter(m=>m.pct&&m.pct>0).length>=2&&(
        <div style={{padding:'10px 16px 0'}}>
          <div style={{height:5,borderRadius:100,overflow:'hidden',display:'flex',gap:2}}>
            {filledMacros.filter(m=>m.pct&&m.pct>0).map(m=>(
              <div key={m.label} style={{flex:m.pct,background:m.color,minWidth:4}}/>
            ))}
          </div>
        </div>
      )}
      <div style={{padding:'2px 16px 12px'}}>
        {filledMacros.map(m=>(
          <MacroRow key={m.label} label={m.label} value={m.value} unit={m.unit} color={m.color} pct={m.pct||undefined}/>
        ))}
      </div>
      {nut.notes&&(
        <div style={{padding:'10px 16px 14px',borderTop:`1px solid rgba(255,255,255,.04)`}}>
          <p style={{margin:0,fontSize:11,color:T3,fontFamily:'DM Mono,monospace',lineHeight:1.5}}>{nut.notes}</p>
        </div>
      )}
    </div>
  )
}

function SupplementCard({ sup, isEs }: { sup:any, isEs:boolean }) {
  const icons: Record<string,string> = {
    creatina:'⚡', proteina:'💪', cafeina:'☕', omega:'🐟', vitamina:'💊',
    zinc:'🔋', magnesio:'🪨','pre-workout':'🔥', aminoacidos:'🧬', bcaa:'🧬',
    glutamina:'🌿', colageno:'🦴', melatonina:'🌙', default:'💊'
  }
  const getIcon = (name:string) => {
    const lower = name.toLowerCase()
    for (const [k,v] of Object.entries(icons)) if (lower.includes(k)) return v
    return icons.default
  }
  return (
    <div style={{padding:'12px 14px',background:CARD,border:'1px solid rgba(167,139,250,.12)',borderRadius:14,display:'flex',gap:12,alignItems:'center'}}>
      <div style={{width:38,height:38,borderRadius:10,background:'rgba(167,139,250,.08)',border:'1px solid rgba(167,139,250,.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
        {getIcon(sup.name||'')}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:13,fontWeight:600,color:T1,fontFamily:'Syne,sans-serif'}}>{sup.name}</p>
        <div style={{display:'flex',gap:8,marginTop:2,flexWrap:'wrap'}}>
          {sup.dose&&<span style={{fontSize:10,color:'#A78BFA',fontFamily:'DM Mono,monospace'}}>{sup.dose}</span>}
          {sup.timing&&<span style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>· {sup.timing}</span>}
          {sup.frequency&&<span style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>· {sup.frequency}</span>}
          {sup.form&&<span style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>· {sup.form}</span>}
        </div>
        {sup.purpose&&<p style={{margin:'3px 0 0',fontSize:11,color:T2,fontFamily:'DM Mono,monospace',lineHeight:1.3}}>{sup.purpose}</p>}
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const params = useParams()
  const locale = (params?.locale as string)||'es'
  const isEs = locale!=='en'
  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/athlete/profile-summary')
      .then(r=>r.json()).then(setData).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const nut = data?.nutrition
  const nutRest = data?.nutritionRestDay
  const supplements: any[] = data?.supplements ?? []
  const nutritionNotes: string|null = data?.nutritionNotes ?? null
  const hasAnyNutrition = !!(nut?.caloriesTarget || nutRest?.caloriesTarget)
  const hasSupplements = supplements.length > 0

  // Water goal — pick from training day first, then rest day
  const waterMl = nut?.waterMl ?? nutRest?.waterMl ?? null

  return (
    <div style={{minHeight:'100vh',background:BG,color:T1,paddingBottom:100}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* HEADER */}
      <div style={{padding:'52px 20px 16px',background:`linear-gradient(180deg,rgba(255,165,0,.07) 0%,transparent 100%)`}}>
        <Link href={`/${locale}/athlete`} style={{display:'inline-flex',alignItems:'center',gap:6,color:T3,fontSize:12,fontFamily:'DM Mono,monospace',textDecoration:'none',marginBottom:16}}>
          ← {isEs?'Volver':'Back'}
        </Link>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,fontFamily:'Syne,sans-serif',color:T1,letterSpacing:'-0.02em'}}>
          🥗 {isEs?'Nutrición & Suplementos':'Nutrition & Supplements'}
        </h1>
        {data?.latestImport && (
          <p style={{margin:'6px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
            {data.latestImport.filename} · {Math.round((data.latestImport.confidence||0)*100)}% {isEs?'confianza':'confidence'}
          </p>
        )}
      </div>

      <div style={{padding:'0 16px',animation:'fadeUp .4s ease-out .1s both'}}>
        {loading ? (
          [1,2,3].map(i=>(
            <div key={i} style={{height:120,background:CARD,border:`1px solid ${BDR}`,borderRadius:16,marginBottom:10,opacity:0.4}}/>
          ))
        ) : !hasAnyNutrition && !hasSupplements ? (
          <div style={{textAlign:'center',padding:'60px 0'}}>
            <p style={{fontSize:36,margin:'0 0 12px'}}>🥗</p>
            <p style={{fontSize:14,color:T2,fontFamily:'Syne,sans-serif',marginBottom:8}}>
              {isEs?'Sin datos de nutrición':'No nutrition data'}
            </p>
            <p style={{fontSize:12,color:T3,fontFamily:'DM Mono,monospace',marginBottom:20}}>
              {isEs?'Importa un archivo con tu plan nutricional y suplementación':'Import a file with your nutrition plan and supplements'}
            </p>
            <Link href={`/${locale}/import`} style={{display:'inline-block',padding:'12px 24px',background:ACC,borderRadius:12,color:'#0A0A0F',fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',textDecoration:'none'}}>
              {isEs?'Importar →':'Import →'}
            </Link>
          </div>
        ) : (
          <>
            {/* Water goal banner if present */}
            {waterMl!=null&&(
              <div style={{background:`linear-gradient(135deg,rgba(56,189,248,.08),rgba(56,189,248,.03))`,border:'1px solid rgba(56,189,248,.2)',borderRadius:14,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:24}}>💧</span>
                <div>
                  <p style={{margin:0,fontSize:12,color:'#38BDF8',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                    {isEs?'Objetivo de agua':'Water goal'}
                  </p>
                  <p style={{margin:0,fontSize:20,fontWeight:800,color:'#38BDF8',fontFamily:'DM Mono,monospace'}}>
                    {waterMl>=1000?`${(waterMl/1000).toFixed(1)}L`:`${waterMl}ml`}
                    <span style={{fontSize:11,color:'rgba(56,189,248,.5)',marginLeft:6}}>{isEs?'/día':'/day'}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Training day nutrition */}
            <NutritionCard
              title={isEs?'Día de Entrenamiento':'Training Day'}
              icon="🏋️"
              nut={nut}
              color="#4ADE80"
              isEs={isEs}
            />

            {/* Rest day nutrition */}
            {nutRest?.caloriesTarget&&(
              <NutritionCard
                title={isEs?'Día de Descanso':'Rest Day'}
                icon="😴"
                nut={nutRest}
                color="#FBBF24"
                isEs={isEs}
              />
            )}

            {/* Global nutrition notes */}
            {nutritionNotes&&(
              <div style={{padding:'12px 14px',background:CARD,border:`1px solid ${BDR}`,borderRadius:14,marginBottom:12}}>
                <p style={{margin:'0 0 4px',fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em'}}>
                  {isEs?'Notas nutricionales':'Nutrition notes'}
                </p>
                <p style={{margin:0,fontSize:12,color:T2,fontFamily:'DM Mono,monospace',lineHeight:1.6}}>{nutritionNotes}</p>
              </div>
            )}

            {/* Supplements section */}
            {hasSupplements&&(
              <div style={{marginTop:8}}>
                <p style={{margin:'0 0 10px',fontSize:11,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.1em',fontWeight:700}}>
                  💊 {isEs?`Stack de suplementos (${supplements.length})`:`Supplement stack (${supplements.length})`}
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {supplements.map((sup:any,i:number)=>(
                    <SupplementCard key={i} sup={sup} isEs={isEs}/>
                  ))}
                </div>
              </div>
            )}

            {/* Link to import more */}
            <div style={{marginTop:20,textAlign:'center'}}>
              <Link href={`/${locale}/import`} style={{fontSize:12,color:T3,fontFamily:'DM Mono,monospace',textDecoration:'none'}}>
                {isEs?'Actualizar con nuevo archivo →':'Update with new file →'}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

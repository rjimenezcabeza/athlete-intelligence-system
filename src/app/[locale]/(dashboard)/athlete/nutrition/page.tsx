'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BG=`var(--bg-primary,#0A0A0F)`,CARD=`var(--card-bg,rgba(255,255,255,.04))`,BDR=`var(--card-border,rgba(255,255,255,.08))`,T1=`var(--text-primary,#fff)`,T2=`var(--text-secondary,#888)`,T3=`var(--text-tertiary,#44445a)`,ACC=`var(--accent-color,#C8FF00)`

type Tab = 'nutrition'|'supplements'

export default function NutritionPage() {
  const params = useParams()
  const locale = (params?.locale as string)||'es'
  const isEs = locale!=='en'
  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const [tab,setTab] = useState<Tab>('nutrition')

  useEffect(()=>{
    fetch('/api/athlete/profile-summary')
      .then(r=>r.json()).then(setData).catch(()=>{}).finally(()=>setLoading(false))
    // Check if hash is #supplements
    if(typeof window!=='undefined'&&window.location.hash==='#supplements') setTab('supplements')
  },[])

  const nut = data?.nutrition
  const ed = data?.latestImport?.extractedData
  const supplements: any[] = ed?.supplements ?? []
  const hasNutrition = !!nut?.caloriesTarget

  const macros = [
    {label:'Proteína',labelEn:'Protein',value:nut?.proteinG,unit:'g',color:'#4ADE80',pct:hasNutrition&&nut?.proteinG?Math.round(nut.proteinG*4/nut.caloriesTarget*100):0},
    {label:'Carbos',labelEn:'Carbs',value:nut?.carbsG,unit:'g',color:'#FFA500',pct:hasNutrition&&nut?.carbsG?Math.round(nut.carbsG*4/nut.caloriesTarget*100):0},
    {label:'Grasas',labelEn:'Fats',value:nut?.fatG,unit:'g',color:'#38BDF8',pct:hasNutrition&&nut?.fatG?Math.round(nut.fatG*9/nut.caloriesTarget*100):0},
  ]

  return (
    <div style={{minHeight:'100vh',background:BG,color:T1,paddingBottom:100}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* HEADER */}
      <div style={{padding:'52px 20px 16px',background:`linear-gradient(180deg,rgba(255,165,0,.06) 0%,transparent 100%)`}}>
        <Link href={`/${locale}/athlete`} style={{display:'inline-flex',alignItems:'center',gap:6,color:T3,fontSize:12,fontFamily:'DM Mono,monospace',textDecoration:'none',marginBottom:16}}>
          ← {isEs?'Volver':'Back'}
        </Link>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,fontFamily:'Syne,sans-serif',color:T1,letterSpacing:'-0.02em'}}>
          {isEs?'🥗 Nutrición & Suplementos':'🥗 Nutrition & Supplements'}
        </h1>
        {data?.latestImport && (
          <p style={{margin:'6px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
            {data.latestImport.filename} · {Math.round((data.latestImport.confidence||0)*100)}% {isEs?'confianza':'confidence'}
          </p>
        )}
      </div>

      {/* TABS */}
      <div style={{padding:'0 16px 16px',display:'flex',gap:8}}>
        {(['nutrition','supplements'] as Tab[]).map(t=>(
          <button key={t} id={t==='supplements'?'supplements':undefined} onClick={()=>setTab(t)} style={{
            padding:'8px 16px',borderRadius:100,fontSize:12,fontWeight:700,fontFamily:'Syne,sans-serif',cursor:'pointer',
            background:tab===t?ACC:CARD,color:tab===t?'#0A0A0F':T2,
            border:`1px solid ${tab===t?'transparent':BDR}`,transition:'all .15s',
          }}>
            {t==='nutrition'?(isEs?'Nutrición':'Nutrition'):(isEs?'Suplementos':'Supplements')}
          </button>
        ))}
      </div>

      <div style={{padding:'0 16px',animation:'fadeUp .4s ease-out .1s both'}}>

        {tab==='nutrition'&&(
          <>
            {hasNutrition ? (
              <>
                {/* Calories big number */}
                <div style={{padding:'24px 20px',background:`linear-gradient(135deg,rgba(255,165,0,.08),rgba(255,165,0,.03))`,border:'1px solid rgba(255,165,0,.2)',borderRadius:16,textAlign:'center',marginBottom:16}}>
                  <p style={{margin:0,fontSize:48,fontWeight:800,color:'#FFA500',fontFamily:'DM Mono,monospace',lineHeight:1}}>{nut.caloriesTarget?.toLocaleString()}</p>
                  <p style={{margin:'6px 0 0',fontSize:13,color:T2,fontFamily:'Syne,sans-serif'}}>{isEs?'kcal objetivo por día':'target kcal per day'}</p>
                  {nut.mealsPerDay&&<p style={{margin:'4px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>{nut.mealsPerDay} {isEs?'comidas/día':'meals/day'}</p>}
                </div>

                {/* Macros */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                  {macros.map(m=>(
                    <div key={m.label} style={{padding:'14px 10px',background:CARD,border:`1px solid ${BDR}`,borderRadius:14,textAlign:'center'}}>
                      <div style={{height:3,background:`linear-gradient(90deg,${m.color},transparent)`,borderRadius:4,marginBottom:10}}/>
                      <p style={{margin:0,fontSize:24,fontWeight:700,color:m.color,fontFamily:'DM Mono,monospace'}}>{m.value??'-'}</p>
                      <p style={{margin:'2px 0 0',fontSize:9,color:T3,fontFamily:'DM Mono,monospace'}}>{m.unit}</p>
                      <p style={{margin:'4px 0 0',fontSize:10,color:T2,fontFamily:'Syne,sans-serif',fontWeight:700}}>{isEs?m.label:m.labelEn}</p>
                      {m.pct>0&&<p style={{margin:'2px 0 0',fontSize:9,color:T3,fontFamily:'DM Mono,monospace'}}>{m.pct}%</p>}
                    </div>
                  ))}
                </div>

                {/* Macro bar */}
                {macros.every(m=>m.pct>0)&&(
                  <div style={{marginBottom:16}}>
                    <div style={{height:8,borderRadius:100,overflow:'hidden',display:'flex',gap:2}}>
                      {macros.map(m=>(
                        <div key={m.label} style={{flex:m.pct,background:m.color,minWidth:4}}/>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:16,marginTop:6}}>
                      {macros.map(m=>(
                        <span key={m.label} style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>
                          <span style={{color:m.color}}>{m.pct}%</span> {isEs?m.label:m.labelEn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {nut.nutritionNotes&&(
                  <div style={{padding:'14px',background:CARD,border:`1px solid ${BDR}`,borderRadius:14}}>
                    <p style={{margin:'0 0 4px',fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'.08em'}}>{isEs?'Notas':'Notes'}</p>
                    <p style={{margin:0,fontSize:13,color:T2,lineHeight:1.5,fontFamily:'DM Mono,monospace'}}>{nut.nutritionNotes}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{textAlign:'center',padding:'60px 0'}}>
                <p style={{fontSize:36,margin:'0 0 12px'}}>🥗</p>
                <p style={{fontSize:14,color:T2,fontFamily:'Syne,sans-serif',marginBottom:8}}>
                  {isEs?'Sin datos de nutrición':'No nutrition data'}
                </p>
                <p style={{fontSize:12,color:T3,fontFamily:'DM Mono,monospace',marginBottom:20}}>
                  {isEs?'Importa un PDF, imagen o Excel con tu plan nutricional':'Import a PDF, image or Excel with your nutrition plan'}
                </p>
                <Link href={`/${locale}/import`} style={{display:'inline-block',padding:'12px 24px',background:ACC,borderRadius:12,color:'#0A0A0F',fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',textDecoration:'none'}}>
                  {isEs?'Importar plan →':'Import plan →'}
                </Link>
              </div>
            )}
          </>
        )}

        {tab==='supplements'&&(
          <>
            {supplements.length>0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {supplements.map((sup:any,i:number)=>(
                  <div key={i} style={{padding:'14px 16px',background:CARD,border:'1px solid rgba(167,139,250,.15)',borderRadius:14,display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:10,background:'rgba(167,139,250,.1)',border:'1px solid rgba(167,139,250,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                      💊
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:0,fontSize:13,fontWeight:600,color:T1,fontFamily:'Syne,sans-serif'}}>{sup.name}</p>
                      {sup.dose&&<p style={{margin:'2px 0 0',fontSize:11,color:'#A78BFA',fontFamily:'DM Mono,monospace'}}>{sup.dose}</p>}
                      {sup.timing&&<p style={{margin:'1px 0 0',fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>{sup.timing}</p>}
                    </div>
                    {sup.purpose&&(
                      <span style={{fontSize:10,color:T3,fontFamily:'DM Mono,monospace',textAlign:'right',flexShrink:0,maxWidth:80}}>{sup.purpose}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'60px 0'}}>
                <p style={{fontSize:36,margin:'0 0 12px'}}>💊</p>
                <p style={{fontSize:14,color:T2,fontFamily:'Syne,sans-serif',marginBottom:8}}>
                  {isEs?'Sin pila de suplementos':'No supplement stack'}
                </p>
                <p style={{fontSize:12,color:T3,fontFamily:'DM Mono,monospace',marginBottom:20}}>
                  {isEs?'La IA extrae suplementos de tus archivos importados':'AI extracts supplements from your imported files'}
                </p>
                <Link href={`/${locale}/import`} style={{display:'inline-block',padding:'12px 24px',background:ACC,borderRadius:12,color:'#0A0A0F',fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',textDecoration:'none'}}>
                  {isEs?'Importar →':'Import →'}
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

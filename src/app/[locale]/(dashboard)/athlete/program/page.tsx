'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BG=`var(--bg-primary,#0A0A0F)`,CARD=`var(--card-bg,rgba(255,255,255,.04))`,BDR=`var(--card-border,rgba(255,255,255,.08))`,T1=`var(--text-primary,#fff)`,T2=`var(--text-secondary,#888)`,T3=`var(--text-tertiary,#44445a)`,ACC=`var(--accent-color,#C8FF00)`

export default function ProgramPage() {
  const params = useParams()
  const locale = (params?.locale as string)||'es'
  const isEs = locale!=='en'
  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const [openDay,setOpenDay] = useState<number|null>(null)

  useEffect(()=>{
    fetch('/api/athlete/profile-summary')
      .then(r=>r.json()).then(setData).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const ed = data?.latestImport?.extractedData
  const program = ed?.training_program
  const days: any[] = program?.days ?? []

  return (
    <div style={{minHeight:'100vh',background:BG,color:T1,paddingBottom:100}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* HEADER */}
      <div style={{padding:'52px 20px 20px',background:`linear-gradient(180deg,rgba(74,222,128,.06) 0%,transparent 100%)`}}>
        <Link href={`/${locale}/athlete`} style={{display:'inline-flex',alignItems:'center',gap:6,color:T3,fontSize:12,fontFamily:'DM Mono,monospace',textDecoration:'none',marginBottom:16}}>
          ← {isEs?'Volver':'Back'}
        </Link>
        <h1 style={{margin:0,fontSize:26,fontWeight:800,fontFamily:'Syne,sans-serif',color:T1,letterSpacing:'-0.02em'}}>
          {'💪 '}{isEs?'Programa de Entrenamiento':'Training Program'}
        </h1>
        {program && (
          <p style={{margin:'6px 0 0',fontSize:12,color:'#4ADE80',fontFamily:'DM Mono,monospace'}}>
            {program.split_type ?? ''}{program.days_per_week ? ` · ${program.days_per_week} ${isEs?'días/sem':'days/wk'}` : ''}{program.mesocycle_weeks ? ` · ${program.mesocycle_weeks} ${isEs?'semanas':'weeks'}` : ''}
          </p>
        )}
      </div>

      <div style={{padding:'0 16px',animation:'fadeUp .4s ease-out .1s both'}}>
        {loading ? (
          [1,2,3].map(i=>(
            <div key={i} style={{height:80,background:CARD,border:`1px solid ${BDR}`,borderRadius:14,marginBottom:10,animation:'pulse 1.5s infinite'}}/>
          ))
        ) : days.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0'}}>
            <p style={{fontSize:36,margin:'0 0 12px'}}>🏋️</p>
            <p style={{fontSize:14,color:T2,fontFamily:'Syne,sans-serif',marginBottom:16}}>
              {isEs?'Sin programa importado':'No program imported'}
            </p>
            <Link href={`/${locale}/import`} style={{display:'inline-block',padding:'12px 24px',background:ACC,borderRadius:12,color:'#0A0A0F',fontWeight:700,fontSize:13,fontFamily:'Syne,sans-serif',textDecoration:'none'}}>
              {isEs?'Importar programa →':'Import program →'}
            </Link>
          </div>
        ) : (
          <>
            {/* Summary chips */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[
                `${days.length} ${isEs?'días':'days'}`,
                `${days.reduce((a:number,d:any)=>a+(d.exercises?.length||0),0)} ${isEs?'ejercicios':'exercises'}`,
                data?.latestImport?.filename,
              ].filter(Boolean).map((chip,i)=>(
                <span key={i} style={{padding:'4px 10px',background:CARD,border:`1px solid ${BDR}`,borderRadius:100,fontSize:10,color:T2,fontFamily:'DM Mono,monospace'}}>{chip}</span>
              ))}
            </div>

            {/* Days accordion */}
            {days.map((day:any, i:number)=>{
              const isOpen = openDay===i
              const exercises: any[] = day.exercises ?? []
              return (
                <div key={i} style={{marginBottom:8,background:CARD,border:`1px solid ${isOpen?'rgba(74,222,128,.35)':BDR}`,borderRadius:14,overflow:'hidden',transition:'border-color .2s',animation:`fadeUp .4s ease-out ${i*50+100}ms both`}}>
                  <button
                    onClick={()=>setOpenDay(isOpen?null:i)}
                    style={{width:'100%',padding:'14px 16px',background:'transparent',border:'none',cursor:'pointer',
                      display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}
                  >
                    <div style={{textAlign:'left'}}>
                      <p style={{margin:0,fontSize:14,fontWeight:700,color:T1,fontFamily:'Syne,sans-serif'}}>
                        {day.day_label || `${isEs?'Día':'Day'} ${day.day_number}`}
                      </p>
                      <p style={{margin:'2px 0 0',fontSize:11,color:T3,fontFamily:'DM Mono,monospace'}}>
                        {exercises.length} {isEs?'ejercicios':'exercises'}
                        {day.muscle_focus ? ` · ${day.muscle_focus}` : ''}
                      </p>
                    </div>
                    <span style={{fontSize:18,color:T3,transform:isOpen?'rotate(180deg)':'',transition:'transform .2s',flexShrink:0}}>⌄</span>
                  </button>

                  {isOpen && (
                    <div style={{borderTop:`1px solid ${BDR}`,padding:'8px 0'}}>
                      {exercises.map((ex:any,j:number)=>(
                        <div key={j} style={{
                          display:'flex',justifyContent:'space-between',alignItems:'center',
                          padding:'10px 16px',
                          borderTop: j>0?`1px solid rgba(255,255,255,.03)`:'none',
                        }}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{margin:0,fontSize:13,color:T1,fontFamily:'DM Mono,monospace',fontWeight:500}}>{ex.name}</p>
                            {ex.notes && <p style={{margin:'2px 0 0',fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>{ex.notes}</p>}
                          </div>
                          <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                            <p style={{margin:0,fontSize:12,color:'#4ADE80',fontFamily:'DM Mono,monospace',fontWeight:600}}>
                              {ex.sets && ex.rep_range_min && ex.rep_range_max
                                ? `${ex.sets}×${ex.rep_range_min}-${ex.rep_range_max}`
                                : ex.sets ? `${ex.sets} sets` : '-'}
                            </p>
                            {ex.rir_target != null && (
                              <p style={{margin:'2px 0 0',fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>RIR {ex.rir_target}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Extracted from */}
            {data?.latestImport && (
              <div style={{marginTop:16,padding:'12px 14px',background:'rgba(255,255,255,.02)',border:`1px solid ${BDR}`,borderRadius:12}}>
                <p style={{margin:0,fontSize:10,color:T3,fontFamily:'DM Mono,monospace'}}>
                  {isEs?'Extraído de:':'Extracted from:'} <span style={{color:T2}}>{data.latestImport.filename}</span>
                  {' · '}{Math.round((data.latestImport.confidence||0)*100)}% {isEs?'confianza':'confidence'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

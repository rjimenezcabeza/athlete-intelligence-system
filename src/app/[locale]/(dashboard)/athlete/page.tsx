'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type AthleteTab = 'overview' | 'program' | 'nutrition' | 'history' | 'coach'

interface AthleteData {
  profile: {
    displayName: string | null
    bodyWeightKg: number | null
    trainingExperienceYears: number | null
    primaryGoal: string | null
    trainingDaysDetected: number | null
    trainingSplitDetected: string | null
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
  }
}

const TABS: Record<AthleteTab, { es: string; en: string; icon: string }> = {
  overview:  { es: 'Resumen',   en: 'Overview',   icon: '📊' },
  program:   { es: 'Programa',  en: 'Program',    icon: '🏋️' },
  nutrition: { es: 'Nutricion', en: 'Nutrition',  icon: '🥗' },
  history:   { es: 'Historial', en: 'History',    icon: '📅' },
  coach:     { es: 'Coach',     en: 'Coach',      icon: '🤖' },
}

const accent = '#C8FF00'

export default function AthletePage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const isEs = locale === 'es'
  const [activeTab, setActiveTab] = useState<AthleteTab>('overview')
  const [data, setData] = useState<AthleteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/athlete/profile-summary')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '20px', minHeight: '100vh', background: '#0A0A0F' }}>
        <div style={{ height: '20px', width: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '20px' }} />
        {[1,2,3].map(i => <div key={i} style={{ height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '10px' }} />)}
      </div>
    )
  }

  const ed = data?.latestImport?.extractedData
  const programDays: any[] = ed?.training_program?.days ?? []

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: '#0A0A0F' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', background: 'linear-gradient(180deg, rgba(200,255,0,0.06) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: data?.profile?.avatarUrl ? 'transparent' : 'rgba(200,255,0,0.15)', border: '2px solid rgba(200,255,0,0.3)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data?.profile?.avatarUrl ? (
              <img src={data.profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '20px', fontWeight: '700', color: accent, fontFamily: 'Syne, sans-serif' }}>
                {data?.profile?.displayName?.[0]?.toUpperCase() || 'A'}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
              {data?.profile?.displayName || (isEs ? 'Mi perfil' : 'My profile')}
            </h1>
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>
              {data?.profile?.primaryGoal || 'hypertrophy'} · {data?.profile?.trainingExperienceYears || '?'} {isEs ? 'años' : 'years'} · {data?.profile?.trainingSplitDetected || 'Custom'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '1px' }}>
          {(Object.entries(TABS) as [AthleteTab, typeof TABS.overview][]).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 14px',
                background: activeTab === key ? 'rgba(200,255,0,0.12)' : 'transparent',
                border: `1px solid ${activeTab === key ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '8px',
                color: activeTab === key ? accent : '#666',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'DM Mono, monospace',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{tab.icon}</span>
              <span>{isEs ? tab.es : tab.en}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { label: isEs ? 'Sesiones' : 'Sessions', value: data?.stats?.totalSessions || 0, icon: '🏋️', color: accent },
                { label: 'PRs', value: data?.stats?.totalPRs || 0, icon: '🏆', color: '#FFC107' },
                { label: isEs ? 'Peso corporal' : 'Body weight', value: data?.profile?.bodyWeightKg ? `${data.profile.bodyWeightKg}kg` : '-', icon: '⚖️', color: '#888' },
                { label: isEs ? 'Split' : 'Split', value: data?.profile?.trainingSplitDetected || (isEs ? 'Ninguno' : 'None'), icon: '📅', color: '#888' },
              ].map((kpi, i) => (
                <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: kpi.color, fontFamily: 'DM Mono, monospace', marginBottom: '2px' }}>{kpi.value}</div>
                  <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {data?.latestImport && (
              <div style={{ padding: '16px', background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: accent, fontFamily: 'Syne, sans-serif' }}>
                    {isEs ? 'Ultimo archivo analizado' : 'Latest analyzed file'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
                    {Math.round((data.latestImport.confidence || 0) * 100)}% {isEs ? 'precision' : 'accuracy'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                  {data.latestImport.filename}
                </div>
                {ed && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {ed.training_program?.split_type && (
                      <span style={{ fontSize: '11px', color: accent, fontFamily: 'DM Mono, monospace' }}>
                        {ed.training_program.split_type}
                      </span>
                    )}
                    {ed.nutrition?.calories_target && (
                      <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                        {ed.nutrition.calories_target}kcal
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {!data?.latestImport && (
              <a href={`/${locale}/import`} style={{ display: 'block', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', textDecoration: 'none' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
                <div style={{ fontSize: '13px', color: accent, fontFamily: 'Syne, sans-serif', marginBottom: '4px' }}>
                  {isEs ? 'Importa tu programa' : 'Import your program'}
                </div>
                <div style={{ fontSize: '11px', color: '#555' }}>
                  {isEs ? 'PDF, imagen, Excel — la IA lo analiza' : 'PDF, image, Excel — AI analyzes it'}
                </div>
              </a>
            )}
          </div>
        )}

        {/* PROGRAMA */}
        {activeTab === 'program' && (
          <div>
            {programDays.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>
                  {ed?.training_program?.split_type || 'Custom'} · {ed?.training_program?.days_per_week || programDays.length} {isEs ? 'dias/semana' : 'days/week'}
                </div>
                {programDays.map((day: any, i: number) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ddd', fontFamily: 'Syne, sans-serif' }}>
                        {day.day_label || `Dia ${day.day_number}`}
                      </span>
                      <span style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
                        {day.exercises?.length || 0} {isEs ? 'ejercicios' : 'exercises'}
                      </span>
                    </div>
                    <div style={{ padding: '8px 14px' }}>
                      {(day.exercises || []).map((ex: any, j: number) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: j > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <div>
                            <span style={{ fontSize: '13px', color: ex.matched_exercise ? '#ddd' : '#666', fontFamily: 'DM Mono, monospace' }}>{ex.name}</span>
                            {ex.matched_exercise && <span style={{ fontSize: '9px', color: accent, marginLeft: '6px' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
                            {ex.sets && ex.rep_range_min && ex.rep_range_max
                              ? `${ex.sets}x${ex.rep_range_min}-${ex.rep_range_max}`
                              : ex.sets ? `${ex.sets} sets` : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#555', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏋️</div>
                {isEs ? 'Sin programa importado.' : 'No imported program.'}
                <br />
                <a href={`/${locale}/import`} style={{ color: accent, textDecoration: 'none', fontSize: '13px', marginTop: '12px', display: 'inline-block' }}>
                  {isEs ? 'Importar programa →' : 'Import program →'}
                </a>
              </div>
            )}
          </div>
        )}

        {/* NUTRICION */}
        {activeTab === 'nutrition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.nutrition?.caloriesTarget ? (
              <>
                <div style={{ padding: '20px', background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', fontWeight: '800', color: accent, fontFamily: 'DM Mono, monospace' }}>
                    {data.nutrition.caloriesTarget.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888' }}>{isEs ? 'kcal objetivo/dia' : 'target kcal/day'}</div>
                </div>

                {(data.nutrition.proteinG || data.nutrition.carbsG || data.nutrition.fatG) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { label: isEs ? 'Proteina' : 'Protein', value: data.nutrition.proteinG, color: '#4CAF50' },
                      { label: isEs ? 'Carbos' : 'Carbs', value: data.nutrition.carbsG, color: '#FF9800' },
                      { label: isEs ? 'Grasas' : 'Fats', value: data.nutrition.fatG, color: '#2196F3' },
                    ].map((macro, i) => (
                      <div key={i} style={{ padding: '14px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: macro.color, fontFamily: 'DM Mono, monospace' }}>{macro.value || '-'}</div>
                        <div style={{ fontSize: '10px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{macro.label} (g)</div>
                      </div>
                    ))}
                  </div>
                )}

                {data.nutrition.mealsPerDay && (
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#888' }}>{isEs ? 'Comidas al dia' : 'Meals per day'}</span>
                    <span style={{ fontSize: '13px', color: '#ddd', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>{data.nutrition.mealsPerDay}</span>
                  </div>
                )}

                {data.nutrition.nutritionNotes && (
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>{isEs ? 'Notas' : 'Notes'}</div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#888', lineHeight: '1.5' }}>{data.nutrition.nutritionNotes}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#555', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🥗</div>
                {isEs ? 'Sin datos de nutricion. Importa un archivo con tu plan nutricional.' : 'No nutrition data. Import a file with your nutrition plan.'}
                <br />
                <a href={`/${locale}/import`} style={{ color: accent, textDecoration: 'none', fontSize: '13px', marginTop: '12px', display: 'inline-block' }}>
                  {isEs ? 'Importar plan →' : 'Import plan →'}
                </a>
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {activeTab === 'history' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontSize: '14px', color: '#ddd', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>
              {data?.stats?.totalSessions || 0} {isEs ? 'sesiones registradas' : 'sessions logged'}
            </div>
            {data?.stats?.lastSessionDate && (
              <div style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '16px' }}>
                {isEs ? 'Ultima:' : 'Last:'} {new Date(data.stats.lastSessionDate).toLocaleDateString()}
              </div>
            )}
            <a href={`/${locale}/history`} style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '10px', color: accent, fontSize: '13px', fontFamily: 'DM Mono, monospace', textDecoration: 'none' }}>
              {isEs ? 'Ver historial completo →' : 'View full history →'}
            </a>
          </div>
        )}

        {/* COACH */}
        {activeTab === 'coach' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
            <div style={{ fontSize: '14px', color: '#ddd', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>
              {isEs ? 'Tu AI Coach te esta esperando' : 'Your AI Coach is waiting for you'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
              {isEs ? 'Con tu historial real + programa importado' : 'With your real history + imported program'}
            </div>
            <a href={`/${locale}/coach`} style={{ display: 'inline-block', padding: '14px 32px', background: accent, borderRadius: '12px', color: '#0A0A0F', fontSize: '14px', fontWeight: '700', fontFamily: 'Syne, sans-serif', textDecoration: 'none' }}>
              {isEs ? 'Hablar con el Coach →' : 'Talk to Coach →'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

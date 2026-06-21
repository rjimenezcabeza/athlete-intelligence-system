'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const BG = '#0A0A0F', CARD = '#111118', ACC = '#C8FF00', T1 = '#F0F0F5', T2 = '#8888AA', T3 = '#44445a', BORDER = 'rgba(255,255,255,0.06)'

const MC: Record<string, string> = {
  chest: '#FF6B6B', back: '#4ECDC4', shoulders: '#A78BFA', arms: '#FBBF24',
  legs: '#60A5FA', core: '#F97316', glutes: '#EC4899', calves: '#10B981'
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? ACC

const SEV: Record<string, string> = {
  info: '#60A5FA', warning: '#FBBF24', success: '#C8FF00', danger: '#FF6B6B'
}

function Skel({ h = 80 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#16161f 25%,#1e1e2e 50%,#16161f 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
}

export default function MemoryPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/memory/summary')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const animStyle = (delay: number): React.CSSProperties => ({
    animation: `fadeInUp 0.3s ease-out ${delay}ms both`,
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, padding: '40px 20px', paddingBottom: 96 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <Skel h={36} />
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3,4].map(i => <Skel key={i} h={80} />)}
      </div>
    </div>
  )

  if (!data || data.error) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🧠</p>
        <p style={{ fontSize: 14, color: '#FF6B6B' }}>{data?.error ?? (isEs ? 'Error cargando' : 'Loading error')}</p>
      </div>
    </div>
  )

  const { patterns, personalRecords, volumeByMuscle, recommendations, totalSessions } = data
  const maxVol = volumeByMuscle.length > 0 ? volumeByMuscle[0].volume || 1 : 1
  const hasData = patterns.length > 0 || personalRecords.length > 0 || recommendations.length > 0

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* HEADER */}
      <div style={{ padding: '40px 20px 20px', ...animStyle(0) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 700, color: T1, letterSpacing: '-0.02em' }}>
            {isEs ? 'Memoria' : 'Memory'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 100, padding: '6px 14px' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14, color: ACC }}>{totalSessions}</span>
            <span style={{ fontSize: 11, color: T2 }}>{isEs ? 'sesiones' : 'sessions'}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: T2 }}>{isEs ? 'Tu cerebro de entrenamiento' : 'Your training brain'}</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* PATRONES */}
        <section style={animStyle(80)}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 10 }}>
            {isEs ? 'Patrones detectados' : 'Detected patterns'}
          </p>
          {patterns.length === 0 ? (
            <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🧠</p>
              <p style={{ fontSize: 13, color: T2 }}>{isEs ? 'Sigue entrenando para detectar patrones' : 'Keep training to detect patterns'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {patterns.map((p: any) => (
                <div key={p.id} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: SEV[p.severity] ?? ACC, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: T1, fontFamily: 'Syne, sans-serif', marginBottom: 4 }}>
                      {isEs ? p.title_es : p.title_en}
                    </p>
                    <p style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>
                      {isEs ? p.description_es : p.description_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECORDS PERSONALES */}
        <section style={animStyle(120)}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 10 }}>
            {isEs ? 'Records personales' : 'Personal records'}
          </p>
          {personalRecords.length === 0 ? (
            <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🏆</p>
              <p style={{ fontSize: 13, color: T2 }}>{isEs ? 'Completa sesiones para ver tus records' : 'Complete sessions to see your records'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {personalRecords.map((r: any, i: number) => (
                <div key={i} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: mc(r.muscle) + '20', color: mc(r.muscle), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: T1, fontFamily: 'Syne, sans-serif', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                    <p style={{ fontSize: 11, color: mc(r.muscle), textTransform: 'capitalize' }}>{r.muscle}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 18, color: ACC, fontFamily: 'DM Mono, monospace' }}>{r.maxWeight}kg</p>
                    <p style={{ fontSize: 10, color: T3 }}>{r.sessions} {isEs ? 'ses.' : 'sess.'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* VOLUMEN POR MÚSCULO */}
        {volumeByMuscle.length > 0 && (
          <section style={animStyle(160)}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 10 }}>
              {isEs ? 'Volumen por músculo (4 sem.)' : 'Volume by muscle (4 wks)'}
            </p>
            <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {volumeByMuscle.map((v: any) => (
                  <div key={v.muscle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: mc(v.muscle), fontFamily: 'Syne, sans-serif', textTransform: 'capitalize', letterSpacing: '0.06em' }}>{v.muscle}</span>
                      <span style={{ fontSize: 11, color: T2, fontFamily: 'DM Mono, monospace' }}>{v.volume.toLocaleString()}kg</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#1a1a2e', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: mc(v.muscle) + 'BB', width: Math.round(v.volume / maxVol * 100) + '%', transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RECOMENDACIONES IA */}
        {recommendations.length > 0 && (
          <section style={animStyle(200)}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 10 }}>
              {isEs ? 'Recomendaciones IA' : 'AI Recommendations'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recommendations.map((r: any) => (
                <div key={r.id} style={{ background: CARD, border: '1px solid rgba(200,255,0,0.08)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACC, flexShrink: 0, marginTop: 6 }} />
                  <p style={{ fontSize: 13, color: T1, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{r.recommendation_text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {!hasData && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '48px 20px', textAlign: 'center', ...animStyle(120) }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🧬</p>
            <p style={{ fontWeight: 700, fontSize: 18, color: T1, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>
              {isEs ? 'Sin datos aún' : 'No data yet'}
            </p>
            <p style={{ fontSize: 13, color: T2, marginBottom: 24 }}>
              {isEs ? 'Completa entrenamientos para ver tu memoria atlética' : 'Complete workouts to see your athlete memory'}
            </p>
            <Link href={`/${locale}/session/new`} style={{ display: 'inline-block', background: 'rgba(200,255,0,0.1)', color: ACC, border: '1px solid rgba(200,255,0,0.2)', borderRadius: 12, padding: '12px 28px', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700 }}>
              {isEs ? 'Empezar a entrenar' : 'Start training'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

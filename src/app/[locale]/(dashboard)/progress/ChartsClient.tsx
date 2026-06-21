'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const BG = '#0A0A0F', CARD = '#111118', ACC = '#C8FF00', T1 = '#F0F0F5', T2 = '#8888AA', T3 = '#44445a', BORDER = 'rgba(255,255,255,0.06)'

const MC: Record<string, string> = {
  chest: '#FF6B6B', back: '#4ECDC4', shoulders: '#A78BFA', arms: '#FBBF24',
  legs: '#60A5FA', core: '#F97316', glutes: '#EC4899', calves: '#10B981'
}
const mc = (m: string) => MC[m?.toLowerCase()] ?? ACC

interface TopExercise { id: string; name: string; muscle: string; sessions: number; bestWeight: number | null }
interface ChartsClientProps {
  language: string
  feedbackData: any[]
  statsData: { total_sessions: number; avg_duration: number; avg_pump: string | null }
  locale: string
  topExercises: TopExercise[]
}

function Skel({ h = 32 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 10, background: 'linear-gradient(90deg,#16161f 25%,#1e1e2e 50%,#16161f 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
}

export default function ChartsClient({ language, feedbackData, statsData, locale, topExercises }: ChartsClientProps) {
  const isEs = language === 'es'
  const [selectedEx, setSelectedEx] = useState<TopExercise | null>(topExercises[0] ?? null)
  const [progression, setProgression] = useState<Array<{ date: string; maxWeight: number }>>([])
  const [loadingProg, setLoadingProg] = useState(false)

  useEffect(() => {
    if (!selectedEx) return
    setLoadingProg(true)
    fetch('/api/progress/exercise?id=' + selectedEx.id)
      .then(r => r.json())
      .then(d => setProgression(d.data ?? []))
      .catch(() => setProgression([]))
      .finally(() => setLoadingProg(false))
  }, [selectedEx?.id])

  const bestWeight = progression.length > 0 ? Math.max(...progression.map(p => p.maxWeight)) : (selectedEx?.bestWeight ?? 0)
  const lastWeight = progression.length > 0 ? progression[progression.length - 1].maxWeight : null
  const prevWeight = progression.length > 1 ? progression[progression.length - 2].maxWeight : null
  const trend = lastWeight !== null && prevWeight !== null
    ? lastWeight > prevWeight ? '+' + (lastWeight - prevWeight).toFixed(1) + 'kg'
    : lastWeight < prevWeight ? '-' + (prevWeight - lastWeight).toFixed(1) + 'kg'
    : '='
    : null

  const animStyle = (delay: number): React.CSSProperties => ({
    animation: `fadeInUp 0.3s ease-out ${delay}ms both`,
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* Header */}
      <div style={{ padding: '40px 20px 16px', ...animStyle(0) }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 700, color: T1, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {isEs ? 'Progreso' : 'Progress'}
        </h1>
        <p style={{ fontSize: 13, color: T2 }}>{isEs ? 'Últimas 8 semanas' : 'Last 8 weeks'}</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, ...animStyle(0) }}>
          {[
            { label: isEs ? 'Sesiones' : 'Sessions', value: String(statsData.total_sessions), color: T1 },
            { label: isEs ? 'Duración media' : 'Avg duration', value: statsData.avg_duration ? `${statsData.avg_duration}m` : '—', color: T1 },
            { label: isEs ? 'Pump medio' : 'Avg pump', value: statsData.avg_pump ? `${statsData.avg_pump}/5` : '—', color: ACC },
          ].map(k => (
            <div key={k.label} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '14px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>{k.label}</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Exercise progression */}
        {topExercises.length > 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '16px', ...animStyle(80) }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 12 }}>
              {isEs ? 'Progresión por ejercicio' : 'Exercise progression'}
            </p>

            {/* Exercise selector */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12, scrollbarWidth: 'none' }}>
              {topExercises.map(ex => (
                <button key={ex.id} onClick={() => setSelectedEx(ex)} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Syne, sans-serif',
                  background: selectedEx?.id === ex.id ? mc(ex.muscle) : '#16161f',
                  color: selectedEx?.id === ex.id ? BG : T2,
                  border: '1px solid ' + (selectedEx?.id === ex.id ? 'transparent' : BORDER),
                }}>
                  {ex.name.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>

            {/* KPIs for selected exercise */}
            {selectedEx && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: isEs ? 'Mejor marca' : 'Best mark', value: bestWeight ? `${bestWeight}kg` : '—', color: T1 },
                  { label: isEs ? 'Última sesión' : 'Last session', value: lastWeight ? `${lastWeight}kg` : '—', color: T1 },
                  { label: isEs ? 'Progresión' : 'Progression', value: trend ?? '—', color: trend?.startsWith('+') ? ACC : trend?.startsWith('-') ? '#FF6B6B' : T2 },
                ].map(k => (
                  <div key={k.label} style={{ background: '#0d0d14', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T3, marginBottom: 4 }}>{k.label}</p>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Line chart */}
            {loadingProg ? (
              <Skel h={120} />
            ) : progression.length > 1 ? (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={progression} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: T3, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={d => d.slice(5)} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 10, color: T1, fontSize: 12 }}
                    formatter={(v: unknown) => [`${v}kg`, isEs ? 'Peso máx.' : 'Max weight']}
                  />
                  <Line type="monotone" dataKey="maxWeight" stroke={selectedEx ? mc(selectedEx.muscle) : ACC} strokeWidth={2.5} dot={{ fill: selectedEx ? mc(selectedEx.muscle) : ACC, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: T3 }}>{isEs ? 'Sin datos de progresión aún' : 'No progression data yet'}</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback trend */}
        {feedbackData.length > 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '16px', ...animStyle(120) }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 14 }}>
              {isEs ? 'Tendencia de feedback' : 'Feedback trend'}
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={feedbackData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: T3, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 10, color: T1, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="pump" stroke={ACC} strokeWidth={2} dot={false} name="Pump" />
                <Line type="monotone" dataKey="fatigue" stroke="#FF6B6B" strokeWidth={2} dot={false} name={isEs ? 'Fatiga' : 'Fatigue'} />
                <Line type="monotone" dataKey="recovery" stroke="#4ECDC4" strokeWidth={2} dot={false} name={isEs ? 'Recuper.' : 'Recovery'} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
              {[
                { label: 'Pump', color: ACC },
                { label: isEs ? 'Fatiga' : 'Fatigue', color: '#FF6B6B' },
                { label: isEs ? 'Recuper.' : 'Recovery', color: '#4ECDC4' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 2, borderRadius: 1, background: l.color }} />
                  <span style={{ fontSize: 10, color: T2, fontFamily: 'Syne, sans-serif' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {topExercises.length === 0 && feedbackData.length === 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '48px 20px', textAlign: 'center', ...animStyle(80) }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📊</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: T1, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>
              {isEs ? 'Sin datos aún' : 'No data yet'}
            </p>
            <p style={{ fontSize: 13, color: T2 }}>
              {isEs ? 'Completa sesiones para ver tu progresión' : 'Complete sessions to see your progression'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

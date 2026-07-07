'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const BG = 'var(--bg-primary,#0A0A0F)', CARD = 'var(--card-bg,rgba(255,255,255,0.04))'
const ACC = 'var(--accent-color,#C8FF00)', T1 = 'var(--text-primary,#fff)'
const T2 = 'var(--text-secondary,#888)', T3 = 'var(--text-tertiary,#44445a)'
const BORDER = 'var(--card-border,rgba(255,255,255,0.08))'

const MC: Record<string, string> = {
  chest: '#FF6B6B', back: '#4ECDC4', shoulders: '#A78BFA', arms: '#FBBF24',
  legs: '#60A5FA', core: '#F97316', glutes: '#EC4899', calves: '#10B981',
  pecho: '#FF6B6B', espalda: '#4ECDC4', hombros: '#A78BFA', brazos: '#FBBF24',
  piernas: '#60A5FA', core2: '#F97316', gluteos: '#EC4899',
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

function Skel({ h = 32, w = '100%' }: { h?: number; w?: string }) {
  return <div style={{ height: h, width: w, borderRadius: 10, background: 'linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
}

function SectionHeader({ label }: { label: string }) {
  return <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T3, marginBottom: 14 }}>{label}</p>
}

export default function ChartsClient({ language, feedbackData, statsData, locale, topExercises }: ChartsClientProps) {
  const isEs = language === 'es'

  // Exercise progression state
  const [selectedEx, setSelectedEx] = useState<TopExercise | null>(topExercises[0] ?? null)
  const [progression, setProgression] = useState<Array<{ date: string; maxWeight: number }>>([])
  const [loadingProg, setLoadingProg] = useState(false)

  // Body weight state
  const [bodyMetrics, setBodyMetrics] = useState<any[]>([])
  const [loadingBody, setLoadingBody] = useState(true)

  useEffect(() => {
    if (!selectedEx) return
    setLoadingProg(true)
    fetch('/api/progress/exercise?id=' + selectedEx.id)
      .then(r => r.json())
      .then(d => setProgression(d.data ?? []))
      .catch(() => setProgression([]))
      .finally(() => setLoadingProg(false))
  }, [selectedEx?.id])

  useEffect(() => {
    fetch('/api/body-metrics')
      .then(r => r.json())
      .then(d => {
        const history = (d.history ?? [])
          .filter((m: any) => m.body_weight_kg)
          .slice(0, 30)
          .reverse()
          .map((m: any) => ({
            date: new Date(m.recorded_date).toLocaleDateString(isEs ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short' }),
            weight: m.body_weight_kg,
            fat: m.body_fat_pct,
          }))
        setBodyMetrics(history)
      })
      .catch(() => {})
      .finally(() => setLoadingBody(false))
  }, [])

  const bestWeight = progression.length > 0 ? Math.max(...progression.map(p => p.maxWeight)) : (selectedEx?.bestWeight ?? 0)
  const lastWeight = progression.length > 0 ? progression[progression.length - 1].maxWeight : null
  const prevWeight = progression.length > 1 ? progression[progression.length - 2].maxWeight : null
  const trend = lastWeight !== null && prevWeight !== null
    ? lastWeight > prevWeight ? '+' + (lastWeight - prevWeight).toFixed(1) + 'kg'
    : lastWeight < prevWeight ? '-' + (prevWeight - lastWeight).toFixed(1) + 'kg' : '='
    : null

  const firstBodyWeight = bodyMetrics.length > 1 ? bodyMetrics[0].weight : null
  const lastBodyWeight = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1].weight : null
  const bodyWeightDelta = firstBodyWeight && lastBodyWeight ? (lastBodyWeight - firstBodyWeight) : null

  const anim = (delay: number): React.CSSProperties => ({ animation: `fadeInUp 0.35s ease-out ${delay}ms both` })

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .prog-btn:active { opacity:.7; transform:scale(.97); }
      `}</style>

      {/* Header */}
      <div style={{ padding: '40px 20px 20px', ...anim(0) }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: T1, letterSpacing: '-0.03em', marginBottom: 4 }}>
          {isEs ? 'Progreso' : 'Progress'}
        </h1>
        <p style={{ fontSize: 13, color: T2, fontFamily: 'DM Mono, monospace' }}>{isEs ? 'Últimas 8 semanas' : 'Last 8 weeks'}</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, ...anim(0) }}>
          {[
            { label: isEs ? 'Sesiones' : 'Sessions', value: String(statsData.total_sessions), color: T1, accent: false },
            { label: isEs ? 'Duración media' : 'Avg duration', value: statsData.avg_duration ? `${statsData.avg_duration}m` : '—', color: T1, accent: false },
            { label: isEs ? 'Pump medio' : 'Avg pump', value: statsData.avg_pump ? `${statsData.avg_pump}/5` : '—', color: ACC, accent: true },
          ].map(k => (
            <div key={k.label} style={{ background: k.accent ? 'linear-gradient(135deg,rgba(200,255,0,.08),rgba(200,255,0,.02))' : CARD, border: '1px solid ' + (k.accent ? 'rgba(200,255,0,.18)' : BORDER), borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>{k.label}</p>
              <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Body weight trend */}
        {!loadingBody && bodyMetrics.length > 1 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '18px 16px', ...anim(60) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <SectionHeader label={isEs ? 'EVOLUCIÓN PESO CORPORAL' : 'BODY WEIGHT TREND'} />
              {bodyWeightDelta !== null && (
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: bodyWeightDelta > 0 ? '#FBBF24' : bodyWeightDelta < 0 ? '#4ECDC4' : T2 }}>
                  {bodyWeightDelta > 0 ? '+' : ''}{bodyWeightDelta.toFixed(1)}kg
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { label: isEs ? 'Inicio' : 'Start', value: firstBodyWeight ? `${firstBodyWeight}kg` : '—' },
                { label: isEs ? 'Actual' : 'Current', value: lastBodyWeight ? `${lastBodyWeight}kg` : '—', accent: true },
                { label: isEs ? 'Mediciones' : 'Entries', value: String(bodyMetrics.length) },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase', color: T3, marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 700, color: (s as any).accent ? ACC : T1 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={bodyMetrics} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACC} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={ACC} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: T3 as string, fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,.2)', borderRadius: 10, color: T1 as string, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v}kg`, isEs ? 'Peso' : 'Weight']}
                />
                <Area type="monotone" dataKey="weight" stroke={ACC as string} strokeWidth={2.5} fill="url(#bwGrad)" dot={false} activeDot={{ r: 5, fill: ACC as string }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Skelet while loading body */}
        {loadingBody && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '18px 16px', ...anim(60) }}>
            <Skel h={14} w="40%" />
            <div style={{ marginTop: 14 }}><Skel h={110} /></div>
          </div>
        )}

        {/* Exercise progression */}
        {topExercises.length > 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '18px 16px', ...anim(120) }}>
            <SectionHeader label={isEs ? 'PROGRESIÓN POR EJERCICIO' : 'EXERCISE PROGRESSION'} />

            {/* Selector */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 14, scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}>
              {topExercises.map(ex => (
                <button key={ex.id} className="prog-btn" onClick={() => setSelectedEx(ex)} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Syne, sans-serif', border: 'none',
                  background: selectedEx?.id === ex.id ? mc(ex.muscle) : 'rgba(255,255,255,.05)',
                  color: selectedEx?.id === ex.id ? '#0A0A0F' : T2 as string,
                }}>
                  {ex.name.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>

            {/* Mini KPIs */}
            {selectedEx && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: isEs ? 'Mejor marca' : 'Best mark', value: bestWeight ? `${bestWeight}kg` : '—', color: T1 },
                  { label: isEs ? 'Última sesión' : 'Last session', value: lastWeight ? `${lastWeight}kg` : '—', color: T1 },
                  { label: isEs ? 'Tendencia' : 'Trend', value: trend ?? '—', color: trend?.startsWith('+') ? ACC : trend?.startsWith('-') ? '#FF6B6B' : T2 },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase', color: T3, marginBottom: 4 }}>{k.label}</p>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Chart */}
            {loadingProg ? <Skel h={120} /> : progression.length > 1 ? (
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={progression} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: T3 as string, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={d => d.slice(5)} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,.2)', borderRadius: 10, color: T1 as string, fontSize: 12 }}
                    formatter={(v: unknown) => [`${v}kg`, isEs ? 'Peso máx.' : 'Max weight']}
                  />
                  <Line type="monotone" dataKey="maxWeight" stroke={selectedEx ? mc(selectedEx.muscle) : ACC as string} strokeWidth={2.5} dot={{ fill: selectedEx ? mc(selectedEx.muscle) : ACC as string, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: T3 }}>{isEs ? 'Registra más sesiones para ver la progresión' : 'Log more sessions to see progression'}</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback trend */}
        {feedbackData.length > 1 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '18px 16px', ...anim(160) }}>
            <SectionHeader label={isEs ? 'TENDENCIA DE FEEDBACK' : 'FEEDBACK TREND'} />
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={feedbackData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: T3 as string, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 5]} />
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,.2)', borderRadius: 10, color: T1 as string, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="pump" stroke={ACC as string} strokeWidth={2} dot={false} name="Pump" />
                <Line type="monotone" dataKey="fatigue" stroke="#FF6B6B" strokeWidth={2} dot={false} name={isEs ? 'Fatiga' : 'Fatigue'} />
                <Line type="monotone" dataKey="recovery" stroke="#4ECDC4" strokeWidth={2} dot={false} name={isEs ? 'Recuper.' : 'Recovery'} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' }}>
              {[
                { label: 'Pump', color: ACC as string },
                { label: isEs ? 'Fatiga' : 'Fatigue', color: '#FF6B6B' },
                { label: isEs ? 'Recuper.' : 'Recovery', color: '#4ECDC4' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 3, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: T2, fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {topExercises.length === 0 && feedbackData.length === 0 && !loadingBody && bodyMetrics.length === 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '48px 20px', textAlign: 'center', ...anim(80) }}>
            <p style={{ fontSize: 40, marginBottom: 12, opacity: .25 }}>📊</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: T1, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>
              {isEs ? 'Sin datos todavía' : 'No data yet'}
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

'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { SessionDetailModal } from '@/components/history/SessionDetailModal'

const BG = 'var(--bg-primary)', CARD = 'var(--card-bg)', ACC = 'var(--accent-color)', T1 = 'var(--text-primary)', T2 = 'var(--text-secondary)', T3 = 'var(--text-tertiary)', BORDER = 'var(--card-border)'

interface SessionRow {
  id: string; session_date: string; duration_minutes: number | null
  pump_rating: number | null; local_fatigue: number | null
  perceived_recovery: number | null; status: string; day_label: string | null
}

type FilterPeriod = 'week' | 'month' | 'year'
type ViewMode = 'list' | 'grid' | 'compact'

function buildWeeklyChart(sessions: SessionRow[]) {
  const weeks: Record<string, number> = {}
  sessions.forEach(s => {
    const d = new Date(s.session_date)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks[key] = (weeks[key] ?? 0) + 1
  })
  return Object.entries(weeks).map(([week, count]) => ({ week, count })).slice(-8)
}

function Skel({ w = '100%', h = 24 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 10, background: 'linear-gradient(90deg,#16161f 25%,#1e1e2e 50%,#16161f 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', flexShrink: 0 }} />
}

export default function HistoryPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterPeriod>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<SessionRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/sessions/history')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const doDelete = async () => {
    if (!deleteModal || deleting) return
    setDeleting(true)
    try {
      const res = await fetch('/api/sessions/' + deleteModal.id, { method: 'DELETE' })
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== deleteModal.id))
        setExpanded(null)
        setDeleteModal(null)
      }
    } catch {}
    setDeleting(false)
  }

  const now = new Date()
  const cutoffs: Record<FilterPeriod, Date> = {
    week:  new Date(now.getTime() - 7   * 86400000),
    month: new Date(now.getTime() - 30  * 86400000),
    year:  new Date(now.getTime() - 365 * 86400000),
  }
  const filtered = sessions.filter(s => new Date(s.session_date) >= cutoffs[filter])
  const totalDuration = filtered.reduce((a, s) => a + (s.duration_minutes ?? 0), 0)
  const chartData = buildWeeklyChart(sessions)

  const filterLabels: Record<FilterPeriod, { es: string; en: string }> = {
    week:  { es: '7 días',  en: '7 days'  },
    month: { es: '30 días', en: '30 days' },
    year:  { es: '1 año',   en: '1 year'  },
  }

  const animStyle = (delay: number): React.CSSProperties => ({
    animation: `fadeInUp 0.3s ease-out ${delay}ms both`,
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 96 }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: '40px 20px 16px', ...animStyle(0) }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 700, color: T1, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {isEs ? 'Historial' : 'History'}
        </h1>
        <p style={{ fontSize: 13, color: T2 }}>
          {loading ? '...' : sessions.length + ' ' + (isEs ? 'sesiones en total' : 'total sessions')}
        </p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* FILTER PILLS + VIEW MODE TOGGLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...animStyle(0) }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['week', 'month', 'year'] as FilterPeriod[]).map(p => (
              <button key={p} onClick={() => setFilter(p)} style={{
                padding: '8px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                fontFamily: 'Syne, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
                background: filter === p ? ACC : CARD,
                color: filter === p ? BG : T2,
                border: '1px solid ' + (filter === p ? 'transparent' : BORDER),
              }}>
                {isEs ? filterLabels[p].es : filterLabels[p].en}
              </button>
            ))}
          </div>
          {/* View mode icons */}
          <div style={{ display: 'flex', gap: 2, background: CARD, border: '1px solid ' + BORDER, borderRadius: 10, padding: 4 }}>
            {([
              { mode: 'list' as ViewMode, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              )},
              { mode: 'grid' as ViewMode, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              )},
              { mode: 'compact' as ViewMode, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/>
                  <line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
              )},
            ]).map(({ mode, icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '5px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                background: viewMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: viewMode === mode ? T1 : T3,
                transition: 'all 0.15s',
              }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* KPI STRIP */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, ...animStyle(80) }}>
            {[1,2,3].map(i => <Skel key={i} h={72} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, ...animStyle(80) }}>
            {[
              { label: isEs ? 'Sesiones' : 'Sessions', value: String(filtered.length), color: T1 },
              { label: isEs ? 'Tiempo total' : 'Total time', value: totalDuration > 0 ? Math.round(totalDuration / 60) + 'h' : '—', color: T1 },
              { label: isEs ? 'Este mes' : 'This period', value: filtered.filter(s => { const d = new Date(s.session_date); const m = new Date(); return d.getMonth() === m.getMonth(); }).length + '', color: ACC },
            ].map(k => (
              <div key={k.label} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, padding: '14px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 6 }}>{k.label}</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* CHART */}
        {!loading && chartData.length > 1 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '16px', ...animStyle(120) }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, marginBottom: 12 }}>
              {isEs ? 'Sesiones por semana' : 'Sessions per week'}
            </p>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={chartData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }} barCategoryGap="35%">
                <XAxis dataKey="week" tick={{ fill: T3, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(200,255,0,0.05)' }}
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 10, color: T1, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v}`, isEs ? 'Sesiones' : 'Sessions'] as [string, string]}
                />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={i === chartData.length - 1 ? ACC : '#222230'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* GRID VIEW */}
        {!loading && viewMode === 'grid' && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, ...animStyle(160) }}>
            {filtered.map(s => {
              const date = new Date(s.session_date)
              const dayLabelLower = (s.day_label ?? '').toLowerCase()
              const tagColor = dayLabelLower.includes('push') ? '#FF6B35' : dayLabelLower.includes('pull') ? '#00D4FF' : dayLabelLower.includes('leg') || dayLabelLower.includes('pier') ? '#A855F7' : ACC
              return (
                <button key={s.id} onClick={() => setSelectedSessionId(s.id)} style={{
                  display: 'flex', flexDirection: 'column', gap: 8, padding: '14px',
                  background: CARD, border: '1px solid ' + BORDER, borderRadius: 14,
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: T1, lineHeight: 1 }}>{date.getDate()}</div>
                    {s.day_label && <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: tagColor, background: tagColor + '18', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>{s.day_label}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono, monospace', textTransform: 'capitalize' }}>
                    {date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'short', month: 'short' })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: T2, fontFamily: 'DM Mono, monospace' }}>{s.duration_minutes ? `${s.duration_minutes}min` : '—'}</span>
                    {s.pump_rating != null && <span style={{ fontSize: 11, color: ACC, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>💪{s.pump_rating}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* COMPACT VIEW */}
        {!loading && viewMode === 'compact' && filtered.length > 0 && (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 16, overflow: 'hidden', ...animStyle(160) }}>
            {filtered.map((s, i) => {
              const date = new Date(s.session_date)
              const dayLabelLower = (s.day_label ?? '').toLowerCase()
              const tagColor = dayLabelLower.includes('push') ? '#FF6B35' : dayLabelLower.includes('pull') ? '#00D4FF' : dayLabelLower.includes('leg') || dayLabelLower.includes('pier') ? '#A855F7' : ACC
              return (
                <button key={s.id} onClick={() => setSelectedSessionId(s.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'none', border: 'none', borderTop: i > 0 ? '1px solid ' + BORDER : 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: T3, width: 32, flexShrink: 0 }}>
                    {date.getDate()}/{date.getMonth() + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: T1, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                      {s.day_label || date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'long' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {s.duration_minutes && <span style={{ fontSize: 10, color: T3, fontFamily: 'DM Mono, monospace' }}>{s.duration_minutes}m</span>}
                    {s.day_label && <span style={{ fontSize: 8, fontWeight: 700, color: tagColor, background: tagColor + '18', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase' }}>{s.day_label}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* SESSION LIST (default) */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...animStyle(160) }}>
            {[1,2,3,4].map(i => <Skel key={i} h={64} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 18, padding: '48px 20px', textAlign: 'center', ...animStyle(160) }}>
            <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: T1, marginBottom: 8 }}>
              {isEs ? 'Sin sesiones en este período' : 'No sessions in this period'}
            </p>
            <p style={{ fontSize: 13, color: T3, marginBottom: 20 }}>
              {isEs ? 'Completa un entrenamiento para verlo aqui' : 'Complete a workout to see it here'}
            </p>
            <Link href={`/${locale}/session/new`} style={{ display: 'inline-block', background: 'rgba(200,255,0,0.1)', color: ACC, border: '1px solid rgba(200,255,0,0.2)', borderRadius: 12, padding: '12px 28px', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700 }}>
              {isEs ? 'Entrenar' : 'Train'}
            </Link>
          </div>
        ) : viewMode !== 'list' ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...animStyle(160) }}>
            {/* Group by week — Hevy-style */}
            {(() => {
              const getWeekKey = (dateStr: string) => {
                const d = new Date(dateStr)
                const mon = new Date(d)
                mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
                return mon.toISOString().split('T')[0]
              }
              const getWeekLabel = (weekKey: string) => {
                const mon = new Date(weekKey + 'T12:00:00Z')
                const nowKey = getWeekKey(new Date().toISOString().split('T')[0])
                if (weekKey === nowKey) return isEs ? 'Esta semana' : 'This week'
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
                const fmtMon = mon.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
                const fmtSun = sun.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
                return `${fmtMon} – ${fmtSun}`
              }
              // Build ordered week groups
              const weekGroups: { key: string; label: string; sessions: SessionRow[] }[] = []
              const weekMap = new Map<string, SessionRow[]>()
              for (const s of filtered) {
                const wk = getWeekKey(s.session_date)
                if (!weekMap.has(wk)) weekMap.set(wk, [])
                weekMap.get(wk)!.push(s)
              }
              for (const [k, sessions] of weekMap) weekGroups.push({ key: k, label: getWeekLabel(k), sessions })
              weekGroups.sort((a, b) => b.key.localeCompare(a.key))

              return weekGroups.map(wg => (
                <div key={wg.key} style={{ marginBottom: 8 }}>
                  {/* Week header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T3 }}>
                      {wg.label}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: T3 }}>
                      {wg.sessions.length} {isEs ? 'sesiones' : 'sessions'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {wg.sessions.map(s => {
                      const date = new Date(s.session_date)
                      const label = date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })
                      const isExp = expanded === s.id
                      // Determine split type tag color
                      const dayLabelLower = (s.day_label ?? '').toLowerCase()
                      const tagColor = dayLabelLower.includes('push') ? '#FF6B35'
                        : dayLabelLower.includes('pull') ? '#00D4FF'
                        : dayLabelLower.includes('leg') || dayLabelLower.includes('pier') ? '#A855F7'
                        : ACC
                      return (
                        <div key={s.id} style={{ background: CARD, border: '1px solid ' + BORDER, borderRadius: 14, overflow: 'hidden' }}>
                          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => setExpanded(isExp ? null : s.id)}>
                            {/* Date badge */}
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14, color: T1, lineHeight: 1 }}>{date.getDate()}</span>
                              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: T3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {date.toLocaleDateString(isEs ? 'es-ES' : 'en-US', { weekday: 'short' }).slice(0, 3)}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <p style={{ fontWeight: 600, fontSize: 13, color: T1, fontFamily: 'Syne, sans-serif', textTransform: 'capitalize' }}>{label}</p>
        
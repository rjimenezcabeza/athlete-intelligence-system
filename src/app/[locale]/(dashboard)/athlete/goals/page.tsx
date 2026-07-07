'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AthleteTabBar } from '@/components/athlete/AthleteTabBar'

const BG='var(--bg-primary,#0A0A0F)',CARD='var(--card-bg,rgba(255,255,255,.04))',BDR='var(--card-border,rgba(255,255,255,.08))',T1='var(--text-primary,#fff)',T2='var(--text-secondary,#888)',T3='var(--text-tertiary,#44445a)',ACC='var(--accent-color,#C8FF00)'

const GOAL_TYPES = [
  { value: 'general', label: 'General', emoji: '🎯' },
  { value: 'weight', label: 'Peso corporal', emoji: '⚖️' },
  { value: 'strength', label: 'Fuerza', emoji: '💪' },
  { value: 'volume', label: 'Volumen', emoji: '📊' },
  { value: 'habit', label: 'Hábito', emoji: '✅' },
  { value: 'nutrition', label: 'Nutrición', emoji: '🥗' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Activo', color: ACC, bg: 'rgba(200,255,0,.1)' },
  completed: { label: 'Completado', color: '#4ADE80', bg: 'rgba(74,222,128,.1)' },
  paused: { label: 'Pausado', color: '#FFA500', bg: 'rgba(255,165,0,.1)' },
  cancelled: { label: 'Cancelado', color: '#FF6B6B', bg: 'rgba(255,107,107,.1)' },
}

function ProgressBar({ current, target, color }: { current: number; target: number; color: string }) {
  const pct = Math.min(Math.round((current / target) * 100), 100)
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace' }}>{current} / {target}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'DM Mono,monospace' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active')

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', goal_type: 'general', emoji: '🎯',
    target_value: '', current_value: '', unit: '',
    target_date: '', priority: '2',
  })

  useEffect(() => {
    fetch('/api/goals').then(r => r.json()).then(d => setGoals(d.goals || [])).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          target_value: form.target_value ? parseFloat(form.target_value) : null,
          current_value: form.current_value ? parseFloat(form.current_value) : null,
          priority: parseInt(form.priority),
        }),
      })
      const data = await res.json()
      if (data.goal) {
        setGoals(prev => [data.goal, ...prev])
        setShowForm(false)
        setForm({ title: '', description: '', goal_type: 'general', emoji: '🎯', target_value: '', current_value: '', unit: '', target_date: '', priority: '2' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status } : g))
  }

  async function deleteGoal(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const filtered = goals.filter(g => filterStatus === 'all' ? true : g.status === filterStatus)
  const stats = { active: goals.filter(g => g.status === 'active').length, completed: goals.filter(g => g.status === 'completed').length }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 110 }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .goal-card:hover{transform:translateY(-1px)!important}
        .goal-card{transition:transform .2s,box-shadow .2s}
        input,textarea,select{outline:none;font-family:inherit}
        input:focus,textarea:focus,select:focus{border-color:var(--accent-color,#C8FF00)!important}
      `}</style>

      <div style={{ paddingTop: 52 }}>
        <AthleteTabBar locale={locale} />
      </div>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: 'Syne,sans-serif', letterSpacing: '-0.02em' }}>
              🎯 Metas
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T2 }}>
              {stats.active} activa{stats.active !== 1 ? 's' : ''} · {stats.completed} completada{stats.completed !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            padding: '10px 16px', background: ACC, color: '#0A0A0F', border: 'none',
            borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            + Nueva
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, borderBottom: `1px solid ${BDR}`, paddingBottom: 0 }}>
          {(['active', 'all', 'completed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono,monospace',
              color: filterStatus === s ? ACC : T3,
              borderBottom: filterStatus === s ? `2px solid ${ACC}` : '2px solid transparent',
              transition: 'color .2s', marginBottom: -1,
            }}>
              {s === 'all' ? 'Todas' : s === 'active' ? 'Activas' : 'Completadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Goals list */}
      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 100, background: CARD, borderRadius: 14, marginBottom: 10, animation: 'shimmer 1.5s infinite', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%)', backgroundSize: '200% 100%' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: T3 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T2 }}>
              {filterStatus === 'completed' ? 'No hay metas completadas' : 'No tienes metas activas'}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 13 }}>
              {filterStatus !== 'completed' && 'Crea tu primera meta y empieza a progresar'}
            </p>
            {filterStatus !== 'completed' && (
              <button onClick={() => setShowForm(true)} style={{
                marginTop: 20, padding: '12px 24px', background: ACC, color: '#0A0A0F',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                + Crear meta
              </button>
            )}
          </div>
        ) : (
          filtered.map((goal, i) => {
            const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active
            const typeInfo = GOAL_TYPES.find(t => t.value === goal.goal_type)
            const hasProgress = goal.target_value && goal.current_value

            return (
              <div key={goal.id} className="goal-card" style={{
                padding: '16px', background: CARD, border: `1px solid ${BDR}`,
                borderRadius: 16, marginBottom: 10,
                animation: `fadeUp .35s ease-out ${i * 50}ms both`,
                borderLeft: `3px solid ${cfg.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{goal.emoji || typeInfo?.emoji || '🎯'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T1, lineHeight: 1.3 }}>{goal.title}</h3>
                      {goal.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: T2, lineHeight: 1.5 }}>{goal.description}</p>}

                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 8px', background: cfg.bg, color: cfg.color, borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: 'DM Mono,monospace' }}>
                          {cfg.label}
                        </span>
                        {typeInfo && (
                          <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,.06)', color: T3, borderRadius: 6, fontSize: 10, fontFamily: 'DM Mono,monospace' }}>
                            {typeInfo.label}
                          </span>
                        )}
                        {goal.target_date && (
                          <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,.06)', color: T3, borderRadius: 6, fontSize: 10, fontFamily: 'DM Mono,monospace' }}>
                            📅 {new Date(goal.target_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      {hasProgress && (
                        <ProgressBar current={goal.current_value} target={goal.target_value} color={cfg.color} />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                    {goal.status === 'active' && (
                      <button onClick={() => updateStatus(goal.id, 'completed')} style={{
                        padding: '6px 10px', background: 'rgba(74,222,128,.1)', color: '#4ADE80',
                        border: '1px solid rgba(74,222,128,.2)', borderRadius: 8, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>✓ Lograda</button>
                    )}
                    {goal.status !== 'active' && (
                      <button onClick={() => updateStatus(goal.id, 'active')} style={{
                        padding: '6px 10px', background: 'rgba(200,255,0,.08)', color: ACC,
                        border: `1px solid ${BDR}`, borderRadius: 8, fontSize: 11, cursor: 'pointer',
                      }}>Reactivar</button>
                    )}
                    <button onClick={() => deleteGoal(goal.id)} style={{
                      padding: '6px 10px', background: 'rgba(255,107,107,.08)', color: '#FF6B6B',
                      border: '1px solid rgba(255,107,107,.2)', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                    }}>Eliminar</button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{
            width: '100%', maxHeight: '90vh', overflow: 'auto',
            background: '#111118', borderRadius: '24px 24px 0 0',
            border: `1px solid ${BDR}`, padding: '24px 20px 40px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'Syne,sans-serif' }}>Nueva Meta</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: T2, fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Emoji + Title row */}
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  style={{ width: 52, padding: '12px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 22, textAlign: 'center' }} />
                <input required placeholder="Título de la meta *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ flex: 1, padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14 }} />
              </div>

              <textarea placeholder="Descripción (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} style={{ padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14, resize: 'none' }} />

              <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))}
                style={{ padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14 }}>
                {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
                <input placeholder="Valor objetivo" type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                  style={{ padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14 }} />
                <input placeholder="Valor actual" type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))}
                  style={{ padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14 }} />
                <input placeholder="kg / reps..." value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{ padding: '12px 10px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace', display: 'block', marginBottom: 6 }}>FECHA OBJETIVO</label>
                  <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: T3, fontFamily: 'DM Mono,monospace', display: 'block', marginBottom: 6 }}>PRIORIDAD</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, color: T1, fontSize: 14 }}>
                    <option value="1">🔴 Alta</option>
                    <option value="2">🟡 Media</option>
                    <option value="3">🟢 Baja</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={saving} style={{
                padding: '14px', background: ACC, color: '#0A0A0F',
                border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, fontFamily: 'Syne,sans-serif',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, marginTop: 4,
              }}>
                {saving ? 'Guardando...' : 'Crear Meta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface MuscleData {
  muscleGroup: string
  setsThisWeek: number
  volumeKg: number
  avgRir: number | null
  landmarks: { mev: number; mav: number; mrv: number }
  status: 'empty' | 'below_mev' | 'optimal' | 'high' | 'above_mrv'
  percentOfMav: number
}

const COLORS: Record<string, string> = {
  empty: '#2a2a2a', below_mev: '#FF9800', optimal: '#C8FF00', high: '#4CAF50', above_mrv: '#FF5252'
}

const MUSCLE_NAME: Record<string, Record<string, string>> = {
  es: { pecho: 'Pecho', dorsales: 'Dorsales', espalda: 'Espalda', deltoides: 'Deltoides', biceps: 'Biceps', triceps: 'Triceps', cuadriceps: 'Cuads', isquiotibiales: 'Isquios', gluteos: 'Gluteos', gemelos: 'Gemelos', core: 'Core', trapecios: 'Trapecios', aductor: 'Aductor' },
  en: { pecho: 'Chest', dorsales: 'Lats', espalda: 'Back', deltoides: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps', cuadriceps: 'Quads', isquiotibiales: 'Hamstrings', gluteos: 'Glutes', gemelos: 'Calves', core: 'Core', trapecios: 'Traps', aductor: 'Adductors' },
  fr: { pecho: 'Poitrine', dorsales: 'Dorsaux', espalda: 'Dos', deltoides: 'Epaules', biceps: 'Biceps', triceps: 'Triceps', cuadriceps: 'Quadriceps', isquiotibiales: 'Ischio', gluteos: 'Fessiers', gemelos: 'Mollets', core: 'Abdos', trapecios: 'Trapeze', aductor: 'Adducteur' },
  de: { pecho: 'Brust', dorsales: 'Latissimus', espalda: 'Rucken', deltoides: 'Schultern', biceps: 'Bizeps', triceps: 'Trizeps', cuadriceps: 'Quadrizeps', isquiotibiales: 'Beinbeuger', gluteos: 'Gesass', gemelos: 'Wade', core: 'Rumpf', trapecios: 'Trapez', aductor: 'Adduktoren' },
  it: { pecho: 'Petto', dorsales: 'Dorsali', espalda: 'Schiena', deltoides: 'Spalle', biceps: 'Bicipiti', triceps: 'Tricipiti', cuadriceps: 'Quadricipiti', isquiotibiales: 'Ischiocrurali', gluteos: 'Glutei', gemelos: 'Polpacci', core: 'Core', trapecios: 'Trapezi', aductor: 'Adduttori' },
  nl: { pecho: 'Borst', dorsales: 'Rug', espalda: 'Rug', deltoides: 'Schouders', biceps: 'Biceps', triceps: 'Triceps', cuadriceps: 'Quadriceps', isquiotibiales: 'Hamstrings', gluteos: 'Bilspieren', gemelos: 'Kuiten', core: 'Core', trapecios: 'Trapezius', aductor: 'Adductoren' }
}

const STATUS_LABEL: Record<string, Record<string, string>> = {
  es: { below_mev: 'Bajo MEV', optimal: 'Optimo', high: 'Alto', above_mrv: 'Sobre MRV' },
  en: { below_mev: 'Below MEV', optimal: 'Optimal', high: 'High', above_mrv: 'Above MRV' },
  fr: { below_mev: 'Sous MEV', optimal: 'Optimal', high: 'Eleve', above_mrv: 'Dessus MRV' },
  de: { below_mev: 'Unter MEV', optimal: 'Optimal', high: 'Hoch', above_mrv: 'Uber MRV' },
  it: { below_mev: 'Sotto MEV', optimal: 'Ottimale', high: 'Alto', above_mrv: 'Sopra MRV' },
  nl: { below_mev: 'Onder MEV', optimal: 'Optimaal', high: 'Hoog', above_mrv: 'Boven MRV' }
}

const TITLE: Record<string, string> = {
  es: 'Volumen Semanal', en: 'Weekly Volume', fr: 'Volume Hebdomadaire',
  de: 'Wochenvolumen', it: 'Volume Settimanale', nl: 'Weekelijks Volume'
}

const WEEK_OF: Record<string, string> = {
  es: 'Semana del', en: 'Week of', fr: 'Semaine du', de: 'Woche vom', it: 'Settimana del', nl: 'Week van'
}

export function MuscleVolumeChart({ locale = 'es' }: { locale?: string }) {
  const [muscleData, setMuscleData] = useState<MuscleData[]>([])
  const [weekStart, setWeekStart] = useState('')
  const [loading, setLoading] = useState(true)

  const names = MUSCLE_NAME[locale] || MUSCLE_NAME.es
  const statusLabel = STATUS_LABEL[locale] || STATUS_LABEL.es

  useEffect(() => {
    fetch('/api/volume/weekly')
      .then(r => r.json())
      .then(d => { setMuscleData(d.muscleVolume || []); setWeekStart(d.weekStart || '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', color: '#555', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
        {locale === 'es' ? 'Calculando volumen...' : 'Calculating volume...'}
      </div>
    )
  }

  const activeCount = muscleData.filter(d => d.setsThisWeek > 0).length
  const totalSets = muscleData.reduce((s, d) => s + d.setsThisWeek, 0)

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'Syne, sans-serif', letterSpacing: '0.5px' }}>
          {TITLE[locale] || TITLE.en}
        </h3>
        {weekStart && (
          <span style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
            {WEEK_OF[locale] || WEEK_OF.en} {new Date(weekStart + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {Object.entries(COLORS).filter(([k]) => k !== 'empty').map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '10px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
              {statusLabel[status]}
            </span>
          </div>
        ))}
      </div>

      {/* Barras */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {muscleData.map(m => {
          const name = names[m.muscleGroup] || m.muscleGroup
          const color = COLORS[m.status]
          const barW = Math.min(m.percentOfMav, 100)
          const isActive = m.setsThisWeek > 0

          return (
            <div key={m.muscleGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '85px', fontSize: '12px', color: isActive ? '#ccc' : '#444', fontFamily: 'DM Mono, monospace', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
              <div style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{
                  height: '100%', width: `${barW}%`, background: color,
                  borderRadius: '4px', transition: 'width 0.6s cubic-bezier(.25,.8,.25,1)',
                  opacity: isActive ? 1 : 0.25
                }} />
              </div>
              <div style={{ width: '48px', fontSize: '11px', color: isActive ? color : '#444', fontFamily: 'DM Mono, monospace', textAlign: 'right', flexShrink: 0 }}>
                {isActive ? `${m.setsThisWeek}s` : '-'}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '14px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace', lineHeight: '1.5' }}>
        MEV = minimo efectivo | MAV = maximo adaptativo | MRV = maximo recuperable
      </div>

      {activeCount > 0 && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#666', fontFamily: 'DM Mono, monospace' }}>
          {activeCount} {locale === 'es' ? 'musculos entrenados esta semana' : 'muscles trained this week'} | {totalSets} sets
        </div>
      )}
    </div>
  )
}

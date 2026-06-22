'use client'

import { useState, useEffect } from 'react'

interface StallingData {
  stallingExercises: Array<{ exerciseId: string; name: string; muscle: string; count: number }>
  deloadRecommended: boolean
  nearingMesoEnd: boolean
  activeMesocycle: { name: string; currentWeek: number; totalWeeks: number } | null
}

const T: Record<string, Record<string, string>> = {
  es: { deloadTitle: 'Semana de Descarga Recomendada', stallingTitle: 'Estancamiento Detectado', deloadDesc: 'Tu cuerpo lleva varias sesiones sin progresar. Una semana de descarga optimizara tu recuperacion.', nearEndDesc: 'Estas llegando al final de tu mesociclo. Es buen momento para planificar una descarga.', dismiss: 'Ignorar', exercises: 'ejercicios estancados', weekOf: 'Semana', of: 'de' },
  en: { deloadTitle: 'Deload Week Recommended', stallingTitle: 'Stalling Detected', deloadDesc: 'Several sessions without progress detected. A deload week will optimize your recovery.', nearEndDesc: 'You are nearing the end of your mesocycle. Good time to plan a deload.', dismiss: 'Dismiss', exercises: 'stalling exercises', weekOf: 'Week', of: 'of' },
  fr: { deloadTitle: 'Semaine de decharge recommandee', stallingTitle: 'Stagnation detectee', deloadDesc: 'Plusieurs seances sans progres. Une semaine de decharge optimisera votre recuperation.', nearEndDesc: 'Vous approchez de la fin de votre mesocycle. Bon moment pour planifier une decharge.', dismiss: 'Ignorer', exercises: 'exercices stagnants', weekOf: 'Semaine', of: 'sur' },
  de: { deloadTitle: 'Deload-Woche empfohlen', stallingTitle: 'Stagnation erkannt', deloadDesc: 'Mehrere Einheiten ohne Fortschritt. Eine Deload-Woche wird Ihre Erholung optimieren.', nearEndDesc: 'Sie nahern sich dem Ende Ihres Mesozyklus. Guter Zeitpunkt fur einen Deload.', dismiss: 'Ignorieren', exercises: 'stagnierende Ubungen', weekOf: 'Woche', of: 'von' },
  it: { deloadTitle: 'Settimana di scarico raccomandata', stallingTitle: 'Stallo rilevato', deloadDesc: 'Piu sessioni senza progressi. Una settimana di scarico ottimizzera il tuo recupero.', nearEndDesc: 'Stai avvicinandoti alla fine del tuo mesociclo. Buon momento per pianificare uno scarico.', dismiss: 'Ignora', exercises: 'esercizi in stallo', weekOf: 'Settimana', of: 'di' },
  nl: { deloadTitle: 'Deloadweek aanbevolen', stallingTitle: 'Stagnatie gedetecteerd', deloadDesc: 'Meerdere sessies zonder vooruitgang. Een deloadweek zal je herstel optimaliseren.', nearEndDesc: 'Je nadert het einde van je mesocyclus. Goed moment voor een deload.', dismiss: 'Negeren', exercises: 'stagnerende oefeningen', weekOf: 'Week', of: 'van' }
}

interface Props { locale?: string }

export function DeloadAlert({ locale = 'es' }: Props) {
  const [data, setData] = useState<StallingData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const t = T[locale] || T.es

  useEffect(() => {
    fetch('/api/progression/stalling-check')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }, [])

  if (!data || dismissed) return null
  if (!data.deloadRecommended && !data.nearingMesoEnd) return null

  const isStalling = data.stallingExercises.length >= 3
  const title = isStalling ? t.stallingTitle : t.deloadTitle
  const desc = data.nearingMesoEnd ? t.nearEndDesc : t.deloadDesc

  return (
    <div style={{ padding: '14px 16px', background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px' }}>⚠️</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#FF9800', fontFamily: 'Syne, sans-serif' }}>{title}</span>
        </div>
        <button onClick={() => setDismissed(true)} style={{ fontSize: '11px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Mono, monospace', padding: 0 }}>
          {t.dismiss}
        </button>
      </div>
      <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#888', lineHeight: '1.5' }}>{desc}</p>
      {isStalling && (
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#666', fontFamily: 'DM Mono, monospace' }}>
          {data.stallingExercises.slice(0, 3).map(e => e.name).join(', ')} · {data.stallingExercises.length} {t.exercises}
        </p>
      )}
      {data.activeMesocycle && (
        <p style={{ margin: 0, fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
          {t.weekOf} {data.activeMesocycle.currentWeek} {t.of} {data.activeMesocycle.totalWeeks} — {data.activeMesocycle.name}
        </p>
      )}
    </div>
  )
}

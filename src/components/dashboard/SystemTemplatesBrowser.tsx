'use client'

import { useState, useEffect } from 'react'

export interface SystemTemplate {
  id: string
  name: string
  description: string
  training_days_per_week: number
  split_type: string
  mesocycle_weeks: number
  difficulty_level: string
  split_description: string
  target_muscle_groups: string[]
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#FF5252'
}

const DIFFICULTY_LABELS: Record<string, Record<string, string>> = {
  es: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
  en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  fr: { beginner: 'Debutant', intermediate: 'Intermediaire', advanced: 'Avance' },
  de: { beginner: 'Anfanger', intermediate: 'Mittelstufe', advanced: 'Fortgeschritten' },
  it: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzato' },
  nl: { beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' }
}

const T: Record<string, Record<string, string>> = {
  es: { title: 'Rutinas Predefinidas', subtitle: 'Selecciona una rutina para empezar tu bloque', days: 'dias/sem', weeks: 'sem', all: 'Todos', select: 'Usar esta rutina', close: 'Cerrar' },
  en: { title: 'Preset Routines', subtitle: 'Select a routine to start your training block', days: 'd/wk', weeks: 'wks', all: 'All', select: 'Use this routine', close: 'Close' },
  fr: { title: 'Routines predefinies', subtitle: 'Selectionnez une routine', days: 'j/sem', weeks: 'sem', all: 'Tous', select: 'Utiliser', close: 'Fermer' },
  de: { title: 'Vordefinierte Routinen', subtitle: 'Routine auswahlen', days: 'T/Wo', weeks: 'Wo', all: 'Alle', select: 'Verwenden', close: 'Schliessen' },
  it: { title: 'Routine predefinite', subtitle: 'Seleziona una routine', days: 'gg/sett', weeks: 'sett', all: 'Tutti', select: 'Usa questa', close: 'Chiudi' },
  nl: { title: 'Vooraf ingestelde routines', subtitle: 'Selecteer een routine', days: 'd/wk', weeks: 'wkn', all: 'Alle', select: 'Gebruik deze', close: 'Sluiten' }
}

interface Props {
  locale?: string
  onSelectTemplate?: (template: SystemTemplate) => void
  onClose?: () => void
}

export function SystemTemplatesBrowser({ locale = 'es', onSelectTemplate, onClose }: Props) {
  const [templates, setTemplates] = useState<SystemTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const t = T[locale] || T.es
  const diffLabels = DIFFICULTY_LABELS[locale] || DIFFICULTY_LABELS.es

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => setTemplates(d.systemTemplates || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? templates
    : templates.filter(tmpl => String(tmpl.training_days_per_week) === filter)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1100, padding: 0 }}>
      <div style={{ background: '#0f0f14', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>{t.title}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{t.subtitle}</p>
            </div>
            <button onClick={onClose} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
              {t.close}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', '3', '4', '5', '6'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 10px', background: filter === f ? 'rgba(200,255,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === f ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', color: filter === f ? '#C8FF00' : '#666', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
                {f === 'all' ? t.all : `${f} ${t.days}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '72px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
            ))
          ) : filtered.map(tmpl => {
            const isSelected = selected === tmpl.id
            const diffColor = DIFFICULTY_COLORS[tmpl.difficulty_level] || '#888'

            return (
              <div key={tmpl.id} onClick={() => setSelected(isSelected ? null : tmpl.id)} style={{ padding: '14px 16px', background: isSelected ? 'rgba(200,255,0,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(200,255,0,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'Syne, sans-serif' }}>{tmpl.name}</span>
                      <span style={{ fontSize: '10px', color: diffColor, fontFamily: 'DM Mono, monospace', padding: '2px 6px', background: `${diffColor}18`, borderRadius: '4px', border: `1px solid ${diffColor}30` }}>
                        {diffLabels[tmpl.difficulty_level] || tmpl.difficulty_level}
                      </span>
                    </div>
                    {isSelected && tmpl.split_description && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', lineHeight: '1.5' }}>
                        {tmpl.split_description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', color: '#C8FF00', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>
                      {tmpl.training_days_per_week}d
                    </span>
                    <span style={{ fontSize: '10px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
                      {tmpl.mesocycle_weeks} {t.weeks}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <button
                    onClick={e => { e.stopPropagation(); onSelectTemplate?.(tmpl) }}
                    style={{ marginTop: '12px', width: '100%', padding: '10px', background: '#C8FF00', border: 'none', borderRadius: '8px', color: '#0A0A0F', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
                  >
                    {t.select}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

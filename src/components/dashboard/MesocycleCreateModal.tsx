'use client'

import { useState, useEffect } from 'react'
import { useMesocycle } from '@/hooks/useMesocycle'

interface Template {
  id: string
  name: string
  training_days_per_week: number | null
  split_type: string | null
  mesocycle_weeks: number | null
}

interface Props { locale?: string; onClose: () => void; onCreated?: () => void }

const TM: Record<string, Record<string, string>> = {
  es: { title: 'Nuevo Bloque de Entrenamiento', name: 'Nombre del bloque', namePh: 'Ej: Bloque Volumen Verano', goal: 'Objetivo', goalPh: 'Ej: Maxima hipertrofia', weeks: 'Duracion (semanas)', template: 'Rutina base (opcional)', noTemplate: 'Sin rutina', deload: 'Semana de descarga', noDeload: 'Sin descarga', create: 'Crear bloque', cancel: 'Cancelar', creating: 'Creando...' },
  en: { title: 'New Training Block', name: 'Block name', namePh: 'E.g: Summer Volume Block', goal: 'Goal', goalPh: 'E.g: Maximum hypertrophy', weeks: 'Duration (weeks)', template: 'Base routine (optional)', noTemplate: 'No routine', deload: 'Deload week', noDeload: 'No deload', create: 'Create block', cancel: 'Cancel', creating: 'Creating...' },
  fr: { title: 'Nouveau Bloc', name: 'Nom du bloc', namePh: 'Ex: Bloc Volume Ete', goal: 'Objectif', goalPh: 'Ex: Hypertrophie maximale', weeks: 'Duree (semaines)', template: 'Routine de base', noTemplate: 'Sans routine', deload: 'Semaine de decharge', noDeload: 'Sans decharge', create: 'Creer le bloc', cancel: 'Annuler', creating: 'Creation...' },
  de: { title: 'Neuer Trainingsblock', name: 'Blockname', namePh: 'Z.B: Sommervolumen Block', goal: 'Ziel', goalPh: 'Z.B: Maximale Hypertrophie', weeks: 'Dauer (Wochen)', template: 'Basisroutine', noTemplate: 'Keine Routine', deload: 'Deload-Woche', noDeload: 'Kein Deload', create: 'Block erstellen', cancel: 'Abbrechen', creating: 'Erstellen...' },
  it: { title: 'Nuovo Blocco', name: 'Nome del blocco', namePh: 'Es: Blocco Volume Estate', goal: 'Obiettivo', goalPh: 'Es: Massima ipertrofia', weeks: 'Durata (settimane)', template: 'Routine base', noTemplate: 'Senza routine', deload: 'Settimana di scarico', noDeload: 'Senza scarico', create: 'Crea blocco', cancel: 'Annulla', creating: 'Creazione...' },
  nl: { title: 'Nieuw Trainingsblok', name: 'Bloknaam', namePh: 'Bijv: Zomer Volume Blok', goal: 'Doel', goalPh: 'Bijv: Maximale hypertrofie', weeks: 'Duur (weken)', template: 'Basisroutine', noTemplate: 'Geen routine', deload: 'Deloadweek', noDeload: 'Geen deload', create: 'Blok aanmaken', cancel: 'Annuleren', creating: 'Aanmaken...' }
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }

export function MesocycleCreateModal({ locale = 'es', onClose, onCreated }: Props) {
  const t = TM[locale] || TM.es
  const { create } = useMesocycle()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [weeks, setWeeks] = useState(6)
  const [templateId, setTemplateId] = useState('')
  const [deloadWeek, setDeloadWeek] = useState(0)
  const [templates, setTemplates] = useState<Template[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await create({ name: name.trim(), goal: goal.trim() || undefined, totalWeeks: weeks, templateId: templateId || undefined, deloadWeek: deloadWeek || undefined })
      onCreated?.()
      onClose()
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const btnStyle = (active: boolean, color = '#C8FF00'): React.CSSProperties => ({
    padding: '8px 14px',
    background: active ? `rgba(${color === '#C8FF00' ? '200,255,0' : '255,152,0'},0.15)` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? (color === '#C8FF00' ? 'rgba(200,255,0,0.4)' : 'rgba(255,152,0,0.3)') : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '8px', color: active ? color : '#666', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Mono, monospace'
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#111115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>{t.title}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{t.name}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{t.goal}</label>
            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder={t.goalPh} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{t.weeks}: {weeks}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[4, 5, 6, 8, 10, 12].map(w => (
                <button key={w} onClick={() => setWeeks(w)} style={btnStyle(weeks === w)}>{w}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{t.deload}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setDeloadWeek(0)} style={{ ...btnStyle(deloadWeek === 0), background: deloadWeek === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', color: deloadWeek === 0 ? '#ccc' : '#666' }}>{t.noDeload}</button>
              {Array.from({ length: weeks }, (_, i) => i + 1).map(w => (
                <button key={w} onClick={() => setDeloadWeek(w)} style={btnStyle(deloadWeek === w, '#FF9800')}>S{w}</button>
              ))}
            </div>
          </div>

          {templates.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{t.template}</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">{t.noTemplate}</option>
                {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>{t.cancel}</button>
          <button onClick={handleSubmit} disabled={!name.trim() || submitting} style={{ flex: 2, padding: '12px', background: name.trim() ? '#C8FF00' : 'rgba(200,255,0,0.1)', border: 'none', borderRadius: '10px', color: name.trim() ? '#0A0A0F' : '#555', fontSize: '14px', fontWeight: '700', cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Syne, sans-serif', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? t.creating : t.create}
          </button>
        </div>
      </div>
    </div>
  )
}

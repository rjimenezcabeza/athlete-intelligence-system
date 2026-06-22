'use client'

import { useState } from 'react'
import { useMesocycle } from '@/hooks/useMesocycle'

const T: Record<string, Record<string, string>> = {
  es: { week: 'Semana', of: 'de', active: 'Mesociclo activo', noMeso: 'Sin mesociclo activo', createNew: 'Crear bloque', deload: 'Semana de Descarga', sessions: 'sesiones esta semana', complete: 'Completar bloque', progress: 'Progreso del bloque', daysLeft: 'semanas restantes' },
  en: { week: 'Week', of: 'of', active: 'Active Mesocycle', noMeso: 'No active mesocycle', createNew: 'Create block', deload: 'Deload Week', sessions: 'sessions this week', complete: 'Complete block', progress: 'Block progress', daysLeft: 'weeks remaining' },
  fr: { week: 'Semaine', of: 'sur', active: 'Mesocycle actif', noMeso: 'Pas de mesocycle actif', createNew: 'Creer un bloc', deload: 'Semaine de decharge', sessions: 'seances cette semaine', complete: 'Terminer le bloc', progress: 'Progression du bloc', daysLeft: 'semaines restantes' },
  de: { week: 'Woche', of: 'von', active: 'Aktiver Mesozyklus', noMeso: 'Kein aktiver Mesozyklus', createNew: 'Block erstellen', deload: 'Deload-Woche', sessions: 'Einheiten diese Woche', complete: 'Block abschliessen', progress: 'Blockfortschritt', daysLeft: 'verbleibende Wochen' },
  it: { week: 'Settimana', of: 'di', active: 'Mesociclo attivo', noMeso: 'Nessun mesociclo attivo', createNew: 'Crea blocco', deload: 'Settimana di scarico', sessions: 'sessioni questa settimana', complete: 'Completa blocco', progress: 'Progresso del blocco', daysLeft: 'settimane rimanenti' },
  nl: { week: 'Week', of: 'van', active: 'Actieve mesocyclus', noMeso: 'Geen actieve mesocyclus', createNew: 'Blok aanmaken', deload: 'Deloadweek', sessions: 'sessies deze week', complete: 'Blok voltooien', progress: 'Blokvoortgang', daysLeft: 'resterende weken' }
}

interface Props { locale?: string; onCreateClick?: () => void }

export function MesocycleWidget({ locale = 'es', onCreateClick }: Props) {
  const { mesocycle, loading, finish } = useMesocycle()
  const [finishing, setFinishing] = useState(false)
  const t = T[locale] || T.es

  if (loading) {
    return (
      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '120px', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
      </div>
    )
  }

  if (!mesocycle) {
    return (
      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#555', fontFamily: 'DM Mono, monospace' }}>{t.noMeso}</span>
        <button
          onClick={onCreateClick}
          style={{ padding: '8px 14px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '8px', color: '#C8FF00', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}
        >
          + {t.createNew}
        </button>
      </div>
    )
  }

  const weeksLeft = mesocycle.total_weeks - mesocycle.current_week
  const barColor = mesocycle.is_deload_week ? '#FF9800' : '#C8FF00'

  const handleFinish = async () => {
    if (!confirm(locale === 'es' ? '¿Marcar este bloque como completado?' : 'Mark this block as completed?')) return
    setFinishing(true)
    try { await finish(mesocycle.id) } finally { setFinishing(false) }
  }

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '2px' }}>{t.active}</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', fontFamily: 'Syne, sans-serif' }}>{mesocycle.name}</div>
        </div>
        <div style={{ padding: '6px 12px', background: mesocycle.is_deload_week ? 'rgba(255,152,0,0.15)' : 'rgba(200,255,0,0.12)', border: `1px solid ${mesocycle.is_deload_week ? 'rgba(255,152,0,0.3)' : 'rgba(200,255,0,0.25)'}`, borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: barColor, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{mesocycle.current_week}</div>
          <div style={{ fontSize: '10px', color: '#666', fontFamily: 'DM Mono, monospace' }}>{t.week} {t.of} {mesocycle.total_weeks}</div>
        </div>
      </div>

      {mesocycle.is_deload_week && (
        <div style={{ padding: '6px 10px', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#FF9800', fontFamily: 'DM Mono, monospace' }}>
          {t.deload}
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>
          <span>{t.progress}</span>
          <span>{mesocycle.progress_percent}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${mesocycle.progress_percent}%`, background: barColor, borderRadius: '3px', transition: 'width 0.6s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace' }}>
          {mesocycle.sessions_this_week} {t.sessions} · {weeksLeft} {t.daysLeft}
        </div>
        {mesocycle.current_week >= mesocycle.total_weeks && (
          <button
            onClick={handleFinish}
            disabled={finishing}
            style={{ padding: '6px 12px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '6px', color: '#C8FF00', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', opacity: finishing ? 0.5 : 1 }}
          >
            {t.complete} ✓
          </button>
        )}
      </div>
    </div>
  )
}

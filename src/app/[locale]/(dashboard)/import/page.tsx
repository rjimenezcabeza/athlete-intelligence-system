'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ImportCard from '@/components/import/ImportCard'

interface ImportRecord {
  id: string; original_filename: string; file_type: string
  import_status: string; extraction_confidence: number | null; uploaded_at: string
}

const ST: Record<string, { es: string; en: string; color: string }> = {
  pending:         { es: 'Pendiente',   en: 'Pending',    color: '#8888AA' },
  processing:      { es: 'Procesando',  en: 'Processing', color: '#FBBF24' },
  review_required: { es: 'En revision', en: 'In review',  color: '#60A5FA' },
  approved:        { es: 'Importado',   en: 'Imported',   color: '#C8FF00' },
  error:           { es: 'Error',       en: 'Error',      color: '#FF6B6B' },
}

export default function ImportPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [imports, setImports] = useState<ImportRecord[]>([])
  const [selected, setSelected] = useState<ImportRecord | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/import/list')
      if (res.status === 401) { router.push(`/${locale}/login`); return }
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('application/json')) return
      const data = await res.json()
      setImports(data.imports || [])
    } catch {}
  }

  useEffect(() => { load() }, [])

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(id)
    try {
      await fetch(`/api/import/${id}`, { method: 'DELETE' })
      setImports(prev => prev.filter(i => i.id !== id))
    } catch {}
    setDeleting(null)
  }

  const clearAll = async () => {
    setConfirmClear(false)
    const nonImported = imports.filter(i => i.import_status !== 'approved')
    for (const imp of nonImported) {
      try { await fetch(`/api/import/${imp.id}`, { method: 'DELETE' }) } catch {}
    }
    load()
  }

  const canRetry = (s: string) => ['pending','error'].includes(s)

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', paddingBottom: '100px' }}>
      <div style={{ padding: '28px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: '700', color: '#F0F0F5', marginBottom: '4px' }}>
            {isEs ? 'Importador IA' : 'AI Importer'}
          </h1>
          <p style={{ color: '#8888AA', fontSize: '13px' }}>
            {isEs ? 'Pasa cualquier registro y la IA lo estructura' : 'Pass any record and AI structures it'}
          </p>
        </div>
        {imports.length > 0 && (
          <button onClick={() => setConfirmClear(true)} style={{
            background: 'transparent', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '10px', color: '#FF6B6B', padding: '8px 14px',
            fontSize: '12px', fontWeight: '700', fontFamily: 'Syne, sans-serif', cursor: 'pointer'
          }}>
            {isEs ? 'Limpiar lista' : 'Clear list'}
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ImportCard locale={locale} onImportComplete={load} />

        {imports.length > 0 && (
          <div>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#44445a', fontFamily: 'Syne, sans-serif', marginBottom: '10px' }}>
              {imports.length} {isEs ? 'IMPORTACIONES' : 'IMPORTS'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {imports.map(imp => {
                const cfg = ST[imp.import_status] ?? ST.pending
                const conf = imp.extraction_confidence ? Math.round(imp.extraction_confidence * 100) + '%' : ''
                const retry = canRetry(imp.import_status)
                return (
                  <div key={imp.id}
                    onClick={() => retry && setSelected(imp)}
                    style={{
                      background: '#111118',
                      border: '1px solid ' + (retry ? 'rgba(200,255,0,0.1)' : 'rgba(255,255,255,0.05)'),
                      borderRadius: '14px', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: retry ? 'pointer' : 'default',
                    }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                      background: imp.file_type === 'image' ? '#1a1a2e' : '#1a2a00',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: '800', fontFamily: 'Syne, sans-serif',
                      color: imp.file_type === 'image' ? '#60A5FA' : '#C8FF00'
                    }}>
                      {imp.file_type === 'image' ? 'IMG' : 'EXC'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#F0F0F5', fontSize: '13px', fontWeight: '500', fontFamily: 'Syne, sans-serif', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {imp.original_filename}
                      </p>
                      <p style={{ color: '#44445a', fontSize: '11px' }}>
                        {new Date(imp.uploaded_at).toLocaleDateString()}
                        {conf && ' · ' + conf}
                        {retry && <span style={{ color: '#C8FF00', marginLeft: '6px' }}>
                          {isEs ? '· Toca para analizar' : '· Tap to analyze'}
                        </span>}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', fontFamily: 'Syne, sans-serif',
                      color: cfg.color, background: cfg.color + '15',
                      padding: '3px 8px', borderRadius: '6px', flexShrink: 0
                    }}>
                      {isEs ? cfg.es : cfg.en}
                    </span>
                    <button
                      onClick={e => deleteOne(imp.id, e)}
                      disabled={deleting === imp.id}
                      style={{
                        background: 'none', border: 'none', color: '#2a2a3e',
                        cursor: 'pointer', fontSize: '18px', padding: '0 0 0 4px',
                        flexShrink: 0, transition: 'color 0.15s',
                        opacity: deleting === imp.id ? 0.4 : 1
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF6B6B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#2a2a3e')}>
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal reintentar */}
      {selected && (
        <RetryModal imp={selected} locale={locale}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); load() }} />
      )}

      {/* Confirmar limpiar todo */}
      {confirmClear && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <p style={{ color: '#F0F0F5', fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '17px', marginBottom: '8px' }}>
              {isEs ? 'Limpiar lista' : 'Clear list'}
            </p>
            <p style={{ color: '#8888AA', fontSize: '13px', marginBottom: '24px' }}>
              {isEs ? 'Se eliminaran todas las importaciones no aprobadas. Las sesiones ya importadas se mantienen.' : 'All non-approved imports will be deleted. Already imported sessions are kept.'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, background: '#1a1a2e', border: 'none', borderRadius: '12px', color: '#8888AA', padding: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={clearAll} style={{ flex: 1, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '12px', color: '#FF6B6B', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Limpiar' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RetryModal({ imp, locale, onClose, onDone }: {
  imp: { id: string; original_filename: string }
  locale: string; onClose: () => void; onDone: () => void
}) {
  const isEs = locale === 'es'
  const [state, setState] = useState<'processing'|'done'|'error'>('processing')
  const [msg, setMsg] = useState('')

  const run = async () => {
    setState('processing'); setMsg('')
    try {
      // Usar cookie de sesion directamente — no depender de /api/auth/me
      const res = await fetch('/api/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // userId vacio: el servidor lo resolvera desde la cookie
        body: JSON.stringify({ importId: imp.id, userId: '' })
      })
      const ct = res.headers.get('content-type') ?? ''
      const data = ct.includes('application/json') ? await res.json() : { error: 'Error ' + res.status }
      if (!res.ok || !data.success) {
        setState('error'); setMsg(data.error ?? 'Error desconocido'); return
      }
      if ((data.sessionsFound ?? 0) > 0) {
        setState('done')
        setMsg(data.sessionsFound + (isEs ? ' sesion(es) · ' : ' session(s) · ') + Math.round((data.confidence ?? 0) * 100) + '%')
      } else {
        setState('error')
        setMsg(isEs ? 'No se encontraron datos de entrenamiento' : 'No training data found')
      }
    } catch (e) {
      setState('error'); setMsg(e instanceof Error ? e.message : 'Error')
    }
  }

  useEffect(() => { run() }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'Syne, sans-serif', color: '#44445a', letterSpacing: '0.1em', marginBottom: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {imp.original_filename}
        </p>
        {state === 'processing' && (
          <>
            <div style={{ width: '40px', height: '40px', border: '2.5px solid #C8FF00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#F0F0F5', fontFamily: 'Syne, sans-serif', fontWeight: '600', marginBottom: '6px' }}>
              {isEs ? 'Analizando con IA...' : 'Analyzing with AI...'}
            </p>
            <p style={{ color: '#44445a', fontSize: '12px' }}>
              {isEs ? 'Hasta 45 segundos en archivos grandes' : 'Up to 45s for large files'}
            </p>
          </>
        )}
        {state === 'done' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <p style={{ color: '#C8FF00', fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
              {isEs ? 'Analisis completado' : 'Analysis complete'}
            </p>
            <p style={{ color: '#8888AA', fontSize: '13px', marginBottom: '24px' }}>{msg}</p>
            <button onClick={onDone} style={{ background: 'linear-gradient(135deg,#C8FF00,#88DD00)', color: '#0A0A0F', border: 'none', borderRadius: '14px', padding: '14px 40px', fontSize: '15px', fontWeight: '700', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
              {isEs ? 'Ver resultados' : 'View results'}
            </button>
          </>
        )}
        {state === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px', color: '#FF6B6B' }}>✕</div>
            <p style={{ color: '#FF6B6B', fontFamily: 'Syne, sans-serif', fontWeight: '700', marginBottom: '8px' }}>
              {isEs ? 'Error en el analisis' : 'Analysis error'}
            </p>
            <p style={{ color: '#8888AA', fontSize: '12px', marginBottom: '24px' }}>{msg}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={run} style={{ background: '#1a2a00', color: '#C8FF00', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '12px', padding: '11px 24px', fontSize: '13px', fontWeight: '700', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                {isEs ? 'Reintentar' : 'Retry'}
              </button>
              <button onClick={onClose} style={{ background: '#1a1a2e', color: '#8888AA', border: 'none', borderRadius: '12px', padding: '11px 24px', fontSize: '13px', cursor: 'pointer' }}>
                {isEs ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </>
        )}
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
      </div>
    </div>
  )
}

'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function ImportCard({ locale, onImportComplete }: { locale: string; onImportComplete?: () => void }) {
  const isEs = locale === 'es'
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [importId, setImportId] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ sessions: number; confidence: number } | null>(null)

  const reset = () => { setPhase('idle'); setErrorMsg(''); setImportId(''); setResult(null); setProgress(0) }

  const handleFile = async (file: File) => {
    setPhase('uploading'); setProgress(0); setErrorMsg('')
    try {
      // Paso 1: Obtener URL firmada y crear registro en DB
      const urlRes = await fetch('/api/import/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
      })
      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({ error: 'Error ' + urlRes.status }))
        throw new Error(err.error ?? 'Error getting upload URL')
      }
      const { importId: newId, uploadUrl, token } = await urlRes.json()
      setImportId(newId)

      // Paso 2: Subir directamente a Supabase Storage (sin pasar por Vercel)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error('Storage upload failed: ' + xhr.status))
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      setProgress(100)

      // Paso 3: Procesar con IA (el archivo ya esta en Storage)
      setPhase('processing')
      await runProcess(newId)

    } catch (e) {
      setPhase('error')
      setErrorMsg(e instanceof Error ? e.message : String(e))
    }
  }

  const runProcess = async (id: string) => {
    try {
      const res = await fetch('/api/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: id, userId: '' })
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {
        throw new Error('Server error ' + res.status)
      }
      if (!res.ok) throw new Error(data.error ?? 'Error ' + res.status)
      if (!data.success) throw new Error(data.error ?? 'Process failed')

      setResult({ sessions: data.sessionsFound ?? 0, confidence: data.confidence ?? 0 })

      if ((data.sessionsFound ?? 0) > 0) {
        setPhase('done')
        onImportComplete?.()
      } else {
        setPhase('error')
        setErrorMsg(isEs ? 'No se encontraron datos de entrenamiento' : 'No training data found')
      }
    } catch (e) {
      setPhase('error')
      setErrorMsg(e instanceof Error ? e.message : String(e))
    }
  }

  // ── Estados de UI ──
  if (phase === 'done' && result) return (
    <div style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '18px', padding: '28px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
      <p style={{ color: '#C8FF00', fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '18px', marginBottom: '6px' }}>
        {isEs ? 'Analisis completado' : 'Analysis complete'}
      </p>
      <p style={{ color: '#8888AA', fontSize: '13px', marginBottom: '8px' }}>
        {result.sessions} {isEs ? 'sesion(es)' : 'session(s)'} · {Math.round(result.confidence * 100)}%
      </p>
      <p style={{ color: '#44445a', fontSize: '12px', marginBottom: '20px' }}>
        {isEs ? 'Sesiones guardadas en tu historial' : 'Sessions saved to your history'}
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/' + locale + '/history')}
          style={{ background: 'linear-gradient(135deg,#C8FF00,#88DD00)', color: '#0A0A0F', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '700', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
          {isEs ? 'Ver historial' : 'View history'}
        </button>
        <button onClick={reset}
          style={{ background: '#1a1a2e', color: '#8888AA', border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '13px', cursor: 'pointer' }}>
          {isEs ? 'Importar otro' : 'Import another'}
        </button>
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '18px', padding: '28px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px', color: '#FF6B6B' }}>✕</div>
      <p style={{ color: '#FF6B6B', fontFamily: 'Syne, sans-serif', fontWeight: '700', marginBottom: '8px' }}>
        {isEs ? 'Error' : 'Error'}
      </p>
      <p style={{ color: '#8888AA', fontSize: '12px', marginBottom: '20px' }}>{errorMsg}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {importId && (
          <button onClick={() => { setPhase('processing'); runProcess(importId) }}
            style={{ background: '#1a2a00', color: '#C8FF00', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
            {isEs ? 'Reintentar analisis' : 'Retry analysis'}
          </button>
        )}
        <button onClick={reset}
          style={{ background: '#1a1a2e', color: '#8888AA', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer' }}>
          {isEs ? 'Intentar de nuevo' : 'Try again'}
        </button>
      </div>
    </div>
  )

  if (phase === 'uploading' || phase === 'processing') return (
    <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '32px', textAlign: 'center' }}>
      <div style={{ width: '44px', height: '44px', border: '2.5px solid #C8FF00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
      <p style={{ color: '#F0F0F5', fontFamily: 'Syne, sans-serif', fontWeight: '600', marginBottom: '8px' }}>
        {phase === 'uploading'
          ? (isEs ? 'Subiendo a la nube...' : 'Uploading to cloud...')
          : (isEs ? 'Analizando con IA...' : 'Analyzing with AI...')}
      </p>
      {phase === 'uploading' && progress > 0 && (
        <div style={{ width: '100%', height: '4px', background: '#1a1a2e', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ height: '4px', background: '#C8FF00', width: progress + '%', transition: 'width 0.3s ease', borderRadius: '2px' }} />
        </div>
      )}
      <p style={{ color: '#44445a', fontSize: '12px' }}>
        {phase === 'uploading' ? progress + '%' : (isEs ? 'No cierres esta pagina' : 'Do not close this page')}
      </p>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
    </div>
  )

  return (
    <div>
      <input ref={fileRef} type="file" className="hidden"
        accept="image/*,.pdf,.txt,.csv,.xlsx,.xls,.docx,.doc"
        onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; handleFile(f) } }} />
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
        style={{ background: '#111118', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '18px', padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(200,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', fontFamily: 'Syne, sans-serif', color: '#C8FF00' }}>AI</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#F0F0F5', fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
            {isEs ? 'Importar entrenamiento' : 'Import workout'}
          </p>
          <p style={{ color: '#44445a', fontSize: '12px' }}>
            {isEs ? 'Foto, PDF, Excel, Word · sin limite de tamano' : 'Photo, PDF, Excel, Word · no size limit'}
          </p>
        </div>
        <div style={{ background: 'rgba(200,255,0,0.08)', color: '#C8FF00', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: '700', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Seleccionar archivo' : 'Select file'}
        </div>
      </div>
    </div>
  )
}

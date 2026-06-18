'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ImportStatus {
  phase: 'idle' | 'uploading' | 'processing' | 'review' | 'done' | 'error'
  message?: string
  sessionsFound?: number
  confidence?: number
  importId?: string
  reviewItems?: any[]
  canRetryProcess?: boolean
}

export default function ImportCard({ locale, onImportComplete }: { locale: string; onImportComplete?: () => void }) {
  const isEs = locale === 'es'
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const userIdRef = useRef<string | null>(null)
  const [status, setStatus] = useState<ImportStatus>({ phase: 'idle' })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.userId) userIdRef.current = d.userId })
      .catch(() => {})
  }, [])

  // Solo parsea JSON si el servidor realmente devuelve JSON
  async function safeJson(res: Response) {
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
      const text = await res.text()
      throw new Error('Error servidor ' + res.status + ': ' + text.slice(0, 80))
    }
    return res.json()
  }

  // Para acciones manuales: redirige en 401
  async function safeFetch(url: string, opts?: RequestInit) {
    const res = await fetch(url, opts)
    if (res.status === 401) {
      router.push('/' + locale + '/login')
      throw new Error('Session expired')
    }
    return res
  }

  // Para proceso IA: NUNCA redirige — muestra error + reintentar
  async function processFetch(url: string, opts?: RequestInit) {
    const res = await fetch(url, opts)
    return res // devuelve siempre, sin redirigir
  }

  async function uploadDirect(file: File): Promise<{ importId: string; fileType: string }> {
    setStatus({ phase: 'uploading', message: isEs ? 'Preparando subida...' : 'Preparing upload...' })
    const urlRes = await safeFetch('/api/import/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size })
    })
    const urlData = await safeJson(urlRes)
    if (!urlRes.ok) throw new Error(urlData.error ?? urlData.message ?? 'Error URL')
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', urlData.signedUrl, true)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(pct)
          setStatus(s => ({ ...s, message: (isEs ? 'Subiendo... ' : 'Uploading... ') + pct + '%' }))
        }
      }
      xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error('Storage ' + xhr.status))
      xhr.onerror = () => reject(new Error('Error de red'))
      xhr.send(file)
    })
    return { importId: urlData.importId, fileType: urlData.fileType }
  }

  const processFile = async (file: File) => {
    setStatus({ phase: 'uploading', message: isEs ? 'Subiendo archivo...' : 'Uploading file...' })
    setUploadProgress(0)
    try {
      let importId: string, fileType: string
      if (file.size > 4 * 1024 * 1024) {
        const r = await uploadDirect(file); importId = r.importId; fileType = r.fileType
      } else {
        const formData = new FormData(); formData.append('file', file)
        const upRes = await safeFetch('/api/import/upload', { method: 'POST', body: formData })
        const upData = await safeJson(upRes)
        if (!upRes.ok) {
          if (upData.useDirectUpload || upRes.status === 413) {
            const r = await uploadDirect(file); importId = r.importId; fileType = r.fileType
          } else if (upData.error === 'LIMIT_REACHED') {
            setStatus({ phase: 'error', message: isEs ? 'Limite gratuito (3/mes). Actualiza a Pro.' : 'Free limit (3/month). Upgrade to Pro.' }); return
          } else {
            setStatus({ phase: 'error', message: upData.error ?? 'Error al subir' }); return
          }
        } else { importId = upData.importId; fileType = upData.fileType }
      }
      await runProcess(importId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg !== 'Session expired') setStatus({ phase: 'error', message: msg })
    }
  }

  const runProcess = async (importId: string) => {
    setStatus({ phase: 'processing', message: isEs ? 'Analizando con IA... (puede tardar 30s)' : 'AI analyzing... (may take 30s)', importId })
    try {
      // processFetch: nunca redirige, aunque devuelva 401
      const procRes = await processFetch('/api/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId, userId: userIdRef.current })
      })
      const procData = await safeJson(procRes)
      if (!procRes.ok) {
        // 401 aqui = sesion expiro durante el proceso — NO logout, ofrecer reintentar
        const msg = procRes.status === 401
          ? (isEs ? 'Sesion expirada durante el proceso. Pulsa Reintentar.' : 'Session expired during processing. Press Retry.')
          : (procData.error ?? 'Error al procesar')
        setStatus({ phase: 'error', message: msg, importId, canRetryProcess: true }); return
      }
      if (!procData.sessionsFound || procData.confidence < 0.3) {
        setStatus({ phase: 'error', message: isEs ? 'No se encontraron datos de entrenamiento en el archivo.' : 'No training data found in the file.' }); return
      }
      const reviewRes = await processFetch('/api/import/review?importId=' + importId)
      const reviewData = await safeJson(reviewRes)
      const items = reviewData.items || []
      setSelectedItems(items.map((i: any) => i.id))
      setStatus({ phase: 'review', sessionsFound: procData.sessionsFound, confidence: procData.confidence, importId, reviewItems: items })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setStatus({ phase: 'error', message: msg, importId, canRetryProcess: true })
    }
  }

  const handleApprove = async () => {
    if (!status.importId) return
    setStatus(s => ({ ...s, phase: 'uploading', message: isEs ? 'Guardando sesiones...' : 'Saving sessions...' }))
    try {
      const res = await safeFetch('/api/import/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: status.importId, reviewItemIds: selectedItems })
      })
      const data = await safeJson(res)
      if (!res.ok) { setStatus(s => ({ ...s, phase: 'error', message: data.error })); return }
      setStatus({ phase: 'done', message: data.sessionsCreated + (isEs ? ' sesion(es) importadas' : ' session(s) imported') })
      onImportComplete?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg !== 'Session expired') setStatus(s => ({ ...s, phase: 'error', message: msg }))
    }
  }

  const reset = () => { setStatus({ phase: 'idle' }); setSelectedItems([]); setUploadProgress(0) }

  if (status.phase === 'done') return (
    <div className="rounded-2xl p-6 text-center" style={{ background: '#0d1a0d', border: '1px solid #C8FF0033' }}>
      <p className="text-3xl mb-3">&#10003;</p>
      <p className="font-bold mb-1" style={{ color: '#C8FF00' }}>{isEs ? 'Importacion completada' : 'Import complete'}</p>
      <p className="text-sm mb-4" style={{ color: '#888' }}>{status.message}</p>
      <button onClick={reset} className="text-sm px-4 py-2 rounded-xl" style={{ background: '#1a2a00', color: '#C8FF00' }}>
        {isEs ? 'Importar otro' : 'Import another'}
      </button>
    </div>
  )

  if (status.phase === 'review' && status.reviewItems) {
    const conf = Math.round((status.confidence ?? 0) * 100)
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a1a2e' }}>
        <div className="p-4" style={{ background: '#0d0d14' }}>
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold" style={{ color: '#fff' }}>{isEs ? 'Revision previa' : 'Review before import'}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: conf >= 70 ? '#1a2a00' : '#2a1a00', color: conf >= 70 ? '#C8FF00' : '#FBBF24' }}>{conf}%</span>
          </div>
          <p className="text-xs" style={{ color: '#666' }}>{status.sessionsFound} {isEs ? 'sesion(es)' : 'session(s)'}</p>
        </div>
        <div className="p-4 space-y-3" style={{ background: '#111118' }}>
          {status.reviewItems.map((item: any, i: number) => {
            const d = item.raw_extracted; const isSel = selectedItems.includes(item.id)
            return (
              <button key={item.id}
                onClick={() => setSelectedItems(p => isSel ? p.filter(x => x !== item.id) : [...p, item.id])}
                className="w-full text-left p-3 rounded-xl"
                style={{ background: isSel ? '#1a2a00' : '#0d0d14', border: '1px solid ' + (isSel ? '#C8FF0044' : '#222') }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium" style={{ color: isSel ? '#C8FF00' : '#ddd' }}>
                      {isEs ? 'Sesion' : 'Session'} {i + 1}{d.date ? ' - ' + d.date : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#666' }}>
                      {(d.exercises || []).length} {isEs ? 'ejercicios' : 'exercises'}
                      {(d.exercises || []).slice(0, 2).map((ex: any) => ' · ' + ex.name).join('')}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: isSel ? '#C8FF00' : 'transparent', border: '1.5px solid ' + (isSel ? '#C8FF00' : '#444') }}>
                    {isSel && <span className="text-xs font-bold" style={{ color: '#0A0A0F' }}>v</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <div className="p-4 flex gap-2" style={{ background: '#0d0d14', borderTop: '1px solid #1a1a2e' }}>
          <button onClick={reset} className="flex-1 py-3 rounded-xl text-sm" style={{ background: '#1a1a2e', color: '#888' }}>
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>
          <button onClick={handleApprove} disabled={selectedItems.length === 0}
            className="py-3 px-6 rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ background: '#C8FF00', color: '#0A0A0F' }}>
            {isEs ? 'Importar ' + selectedItems.length : 'Import ' + selectedItems.length}
          </button>
        </div>
      </div>
    )
  }

  if (status.phase === 'uploading' || status.phase === 'processing') return (
    <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
      <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#C8FF00', borderTopColor: 'transparent' }} />
      <p className="text-sm text-center" style={{ color: '#888' }}>{status.message}</p>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full rounded-full h-1" style={{ background: '#1a1a2e' }}>
          <div className="h-1 rounded-full" style={{ width: uploadProgress + '%', background: '#C8FF00' }} />
        </div>
      )}
    </div>
  )

  if (status.phase === 'error') return (
    <div className="rounded-2xl p-6 text-center" style={{ background: '#1a0d0d', border: '1px solid #FF6B6B33' }}>
      <p className="font-bold mb-2" style={{ color: '#FF6B6B' }}>Error</p>
      <p className="text-sm mb-4" style={{ color: '#888' }}>{status.message}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {status.canRetryProcess && status.importId && (
          <button onClick={() => runProcess(status.importId!)} className="text-sm px-4 py-2 rounded-xl"
            style={{ background: '#1a2a00', color: '#C8FF00' }}>
            {isEs ? 'Reintentar analisis' : 'Retry analysis'}
          </button>
        )}
        <button onClick={reset} className="text-sm px-4 py-2 rounded-xl" style={{ background: '#2a1010', color: '#FF6B6B' }}>
          {isEs ? 'Intentar de nuevo' : 'Try again'}
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <input ref={fileRef} type="file" className="hidden"
        accept="image/*,.pdf,.txt,.csv,.xlsx,.xls,.docx,.doc"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
      <div onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
        onDragOver={e => e.preventDefault()}
        className="rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer"
        style={{ background: '#111118', border: '2px dashed #2a2a3e' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl"
          style={{ background: '#1a2a00', color: '#C8FF00' }}>AI</div>
        <div className="text-center">
          <p className="font-bold mb-1" style={{ color: '#fff' }}>{isEs ? 'Importar entrenamiento' : 'Import workout'}</p>
          <p className="text-xs" style={{ color: '#666' }}>{isEs ? 'Foto, PDF, Excel, Word · hasta 50MB' : 'Photo, PDF, Excel, Word · up to 50MB'}</p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full" style={{ background: '#C8FF0015', color: '#C8FF00', border: '1px solid #C8FF0033' }}>
          {isEs ? 'Toca para seleccionar' : 'Tap to select'}
        </div>
      </div>
    </div>
  )
}

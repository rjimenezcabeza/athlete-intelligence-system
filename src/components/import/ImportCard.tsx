'use client'

import { useState, useRef } from 'react'

interface ImportStatus {
  phase: 'idle' | 'uploading' | 'processing' | 'review' | 'done' | 'error'
  message?: string
  sessionsFound?: number
  confidence?: number
  importId?: string
  reviewItems?: any[]
}

interface ImportCardProps {
  locale: string
  onImportComplete?: () => void
}

export default function ImportCard({ locale, onImportComplete }: ImportCardProps) {
  const isEs = locale === 'es'
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<ImportStatus>({ phase: 'idle' })
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const processFile = async (file: File) => {
    setStatus({ phase: 'uploading', message: isEs ? 'Subiendo archivo...' : 'Uploading file...' })

    const formData = new FormData()
    formData.append('file', file)
    const upRes = await fetch('/api/import/upload', { method: 'POST', body: formData })
    const upData = await upRes.json()
    if (!upRes.ok) { setStatus({ phase: 'error', message: upData.error }); return }

    const importId = upData.importId
    setStatus({ phase: 'processing', message: isEs ? 'Analizando con IA...' : 'Analyzing with AI...', importId })

    const procRes = await fetch('/api/import/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId })
    })
    const procData = await procRes.json()
    if (!procRes.ok) { setStatus({ phase: 'error', message: procData.error }); return }

    if (procData.sessionsFound === 0 || procData.confidence < 0.3) {
      setStatus({ phase: 'error', message: isEs ? 'No se pudo extraer informacion de entrenamiento' : 'Could not extract training data' })
      return
    }

    const reviewRes = await fetch(`/api/import/review?importId=${importId}`)
    const reviewData = await reviewRes.json()
    const items = reviewData.items || []
    setSelectedItems(items.map((i: any) => i.id))
    setStatus({ phase: 'review', sessionsFound: procData.sessionsFound, confidence: procData.confidence, importId, reviewItems: items })
  }

  const handleApprove = async () => {
    if (!status.importId) return
    setStatus(s => ({ ...s, phase: 'uploading', message: isEs ? 'Guardando sesiones...' : 'Saving sessions...' }))
    const res = await fetch('/api/import/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId: status.importId, reviewItemIds: selectedItems })
    })
    const data = await res.json()
    if (!res.ok) { setStatus(s => ({ ...s, phase: 'error', message: data.error })); return }
    setStatus({ phase: 'done', message: isEs ? `${data.sessionsCreated} sesion(es) importadas` : `${data.sessionsCreated} session(s) imported` })
    onImportComplete?.()
  }

  const reset = () => { setStatus({ phase: 'idle' }); setSelectedItems([]) }

  if (status.phase === 'done') return (
    <div className="rounded-2xl p-6 text-center" style={{ background: '#0d1a0d', border: '1px solid #C8FF0033' }}>
      <p className="text-3xl mb-3">ok</p>
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
              style={{ background: conf >= 70 ? '#1a2a00' : '#2a1a00', color: conf >= 70 ? '#C8FF00' : '#FBBF24' }}>
              {conf}%
            </span>
          </div>
          <p className="text-xs" style={{ color: '#666' }}>{status.sessionsFound} {isEs ? 'sesion(es)' : 'session(s)'}</p>
        </div>

        <div className="p-4 space-y-3" style={{ background: '#111118' }}>
          {status.reviewItems.map((item: any, i: number) => {
            const d = item.raw_extracted
            const isSelected = selectedItems.includes(item.id)
            return (
              <button key={item.id}
                onClick={() => setSelectedItems(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                className="w-full text-left p-3 rounded-xl transition-all"
                style={{ background: isSelected ? '#1a2a00' : '#0d0d14', border: `1px solid ${isSelected ? '#C8FF0044' : '#222'}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium" style={{ color: isSelected ? '#C8FF00' : '#ddd' }}>
                      {isEs ? 'Sesion' : 'Session'} {i + 1}{d.date ? ` - ${d.date}` : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#666' }}>
                      {(d.exercises || []).length} {isEs ? 'ejercicios' : 'exercises'}
                      {(d.exercises || []).slice(0, 2).map((ex: any) => ` · ${ex.name}`).join('')}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: isSelected ? '#C8FF00' : 'transparent', border: `1.5px solid ${isSelected ? '#C8FF00' : '#444'}` }}>
                    {isSelected && <span className="text-xs font-bold" style={{ color: '#0A0A0F' }}>v</span>}
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
            {isEs ? `Importar ${selectedItems.length}` : `Import ${selectedItems.length}`}
          </button>
        </div>
      </div>
    )
  }

  if (status.phase === 'uploading' || status.phase === 'processing') return (
    <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
      <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#C8FF00', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: '#888' }}>{status.message}</p>
    </div>
  )

  if (status.phase === 'error') return (
    <div className="rounded-2xl p-6 text-center" style={{ background: '#1a0d0d', border: '1px solid #FF6B6B33' }}>
      <p className="font-bold mb-1" style={{ color: '#FF6B6B' }}>{isEs ? 'Error' : 'Error'}</p>
      <p className="text-sm mb-4" style={{ color: '#888' }}>{status.message}</p>
      <button onClick={reset} className="text-sm px-4 py-2 rounded-xl" style={{ background: '#2a1010', color: '#FF6B6B' }}>
        {isEs ? 'Intentar de nuevo' : 'Try again'}
      </button>
    </div>
  )

  return (
    <div>
      <input ref={fileRef} type="file" className="hidden"
        accept="image/*,.pdf,.txt,.csv,.xlsx,.xls,.docx,.doc"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
        onDragOver={e => e.preventDefault()}
        className="rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer"
        style={{ background: '#111118', border: '2px dashed #1a1a2e' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold" style={{ background: '#1a2a00', color: '#C8FF00' }}>
          AI
        </div>
        <div className="text-center">
          <p className="font-bold mb-1" style={{ color: '#fff' }}>{isEs ? 'Importar entrenamiento' : 'Import workout'}</p>
          <p className="text-xs" style={{ color: '#666' }}>
            {isEs ? 'Foto, PDF, Excel o texto' : 'Photo, PDF, Excel or text'}
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full" style={{ background: '#C8FF0015', color: '#C8FF00', border: '1px solid #C8FF0033' }}>
          {isEs ? 'Toca para seleccionar' : 'Tap to select'}
        </div>
      </div>
    </div>
  )
}

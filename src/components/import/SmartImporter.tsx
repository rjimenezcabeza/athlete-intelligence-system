'use client'

import { useState, useCallback, useRef } from 'react'

type ImportStep = 'upload' | 'processing' | 'review' | 'applying' | 'done' | 'error'

interface ImportSummary {
  athleteName?: string | null
  splitDetected?: string | null
  daysPerWeek?: number | null
  sessionsCount: number
  exercisesInProgram: number
  mappedExercises?: number
  calories?: number | null
  protein?: number | null
  hasProfile: boolean
  hasNutrition: boolean
  hasProgram: boolean
  hasSessions: boolean
  confidence?: number
}

interface Props {
  locale?: string
  onComplete?: () => void
  onClose?: () => void
}

export function SmartImporter({ locale = 'es', onComplete, onClose }: Props) {
  const isEs = locale === 'es'
  const [step, setStep] = useState<ImportStep>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [importId, setImportId] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [applying, setApplying] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [selection, setSelection] = useState({
    profile: true, nutrition: true, program: true, sessions: true
  })
  const processingStartRef = useRef<number | null>(null)

  const uploadFile = useCallback(async (file: File) => {
    setStep('processing')
    setErrorMsg('')
    setTimedOut(false)
    processingStartRef.current = null

    // Validate size client-side before upload
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg(isEs ? 'Archivo demasiado grande. Máximo 3MB.' : 'File too large. Maximum 3MB.')
      setStep('error')
      return
    }

    try {
      // Convert to base64 for reliable upload (avoids FormData/multipart issues on Vercel)
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryStr = ''
      // Process in chunks to avoid call stack overflow on large files
      const chunkSize = 8192
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binaryStr += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize))
      }
      const base64 = btoa(binaryStr)

      const uploadRes = await fetch('/api/import/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          fileSizeBytes: file.size,
          data: base64
        })
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        if (err.error === 'LIMIT_REACHED') {
          throw new Error(err.message || (isEs ? 'Límite mensual alcanzado' : 'Monthly limit reached'))
        }
        throw new Error(err.message || err.error || 'Upload failed')
      }
      const { importedFileId } = await uploadRes.json()
      setImportId(importedFileId)

      fetch('/api/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importedFileId: importedFileId })
      }).catch(() => {})

      let attempts = 0
      const pollFn = async () => {
        if (attempts++ > 45) {
          await fetch('/api/import/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ importedFileId: importedFileId })
          }).catch(() => {})
          setTimedOut(true)
          setErrorMsg(isEs ? 'Timeout: el análisis tardó demasiado. Toca Reintentar.' : 'Timeout: analysis took too long. Tap Retry.')
          setStep('error')
          return
        }

        try {
          const statusRes = await fetch(`/api/import/status/${importedFileId}`)
          if (!statusRes.ok) { setTimeout(pollFn, 2000); return }
          const statusData = await statusRes.json()

          if (statusData.status === 'processing') {
            if (!processingStartRef.current) processingStartRef.current = Date.now()
            if (Date.now() - processingStartRef.current > 60000) {
              await fetch('/api/import/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ importedFileId: importedFileId })
              }).catch(() => {})
              setTimedOut(true)
              setErrorMsg(isEs ? 'El análisis tardó demasiado. Toca Reintentar.' : 'Analysis timed out. Tap Retry.')
              setStep('error')
              return
            }
            setTimeout(pollFn, 2000)
          } else if (statusData.status === 'review_required') {
            const s = statusData.summary
            if (!s || (!s.hasProfile && !s.hasNutrition && !s.hasProgram && !s.hasSessions)) {
              setErrorMsg(isEs ? 'No se encontraron datos de entrenamiento en el archivo' : 'No training data found in the file')
              setStep('error')
              return
            }
            setSummary({
              ...s,
              hasNutrition: s.hasNutrition ?? !!(s.calories),
              confidence: statusData.confidence
            })
            setConfidence(statusData.confidence || 0)
            setStep('review')
          } else if (statusData.status === 'error') {
            setErrorMsg(isEs ? 'Error al analizar el archivo' : 'Error analyzing file')
            setStep('error')
          } else {
            setTimeout(pollFn, 2000)
          }
        } catch {
          setTimeout(pollFn, 2000)
        }
      }

      setTimeout(pollFn, 3000)

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStep('error')
    }
  }, [isEs])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleRetryTimeout = async () => {
    if (!importId) { reset(); return }
    setStep('processing')
    setErrorMsg('')
    setTimedOut(false)
    processingStartRef.current = null

    try {
      await fetch('/api/import/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importedFileId: importId })
      })
      fetch('/api/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importedFileId: importId })
      }).catch(() => {})

      let attempts = 0
      const pollFn = async () => {
        if (attempts++ > 45) {
          setErrorMsg(isEs ? 'Timeout de nuevo. Inténtalo más tarde.' : 'Timeout again. Try later.')
          setStep('error')
          return
        }
        try {
          const statusRes = await fetch(`/api/import/status/${importId}`)
          if (!statusRes.ok) { setTimeout(pollFn, 2000); return }
          const statusData = await statusRes.json()
          if (statusData.status === 'review_required') {
            const s = statusData.summary
            if (!s || (!s.hasProfile && !s.hasNutrition && !s.hasProgram && !s.hasSessions)) {
              setErrorMsg(isEs ? 'No se encontraron datos' : 'No data found')
              setStep('error')
              return
            }
            setSummary({ ...s, hasNutrition: s.hasNutrition ?? !!(s.calories), confidence: statusData.confidence })
            setConfidence(statusData.confidence || 0)
            setStep('review')
          } else if (statusData.status === 'error') {
            setErrorMsg(isEs ? 'Error al analizar' : 'Analysis error')
            setStep('error')
          } else {
            setTimeout(pollFn, 2000)
          }
        } catch { setTimeout(pollFn, 2000) }
      }
      setTimeout(pollFn, 3000)
    } catch {
      setErrorMsg(isEs ? 'Error al reintentar' : 'Retry failed')
      setStep('error')
    }
  }

  const handleApply = async () => {
    if (!importId) return
    setApplying(true)
    setStep('applying')
    try {
      const res = await fetch('/api/import/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          applyProfile: selection.profile && summary?.hasProfile,
          applyNutrition: selection.nutrition && summary?.hasNutrition,
          applyProgram: selection.program && summary?.hasProgram,
          applySessions: selection.sessions && summary?.hasSessions
        })
      })
      if (res.ok) {
        setStep('done')
        onComplete?.()
      } else {
        throw new Error('Apply failed')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al aplicar')
      setStep('error')
    } finally {
      setApplying(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setImportId(null)
    setSummary(null)
    setErrorMsg('')
    setTimedOut(false)
    processingStartRef.current = null
    setSelection({ profile: true, nutrition: true, program: true, sessions: true })
  }

  return (
    <div style={{ padding: '24px', background: '#0f0f14', borderRadius: '20px', width: '100%' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Importar Programa' : 'Import Program'}
        </h2>
        {onClose && step !== 'processing' && step !== 'applying' && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 0 2px' }}>×</button>
        )}
      </div>

      {/* STEP: Upload */}
      {step === 'upload' && (
        <div>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
            {isEs ? 'Sube tu programa de entrenamiento o datos nutricionales y la IA los analizará automáticamente' : 'Upload your training program or nutritional data and AI will analyze it automatically'}
          </p>
          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: 'block', padding: '40px 20px',
              border: `2px dashed ${dragOver ? '#C8FF00' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '14px', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'rgba(200,255,0,0.04)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📎</div>
            <div style={{ fontSize: '14px', color: '#ccc', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>
              {isEs ? 'Arrastra tu archivo aquí' : 'Drop your file here'}
            </div>
            <div style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '10px' }}>
              {isEs ? 'o haz clic para seleccionar' : 'or click to select'}
            </div>
            <div style={{ fontSize: '11px', color: '#444', fontFamily: 'DM Mono, monospace' }}>
              PDF, {isEs ? 'imagen' : 'image'}, Excel, Word {isEs ? 'o texto' : 'or text'} · max 3MB
            </div>
            <input type="file" style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.docx,.txt,.csv"
              onChange={handleFileSelect} />
          </label>
        </div>
      )}

      {/* STEP: Processing */}
      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '2.5px solid #C8FF00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#C8FF00', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>
            {isEs ? 'Analizando con IA...' : 'Analyzing with AI...'}
          </div>
          <div style={{ fontSize: '12px', color: '#666', fontFamily: 'DM Mono, monospace', marginBottom: '20px' }}>
            {isEs ? 'Extrayendo ejercicios, nutrición y sesiones históricas' : 'Extracting exercises, nutrition and historical sessions'}
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '40%', background: '#C8FF00', borderRadius: '2px', animation: 'slide 2s ease-in-out infinite' }} />
          </div>
          <div style={{ marginTop: '14px', fontSize: '11px', color: '#444', fontFamily: 'DM Mono, monospace' }}>
            {isEs ? 'Hasta 45 segundos en archivos grandes' : 'Up to 45s for large files'}
          </div>
        </div>
      )}

      {/* STEP: Review */}
      {step === 'review' && summary && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
              {isEs ? 'Datos extraídos' : 'Extracted data'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: confidence > 0.7 ? '#C8FF00' : '#FF9800' }} />
              <span style={{ fontSize: '11px', color: '#666', fontFamily: 'DM Mono, monospace' }}>
                {Math.round(confidence * 100)}% {isEs ? 'precisión' : 'accuracy'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {summary.hasProfile && (
              <div onClick={() => setSelection(s => ({ ...s, profile: !s.profile }))}
                style={{ padding: '14px', cursor: 'pointer', background: selection.profile ? 'rgba(200,255,0,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selection.profile ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ccc', fontFamily: 'Syne, sans-serif', marginBottom: '2px' }}>
                      👤 {isEs ? 'Perfil del atleta' : 'Athlete profile'}
                      {summary.athleteName && <span style={{ color: '#888', fontWeight: '400' }}> — {summary.athleteName}</span>}
                    </div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: selection.profile ? '#C8FF00' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selection.profile && <span style={{ fontSize: '11px', color: '#0A0A0F' }}>✓</span>}
                  </div>
                </div>
              </div>
            )}

            {summary.hasNutrition && (
              <div onClick={() => setSelection(s => ({ ...s, nutrition: !s.nutrition }))}
                style={{ padding: '14px', cursor: 'pointer', background: selection.nutrition ? 'rgba(200,255,0,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selection.nutrition ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ccc', fontFamily: 'Syne, sans-serif', marginBottom: '4px' }}>
                      🥗 {isEs ? 'Nutrición' : 'Nutrition'}
                    </div>
                    {(summary.calories || summary.protein) && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {summary.calories && <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{summary.calories} kcal</span>}
                        {summary.protein && <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{summary.protein}g {isEs ? 'proteína' : 'protein'}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: selection.nutrition ? '#C8FF00' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selection.nutrition && <span style={{ fontSize: '11px', color: '#0A0A0F' }}>✓</span>}
                  </div>
                </div>
              </div>
            )}

            {summary.hasProgram && (
              <div onClick={() => setSelection(s => ({ ...s, program: !s.program }))}
                style={{ padding: '14px', cursor: 'pointer', background: selection.program ? 'rgba(200,255,0,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selection.program ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ccc', fontFamily: 'Syne, sans-serif', marginBottom: '4px' }}>
                      🏋️ {isEs ? 'Programa de entrenamiento' : 'Training program'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {summary.splitDetected && <span style={{ fontSize: '11px', color: '#C8FF00', fontFamily: 'DM Mono, monospace' }}>{summary.splitDetected}</span>}
                      {summary.daysPerWeek && <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>{summary.daysPerWeek} {isEs ? 'días/sem' : 'd/wk'}</span>}
                      {summary.exercisesInProgram > 0 && (
                        <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                          {summary.exercisesInProgram} {isEs ? 'ejercicios' : 'exercises'}
                          {summary.mappedExercises !== undefined && ` (${summary.mappedExercises} ${isEs ? 'mapeados' : 'matched'})`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: selection.program ? '#C8FF00' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selection.program && <span style={{ fontSize: '11px', color: '#0A0A0F' }}>✓</span>}
                  </div>
                </div>
              </div>
            )}

            {summary.hasSessions && summary.sessionsCount > 0 && (
              <div onClick={() => setSelection(s => ({ ...s, sessions: !s.sessions }))}
                style={{ padding: '14px', cursor: 'pointer', background: selection.sessions ? 'rgba(200,255,0,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selection.sessions ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ccc', fontFamily: 'Syne, sans-serif', marginBottom: '4px' }}>
                      📅 {isEs ? 'Sesiones históricas' : 'Historical sessions'}
                    </div>
                    <span style={{ fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace' }}>
                      {summary.sessionsCount} {isEs ? 'sesiones detectadas' : 'sessions detected'}
                    </span>
                  </div>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: selection.sessions ? '#C8FF00' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selection.sessions && <span style={{ fontSize: '11px', color: '#0A0A0F' }}>✓</span>}
                  </div>
                </div>
              </div>
            )}

            {!summary.hasProfile && !summary.hasNutrition && !summary.hasProgram && !summary.hasSessions && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                {isEs ? 'No se detectaron datos estructurados en el archivo.' : 'No structured data detected in the file.'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={reset} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
              {isEs ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              disabled={applying || (!selection.profile && !selection.nutrition && !selection.program && !selection.sessions)}
              style={{ flex: 2, padding: '11px', background: '#C8FF00', border: 'none', borderRadius: '10px', color: '#0A0A0F', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: applying ? 0.7 : 1 }}
            >
              {isEs ? 'Aplicar seleccionados' : 'Apply selected'}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Applying */}
      {step === 'applying' && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '2.5px solid #C8FF00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '14px', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
            {isEs ? 'Aplicando datos...' : 'Applying data...'}
          </div>
        </div>
      )}

      {/* STEP: Done */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#C8FF00', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>
            {isEs ? 'Importación completada' : 'Import completed'}
          </div>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px', fontFamily: 'DM Mono, monospace' }}>
            {isEs ? 'Tus datos han sido importados correctamente.' : 'Your data has been imported successfully.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={reset} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
              {isEs ? 'Importar otro' : 'Import another'}
            </button>
            {onClose && (
              <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '10px', color: '#C8FF00', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
                {isEs ? 'Ver perfil' : 'View profile'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP: Error */}
      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>⚠️</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#FF5252', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>
            {isEs ? 'Error en el análisis' : 'Analysis error'}
          </div>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 6px', fontFamily: 'DM Mono, monospace', lineHeight: '1.5' }}>
            {errorMsg?.includes('download') || errorMsg?.includes('storage')
              ? (isEs
                  ? 'El archivo no se pudo leer del servidor. Por favor, vuelve a subirlo.'
                  : 'The file could not be read from the server. Please upload it again.')
              : errorMsg
            }
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
            {timedOut && importId ? (
              <button onClick={handleRetryTimeout} style={{ padding: '10px 20px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '10px', color: '#C8FF00', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {isEs ? 'Reintentar' : 'Retry'}
              </button>
            ) : null}
            <button onClick={reset} style={{ padding: '10px 20px', background: '#C8FF00', border: 'none', borderRadius: '10px', color: '#0A0A0F', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              {isEs ? 'Subir de nuevo' : 'Upload again'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

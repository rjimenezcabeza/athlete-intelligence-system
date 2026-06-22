'use client'

import { useState, useCallback } from 'react'

type ImportStep = 'upload' | 'processing' | 'review' | 'applying' | 'done' | 'error'

interface ImportSummary {
  athleteName?: string | null
  splitDetected?: string | null
  daysPerWeek?: number | null
  sessionsCount: number
  exercisesInProgram: number
  calories?: number | null
  protein?: number | null
  hasProfile: boolean
  hasNutrition: boolean
  hasProgram: boolean
  hasSessions: boolean
}

interface Props {
  locale?: string
  onComplete?: () => void
  onClose?: () => void
}

const T: Record<string, Record<string, string>> = {
  es: {
    title: 'Importar Programa',
    subtitle: 'Sube tu programa de entrenamiento o datos nutricionales y la IA los analizará automáticamente',
    dropzone: 'Arrastra tu archivo aquí',
    dropzoneOr: 'o haz clic para seleccionar',
    formats: 'PDF, imagen, Excel, Word o texto',
    processing: 'Analizando con IA...',
    processingDesc: 'Extrayendo ejercicios, nutrición y sesiones históricas',
    reviewTitle: 'Revisión de datos extraídos',
    profileSection: 'Perfil del atleta',
    nutritionSection: 'Nutrición',
    programSection: 'Programa de entrenamiento',
    sessionsSection: 'Sesiones históricas',
    applySelected: 'Aplicar seleccionados',
    confidence: 'Precisión',
    done: 'Importación completada',
    doneDesc: 'Tus datos han sido importados correctamente.',
    viewProfile: 'Ver perfil',
    importAnother: 'Importar otro',
    error: 'Error en la importación',
    retry: 'Intentar de nuevo',
    cancel: 'Cancelar',
    applying: 'Aplicando datos...',
    splitDetected: 'Split detectado',
    daysPerWeek: 'días/sem',
    exercises: 'ejercicios',
    sessions: 'sesiones',
    kcal: 'kcal',
    protein: 'g proteína',
    noDataFound: 'No se encontraron datos de entrenamiento en el archivo'
  },
  en: {
    title: 'Import Program',
    subtitle: 'Upload your training program or nutritional data and the AI will analyze it automatically',
    dropzone: 'Drop your file here',
    dropzoneOr: 'or click to select',
    formats: 'PDF, image, Excel, Word or text',
    processing: 'Analyzing with AI...',
    processingDesc: 'Extracting exercises, nutrition and historical sessions',
    reviewTitle: 'Extracted data review',
    profileSection: 'Athlete profile',
    nutritionSection: 'Nutrition',
    programSection: 'Training program',
    sessionsSection: 'Historical sessions',
    applySelected: 'Apply selected',
    confidence: 'Accuracy',
    done: 'Import completed',
    doneDesc: 'Your data has been imported successfully.',
    viewProfile: 'View profile',
    importAnother: 'Import another',
    error: 'Import error',
    retry: 'Try again',
    cancel: 'Cancel',
    applying: 'Applying data...',
    splitDetected: 'Detected split',
    daysPerWeek: 'd/wk',
    exercises: 'exercises',
    sessions: 'sessions',
    kcal: 'kcal',
    protein: 'g protein',
    noDataFound: 'No training data found in this file'
  }
}

export function SmartImporter({ locale = 'es', onComplete, onClose }: Props) {
  const t = T[locale] || T.es
  const [step, setStep] = useState<ImportStep>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [importId, setImportId] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [applying, setApplying] = useState(false)
  const [selection, setSelection] = useState({
    profile: true, nutrition: true, program: true, sessions: true
  })

  const uploadFile = useCallback(async (file: File) => {
    setStep('processing')
    setErrorMsg('')

    try {
      // 1. Obtener signed URL
      const signedRes = await fetch('/api/import/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size })
      })
      if (!signedRes.ok) {
        const err = await signedRes.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'Failed to get upload URL')
      }
      const { signedUrl, importId: fileId } = await signedRes.json()
      setImportId(fileId)

      // 2. Subir directo a Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file')

      // 3. Iniciar procesamiento (puede durar hasta 60s)
      fetch('/api/import/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: fileId, userId: '' })
      }).catch(() => {})

      // 4. Polling hasta que termine (max 90s)
      let attempts = 0
      const pollFn = async () => {
        if (attempts++ > 45) {
          setErrorMsg('Timeout: el análisis tardó demasiado')
          setStep('error')
          return
        }

        try {
          const statusRes = await fetch(`/api/import/status/${fileId}`)
          if (!statusRes.ok) { setTimeout(pollFn, 2000); return }
          const statusData = await statusRes.json()

          if (statusData.status === 'review_required') {
            const s = statusData.summary
            if (!s || (!s.hasProfile && !s.hasNutrition && !s.hasProgram && !s.hasSessions)) {
              setErrorMsg(t.noDataFound)
              setStep('error')
              return
            }
            setSummary(s)
            setConfidence(statusData.confidence || 0)
            setStep('review')
          } else if (statusData.status === 'error') {
            setErrorMsg('Error al analizar el archivo')
            setStep('error')
          } else if (statusData.status === 'processing' || statusData.status === 'pending') {
            setTimeout(pollFn, 2000)
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
  }, [t])

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
    setSelection({ profile: true, nutrition: true, program: true, sessions: true })
  }

  const CheckItem = ({
    label, sub, active, onToggle
  }: { label: string; sub?: string; active: boolean; onToggle: () => void }) => (
    <div
      onClick={onToggle}
      style={{
        padding: '12px 14px',
        background: active ? 'rgba(200,255,0,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '10px', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}
    >
      <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#ccc', fontFamily: 'DM Mono, monospace' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: '#555', fontFamily: 'DM Mono, monospace', marginTop: '2px' }}>{sub}</div>}
      </div>
      <div style={{
        width: '16px', height: '16px', borderRadius: '4px',
        background: active ? '#C8FF00' : 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {active && <span style={{ fontSize: '10px', color: '#0A0A0F' }}>✓</span>}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '24px', background: '#0f0f14', borderRadius: '20px', width: '100%' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {t.title}
        </h2>
        {onClose && step !== 'processing' && step !== 'applying' && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 0 2px' }}>×</button>
        )}
      </div>

      {/* STEP: Upload */}
      {step === 'upload' && (
        <div>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#666', lineHeight: '1.5' }}>{t.subtitle}</p>
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
            <div style={{ fontSize: '14px', color: '#ccc', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{t.dropzone}</div>
            <div style={{ fontSize: '12px', color: '#555', fontFamily: 'DM Mono, monospace', marginBottom: '10px' }}>{t.dropzoneOr}</div>
            <div style={{ fontSize: '11px', color: '#444', fontFamily: 'DM Mono, monospace' }}>{t.formats}</div>
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
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#C8FF00', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>{t.processing}</div>
          <div style={{ fontSize: '12px', color: '#666', fontFamily: 'DM Mono, monospace', marginBottom: '20px' }}>{t.processingDesc}</div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '40%', background: '#C8FF00', borderRadius: '2px', animation: 'slide 2s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {/* STEP: Review */}
      {step === 'review' && summary && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: '600' }}>{t.reviewTitle}</span>
            <span style={{ fontSize: '11px', color: confidence > 0.7 ? '#C8FF00' : '#FF9800', fontFamily: 'DM Mono, monospace' }}>
              {t.confidence}: {Math.round(confidence * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {summary.hasProfile && (
              <CheckItem
                label={`${t.profileSection}${summary.athleteName ? ` — ${summary.athleteName}` : ''}`}
                active={selection.profile}
                onToggle={() => setSelection(s => ({ ...s, profile: !s.profile }))}
              />
            )}
            {summary.hasNutrition && (
              <CheckItem
                label={t.nutritionSection}
                sub={[
                  summary.calories ? `${summary.calories} ${t.kcal}` : '',
                  summary.protein ? `${summary.protein}${t.protein}` : ''
                ].filter(Boolean).join(' · ')}
                active={selection.nutrition}
                onToggle={() => setSelection(s => ({ ...s, nutrition: !s.nutrition }))}
              />
            )}
            {summary.hasProgram && (
              <CheckItem
                label={t.programSection}
                sub={[
                  summary.splitDetected,
                  summary.daysPerWeek ? `${summary.daysPerWeek} ${t.daysPerWeek}` : '',
                  summary.exercisesInProgram > 0 ? `${summary.exercisesInProgram} ${t.exercises}` : ''
                ].filter(Boolean).join(' · ')}
                active={selection.program}
                onToggle={() => setSelection(s => ({ ...s, program: !s.program }))}
              />
            )}
            {summary.hasSessions && summary.sessionsCount > 0 && (
              <CheckItem
                label={t.sessionsSection}
                sub={`${summary.sessionsCount} ${t.sessions}`}
                active={selection.sessions}
                onToggle={() => setSelection(s => ({ ...s, sessions: !s.sessions }))}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={reset} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
              {t.cancel}
            </button>
            <button
              onClick={handleApply}
              disabled={applying || (!selection.profile && !selection.nutrition && !selection.program && !selection.sessions)}
              style={{ flex: 2, padding: '12px', background: '#C8FF00', border: 'none', borderRadius: '10px', color: '#0A0A0F', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: applying ? 0.7 : 1 }}
            >
              {t.applySelected}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Applying */}
      {step === 'applying' && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '2.5px solid #C8FF00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '14px', color: '#fff', fontFamily: 'Syne, sans-serif' }}>{t.applying}</div>
        </div>
      )}

      {/* STEP: Done */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#C8FF00', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>{t.done}</div>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px', fontFamily: 'DM Mono, monospace' }}>{t.doneDesc}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={reset} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#888', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
              {t.importAnother}
            </button>
            {onClose && (
              <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: '10px', color: '#C8FF00', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
                {t.viewProfile}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP: Error */}
      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>❌</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#FF5252', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>{t.error}</div>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 20px', fontFamily: 'DM Mono, monospace' }}>{errorMsg}</p>
          <button onClick={reset} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ccc', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
            {t.retry}
          </button>
        </div>
      )}
    </div>
  )
}

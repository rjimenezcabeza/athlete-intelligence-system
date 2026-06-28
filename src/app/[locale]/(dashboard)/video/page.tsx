'use client'

import { useRef, useState, useCallback } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'

const BG = 'var(--bg-primary)'
const CARD = 'var(--card-bg)'
const BORDER = 'var(--card-border)'
const T1 = 'var(--text-primary)'
const T2 = 'var(--text-secondary)'
const T3 = 'var(--text-tertiary)'
const ACC = 'var(--accent-color)'

const EXERCISES = [
  'Sentadilla', 'Sentadilla Frontal', 'Peso Muerto', 'Peso Muerto Rumano',
  'Press Banca', 'Press Inclinado', 'Press Militar', 'Press Arnold',
  'Jalón al Pecho', 'Remo con Barra', 'Dominadas', 'Face Pull',
  'Hip Thrust', 'Zancada', 'Prensa de Piernas', 'Curl de Bíceps',
  'Press Francés', 'Extensión de Tríceps', 'Elevaciones Laterales',
  'Remo en Polea', 'Cable Crossover', 'Otro',
]

type Correction = { issue: string; severity: string; correction: string; cue: string }

interface Analysis {
  overall_score: number
  overall_assessment: string
  strengths: string[]
  corrections: Correction[]
  technique_breakdown: Record<string, string>
  injury_risk: string
  injury_risk_notes: string
  next_session_focus: string
  drill_recommendation: string
}

const severityColor = (s: string, acc: string) => {
  if (s === 'critical') return '#FF4444'
  if (s === 'moderate') return '#FF9900'
  return acc
}
const riskColor = (r: string, acc: string) => {
  if (r === 'high') return '#FF4444'
  if (r === 'moderate') return '#FF9900'
  if (r === 'low') return '#FFDD00'
  return acc
}

export default function VideoAnalysisPage() {
  const { accentColor } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [frames, setFrames] = useState<string[]>([])
  const [exercise, setExercise] = useState('Sentadilla')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setError('El video no puede superar 50 MB'); return }
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setFrames([])
    setAnalysis(null)
    setError('')
    setStep('preview')
  }

  const extractFrames = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !videoUrl) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Extract 5 frames evenly spread across the video
    const duration = video.duration
    const frameCount = 5
    const times = Array.from({ length: frameCount }, (_, i) => (i / (frameCount - 1)) * duration)

    canvas.width = 640
    canvas.height = 360

    const extracted: string[] = []
    for (const t of times) {
      await new Promise<void>((res) => {
        video.currentTime = t
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, 640, 360)
          extracted.push(canvas.toDataURL('image/jpeg', 0.75))
          res()
        }
      })
    }
    setFrames(extracted)
    return extracted
  }, [videoUrl])

  const handleAnalyze = async () => {
    setError('')
    setLoading(true)
    try {
      let currentFrames = frames
      if (currentFrames.length === 0) {
        const extracted = await extractFrames()
        currentFrames = extracted || []
      }
      if (currentFrames.length === 0) { setError('No se pudieron extraer frames del video'); setLoading(false); return }

      const stripped = currentFrames.map(f => f.replace(/^data:image\/[a-z]+;base64,/, ''))
      const res = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames: stripped, exercise, lang: 'es' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al analizar'); setLoading(false); return }
      setAnalysis(data.analysis)
      setStep('result')
    } catch (e) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 8) return accentColor
    if (score >= 5) return '#FF9900'
    return '#FF4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🎥</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: T1 }}>
              Análisis de Técnica
            </h1>
            <p style={{ fontSize: 13, color: T2 }}>IA revisa tu ejecución y sugiere mejoras</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${accentColor}40`,
                borderRadius: 20,
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: `${accentColor}06`,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${accentColor}80`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = `${accentColor}40`)}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
              <p style={{ fontSize: 17, fontWeight: 700, color: T1, marginBottom: 8 }}>Sube un video de tu ejercicio</p>
              <p style={{ fontSize: 13, color: T2, marginBottom: 16 }}>MP4, MOV, AVI · Máx. 50 MB</p>
              <div style={{
                display: 'inline-block',
                background: accentColor,
                color: '#0A0A0F',
                padding: '10px 24px',
                borderRadius: 12,
                fontWeight: 800,
                fontFamily: "'Syne', sans-serif",
                fontSize: 14,
              }}>
                Seleccionar video
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Tips */}
            <div style={{ marginTop: 24, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.1em', marginBottom: 12 }}>CONSEJOS PARA MEJOR ANÁLISIS</p>
              {[
                '📐 Grábate desde un ángulo lateral completo',
                '💡 Buena iluminación — sin contraluz',
                '🎯 Todo el cuerpo visible en el encuadre',
                '⏱️ Videos de 5-30 segundos son ideales',
              ].map((tip, i) => (
                <p key={i} style={{ fontSize: 13, color: T2, marginBottom: 8 }}>{tip}</p>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Preview + Configure */}
        {step === 'preview' && videoUrl && (
          <div>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              style={{ width: '100%', borderRadius: 16, background: '#000', maxHeight: 320, objectFit: 'contain' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Exercise selector */}
            <div style={{ marginTop: 20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.1em', display: 'block', marginBottom: 12 }}>
                EJERCICIO EN EL VIDEO
              </label>
              <select
                value={exercise}
                onChange={e => setExercise(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d0d14',
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 12,
                  color: T1,
                  padding: '12px 16px',
                  fontSize: 15,
                  outline: 'none',
                  appearance: 'none',
                }}
              >
                {EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              {exercise === 'Otro' && (
                <input
                  placeholder="Nombre del ejercicio..."
                  onChange={e => setExercise(e.target.value)}
                  className="input"
                  style={{ marginTop: 12 }}
                />
              )}
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, color: '#FF6B6B', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => { setStep('upload'); setVideoUrl(null); setFrames([]) }}
                style={{ flex: 1, padding: '14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, color: T2, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                ← Cambiar video
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  flex: 2, padding: '14px',
                  background: loading ? '#333' : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  border: 'none', borderRadius: 14,
                  color: loading ? T2 : '#0A0A0F',
                  fontSize: 14, fontWeight: 800,
                  fontFamily: "'Syne', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${T2}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Analizando técnica...
                  </>
                ) : '🤖 Analizar con IA'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'result' && analysis && (
          <div className="fade-in">
            {/* Score */}
            <div style={{ textAlign: 'center', marginBottom: 24, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '28px 20px' }}>
              <div style={{ fontSize: 64, fontWeight: 900, fontFamily: "'Syne', sans-serif", color: scoreColor(analysis.overall_score), lineHeight: 1 }}>
                {analysis.overall_score}<span style={{ fontSize: 28, color: T3 }}>/10</span>
              </div>
              <p style={{ fontSize: 12, color: T2, marginTop: 4, marginBottom: 12, letterSpacing: '0.1em' }}>PUNTUACIÓN DE TÉCNICA</p>
              <p style={{ fontSize: 14, color: T1, lineHeight: 1.6 }}>{analysis.overall_assessment}</p>
            </div>

            {/* Injury risk */}
            {analysis.injury_risk !== 'none' && (
              <div style={{ marginBottom: 16, background: `${riskColor(analysis.injury_risk, accentColor)}10`, border: `1px solid ${riskColor(analysis.injury_risk, accentColor)}40`, borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: riskColor(analysis.injury_risk, accentColor), marginBottom: 4 }}>
                    Riesgo de lesión: {analysis.injury_risk.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 13, color: T2 }}>{analysis.injury_risk_notes}</p>
                </div>
              </div>
            )}

            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div style={{ marginBottom: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: '0.1em', marginBottom: 12 }}>✅ PUNTOS FUERTES</p>
                {analysis.strengths.map((s, i) => (
                  <p key={i} style={{ fontSize: 14, color: T1, marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${accentColor}50` }}>{s}</p>
                ))}
              </div>
            )}

            {/* Corrections */}
            {analysis.corrections?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#FF9900', letterSpacing: '0.1em', marginBottom: 12 }}>🔧 CORRECCIONES</p>
                {analysis.corrections.map((c, i) => (
                  <div key={i} style={{ marginBottom: 12, background: CARD, border: `1px solid ${severityColor(c.severity, accentColor)}30`, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: T1, flex: 1, paddingRight: 8 }}>{c.issue}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: severityColor(c.severity, accentColor), background: `${severityColor(c.severity, accentColor)}15`, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                        {c.severity === 'critical' ? '🔴 CRÍTICO' : c.severity === 'moderate' ? '🟡 MODERADO' : '🟢 MENOR'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: T2, marginBottom: 8 }}>{c.correction}</p>
                    <div style={{ background: `${accentColor}10`, borderRadius: 10, padding: '8px 12px' }}>
                      <p style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>💬 Cue: {c.cue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Technique breakdown */}
            {analysis.technique_breakdown && (
              <div style={{ marginBottom: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.1em', marginBottom: 12 }}>📊 DESGLOSE TÉCNICO</p>
                {Object.entries(analysis.technique_breakdown).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p style={{ fontSize: 13, color: T2 }}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Next session + drill */}
            <div style={{ marginBottom: 16, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: '0.1em', marginBottom: 12 }}>🎯 PRÓXIMO ENTRENAMIENTO</p>
              <p style={{ fontSize: 14, color: T1, marginBottom: 16 }}>{analysis.next_session_focus}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.1em', marginBottom: 8 }}>DRILL RECOMENDADO</p>
              <p style={{ fontSize: 14, color: T1 }}>{analysis.drill_recommendation}</p>
            </div>

            {/* Actions */}
            <button
              onClick={() => { setStep('upload'); setVideoUrl(null); setFrames([]); setAnalysis(null) }}
              style={{
                width: '100%', padding: '14px',
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                border: 'none', borderRadius: 14,
                color: '#0A0A0F',
                fontSize: 15, fontWeight: 800,
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer',
              }}
            >
              + Analizar otro video
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

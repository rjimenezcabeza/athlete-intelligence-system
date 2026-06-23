'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const BG = '#0A0A0F'
const CARD = '#111118'
const ACC = '#C8FF00'
const T1 = '#F0F0F5'
const T2 = '#8888AA'
const T3 = '#44445a'
const BORDER = 'rgba(255,255,255,0.06)'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CoachContext {
  dataCompleteness: {
    hasProfile: boolean
    hasNutrition: boolean
    hasSessions: boolean
    hasMesocycle: boolean
    hasVolumeHistory: boolean
    hasProgressionHistory: boolean
    score: number
  }
}

interface CoachChatProps {
  language?: string
  isPro?: boolean
}

function ContextPanel({ context, isEs }: { context: CoachContext; isEs: boolean }) {
  const dc = context.dataCompleteness
  const items = [
    { key: 'hasSessions' as const, label: isEs ? 'Sesiones' : 'Sessions' },
    { key: 'hasProfile' as const, label: isEs ? 'Perfil' : 'Profile' },
    { key: 'hasNutrition' as const, label: isEs ? 'Nutricion' : 'Nutrition' },
    { key: 'hasMesocycle' as const, label: isEs ? 'Mesociclo' : 'Mesocycle' },
    { key: 'hasProgressionHistory' as const, label: isEs ? 'Progresion' : 'Progression' },
  ]

  return (
    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid ' + BORDER, borderRadius: '12px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', color: T3, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {isEs ? 'Contexto del Coach' : 'Coach Context'}
        </span>
        <span style={{ fontSize: '11px', color: dc.score > 60 ? ACC : '#FF9800', fontFamily: 'DM Mono, monospace', fontWeight: '700' }}>
          {dc.score}% {isEs ? 'datos' : 'data'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {items.map(item => (
          <span
            key={item.key}
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'DM Mono, monospace',
              background: dc[item.key] ? 'rgba(200,255,0,0.08)' : 'rgba(255,255,255,0.03)',
              color: dc[item.key] ? ACC : T3,
              border: `1px solid ${dc[item.key] ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {dc[item.key] ? '✓' : '○'} {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function CoachChat({ language = 'es', isPro = false }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState<CoachContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initDoneRef = useRef(false)
  const isEs = language === 'es'

  useEffect(() => {
    fetch('/api/coach/context')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContext(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const streamMessage = useCallback(async (text: string, autoInitiated = false) => {
    if (loading) return

    if (!autoInitiated) {
      setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }])
    }
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }])

    try {
      const history = autoInitiated ? [] : messages
        .filter(m => m.content)
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversation_history: history })
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const { text: chunk } = JSON.parse(raw)
            fullText += chunk
            const snapshot = fullText
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { role: 'assistant', content: snapshot, timestamp: new Date() }
              return copy
            })
          } catch {}
        }
      }
    } catch (error: any) {
      const errMsg = isEs
        ? `Error al contactar al Coach. Intenta de nuevo.`
        : `Error contacting the Coach. Please try again.`
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: errMsg, timestamp: new Date() }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }, [loading, messages, isEs])

  useEffect(() => {
    if (!context || initDoneRef.current) return
    initDoneRef.current = true
    const score = context.dataCompleteness?.score ?? 0
    const initMsg = score > 30
      ? (isEs
          ? 'Analiza mi estado de entrenamiento actual y dame tu evaluacion detallada'
          : 'Analyze my current training status and give me your detailed assessment')
      : (isEs
          ? 'Presentate y ayudame a empezar con AIS'
          : 'Introduce yourself and help me get started with AIS')
    streamMessage(initMsg, true)
  }, [context])

  const suggestedQuestions = isEs
    ? ['¿Cómo está mi progresión este mes?', '¿Debería hacer deload pronto?', '¿Cuál es mi ejercicio con más potencial?', '¿Cómo mejorar mi recuperación?']
    : ['How is my progression this month?', 'Should I deload soon?', 'Which exercise has the most potential?', 'How to improve my recovery?']

  if (!isPro) {
    return (
      <div style={{ borderRadius: '16px', border: '1px solid rgba(200,255,0,0.15)', background: 'rgba(200,255,0,0.04)', padding: '28px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤖</div>
        <p style={{ color: T2, fontSize: '14px', marginBottom: '20px', fontFamily: 'Inter, sans-serif', lineHeight: '1.5' }}>
          {isEs
            ? 'El AI Coach está disponible para miembros Pro. Actualiza para desbloquear coaching personalizado.'
            : 'AI Coach is available for Pro members. Upgrade to unlock personalized coaching.'}
        </p>
        <button style={{ padding: '12px 28px', borderRadius: '12px', background: ACC, color: BG, border: 'none', fontSize: '14px', fontWeight: '700', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
          {isEs ? 'Actualizar a Pro' : 'Upgrade to Pro'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Context panel */}
      {context && <ContextPanel context={context} isEs={isEs} />}

      {/* Initializing skeleton */}
      {!context && (
        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid ' + BORDER, borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ACC, animation: 'pulse 1s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', color: T3, fontFamily: 'DM Mono, monospace' }}>
            {isEs ? 'Cargando contexto del atleta...' : 'Loading athlete context...'}
          </span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '8px', minHeight: 0, maxHeight: '420px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '10px 14px',
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'Inter, sans-serif',
              background: msg.role === 'user' ? ACC : 'rgba(255,255,255,0.06)',
              color: msg.role === 'user' ? BG : T1,
              fontWeight: msg.role === 'user' ? '500' : '400',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content || (msg.role === 'assistant' && loading && i === messages.length - 1 ? (
                <span style={{ color: T2, fontSize: '12px' }}>
                  {isEs ? 'Analizando tu historial...' : 'Analyzing your history...'}
                </span>
              ) : null)}
              {!msg.content && msg.role === 'assistant' && loading && i === messages.length - 1 && (
                <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACC, display: 'inline-block', animation: 'bounce 0.8s ease-in-out infinite' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACC, display: 'inline-block', animation: 'bounce 0.8s ease-in-out 0.15s infinite' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACC, display: 'inline-block', animation: 'bounce 0.8s ease-in-out 0.3s infinite' }} />
                </span>
              )}
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACC, display: 'block', animation: 'bounce 0.8s ease-in-out infinite' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACC, display: 'block', animation: 'bounce 0.8s ease-in-out 0.15s infinite' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACC, display: 'block', animation: 'bounce 0.8s ease-in-out 0.3s infinite' }} />
                <span style={{ color: T3, fontSize: '11px', marginLeft: '4px', fontFamily: 'DM Mono, monospace' }}>
                  {isEs ? 'Analizando...' : 'Analyzing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions — shown before any user message */}
      {messages.filter(m => m.role === 'user').length === 0 && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingBottom: '10px' }}>
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => streamMessage(q)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: T2,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.35)'; e.currentTarget.style.color = ACC }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = T2 }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid ' + BORDER }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && streamMessage(input)}
          placeholder={isEs ? 'Pregunta algo sobre tu entrenamiento...' : 'Ask something about your training...'}
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '14px',
            color: T1,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            opacity: loading ? 0.5 : 1
          }}
        />
        <button
          onClick={() => streamMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: ACC,
            color: BG,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.3 : 1,
            flexShrink: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2L5 8L2 14L14 8Z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      ` }} />
    </div>
  )
}

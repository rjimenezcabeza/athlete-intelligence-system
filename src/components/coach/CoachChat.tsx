'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CoachChatProps {
  language?: string
  isPro?: boolean
}

const SUGGESTED_QUESTIONS_ES = [
  '¿Cómo está mi progresión este mes?',
  '¿Debería hacer deload pronto?',
  '¿Cuál es mi ejercicio con más potencial?',
  '¿Cómo mejorar mi recuperación?',
]

const SUGGESTED_QUESTIONS_EN = [
  'How is my progression this month?',
  'Should I deload soon?',
  'Which exercise has the most potential?',
  'How to improve my recovery?',
]

export function CoachChat({ language = 'es', isPro = false }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const t = {
    placeholder: language === 'en' ? 'Ask your coach...' : 'Pregunta a tu coach...',
    thinking: language === 'en' ? 'Analyzing your data...' : 'Analizando tus datos...',
    pro_required: language === 'en'
      ? 'AI Coach is available for Pro members. Upgrade to unlock personalized coaching.'
      : 'El AI Coach está disponible para miembros Pro. Actualiza para desbloquear coaching personalizado.',
    upgrade: language === 'en' ? 'Upgrade to Pro' : 'Actualizar a Pro',
    welcome: language === 'en'
      ? 'Hi! I\'m your AI Coach. I have access to your complete training history. What would you like to know?'
      : '¡Hola! Soy tu AI Coach. Tengo acceso a tu historial completo de entrenamiento. ¿Qué quieres saber?',
  }

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t.welcome,
        timestamp: new Date()
      }])
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const conversationHistory = newMessages
        .slice(1) // skip welcome message
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_history: conversationHistory.slice(0, -1)
        })
      })

      const data = await res.json()

      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }])
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'en'
          ? `Sorry, I had an error: ${error.message}. Try again.`
          : `Lo siento, tuve un error: ${error.message}. Inténtalo de nuevo.`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = language === 'en' ? SUGGESTED_QUESTIONS_EN : SUGGESTED_QUESTIONS_ES

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-[#C8FF00]/20 bg-[#C8FF00]/5 p-6 text-center">
        <div className="text-4xl mb-3">🤖</div>
        <p className="text-white/70 text-sm mb-4">{t.pro_required}</p>
        <button className="px-6 py-3 rounded-xl bg-[#C8FF00] text-black font-bold text-sm hover:bg-[#b8ef00] transition-colors">
          {t.upgrade}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0" style={{ maxHeight: '400px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-[#C8FF00] text-black font-medium rounded-br-sm'
                : 'bg-white/[0.06] text-white/90 border border-white/10 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#C8FF00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-white/30 text-xs ml-1">{t.thinking}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.filter(m => m.role === 'user').length === 0 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:border-[#C8FF00]/40 hover:text-[#C8FF00] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={t.placeholder}
          disabled={loading}
          className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8FF00]/40 disabled:opacity-50"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl bg-[#C8FF00] text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#b8ef00] transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2L5 8L2 14L14 8Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

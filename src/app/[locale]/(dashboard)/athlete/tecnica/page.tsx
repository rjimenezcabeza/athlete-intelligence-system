'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AthleteTabBar } from '@/components/athlete/AthleteTabBar'

const BG=`var(--bg-primary,#0A0A0F)`,CARD=`var(--card-bg,rgba(255,255,255,.04))`,BDR=`var(--card-border,rgba(255,255,255,.08))`,T1=`var(--text-primary,#fff)`,T2=`var(--text-secondary,#888)`,T3=`var(--text-tertiary,#44445a)`,ACC=`var(--accent-color,#C8FF00)`

export default function TecnicaPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'es'
  const isEs = locale !== 'en'

  const tools = [
    {
      icon: '🎥',
      title: isEs ? 'Análisis de vídeo IA' : 'AI Video Analysis',
      desc: isEs
        ? 'Graba un ejercicio y recibe feedback técnico personalizado de la IA'
        : 'Record an exercise and get personalized AI technique feedback',
      href: `/${locale}/video`,
      color: '#A78BFA',
      cta: isEs ? 'Analizar vídeo →' : 'Analyze video →',
    },
    {
      icon: '💪',
      title: isEs ? 'Biblioteca de ejercicios' : 'Exercise Library',
      desc: isEs
        ? 'Consulta cues de técnica, patrones de movimiento y variantes para cada ejercicio'
        : 'View technique cues, movement patterns, and variations for every exercise',
      href: `/${locale}/exercises`,
      color: '#4ADE80',
      cta: isEs ? 'Ver ejercicios →' : 'Browse exercises →',
    },
    {
      icon: '📊',
      title: isEs ? 'Progresión de cargas' : 'Load Progression',
      desc: isEs
        ? 'Analiza cómo han evolucionado tus cargas por ejercicio en el tiempo'
        : 'See how your loads have progressed per exercise over time',
      href: `/${locale}/progress`,
      color: '#FBBF24',
      cta: isEs ? 'Ver progresión →' : 'View progression →',
    },
    {
      icon: '🧠',
      title: isEs ? 'Coach IA' : 'AI Coach',
      desc: isEs
        ? 'Habla con el coach para recibir consejo técnico personalizado basado en tu historial'
        : 'Chat with your coach for personalized technique advice based on your history',
      href: `/${locale}/coach`,
      color: ACC,
      cta: isEs ? 'Hablar con coach →' : 'Chat with coach →',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, paddingBottom: 100 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ paddingTop: 52 }}>
        <AthleteTabBar locale={locale} />
      </div>

      <div style={{ padding: '16px 20px 12px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: 'Syne,sans-serif', color: T1, letterSpacing: '-0.02em' }}>
          🎯 {isEs ? 'Técnica & Análisis' : 'Technique & Analysis'}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: T3, fontFamily: 'DM Mono,monospace' }}>
          {isEs ? 'Herramientas para mejorar tu técnica de entrenamiento' : 'Tools to improve your training technique'}
        </p>
      </div>

      <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tools.map((tool, i) => (
          <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '18px 16px',
              background: CARD,
              border: `1px solid ${BDR}`,
              borderRadius: 16,
              display: 'flex', flexDirection: 'column', gap: 10,
              position: 'relative', overflow: 'hidden',
              animation: `fadeUp .4s ease-out ${i * 60 + 100}ms both`,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${tool.color},transparent)`, borderRadius: '16px 16px 0 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T1, fontFamily: 'Syne,sans-serif' }}>{tool.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: T2, fontFamily: 'DM Mono,monospace', lineHeight: 1.5 }}>{tool.desc}</p>
                </div>
              </div>
              <div style={{ alignSelf: 'flex-end', fontSize: 12, fontWeight: 700, color: tool.color, fontFamily: 'Syne,sans-serif' }}>
                {tool.cta}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

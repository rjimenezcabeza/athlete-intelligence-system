'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Step = 'welcome' | 'profile' | 'path' | 'done'

const T: Record<string, Record<string, string>> = {
  es: {
    welcomeTitle: 'Bienvenido a AIS', welcomeDesc: 'Tu sistema operativo para hipertrofia. 2 minutos para configurarlo.',
    start: 'Empezar',
    profileTitle: 'Cuentame sobre ti', profileDesc: 'El AI Coach usara estos datos desde el primer mensaje.',
    weightLabel: 'Peso corporal (kg)', weightPh: 'Ej: 85',
    expLabel: 'Anos entrenando', expPh: 'Ej: 3',
    goalLabel: 'Objetivo principal',
    goalHyper: 'Hipertrofia maxima', goalStrength: 'Fuerza e hipertrofia', goalCut: 'Definicion',
    next: 'Continuar',
    pathTitle: 'Como quieres empezar?', pathDesc: 'Puedes importar tu programa o elegir una rutina predefinida.',
    importTitle: 'Tengo un programa', importDesc: 'PDF, foto, Excel. La IA lo importa automaticamente.',
    routineTitle: 'Quiero una rutina', routineDesc: 'Elige entre PPL, Upper/Lower, Full Body y mas.',
    blankTitle: 'Empezar desde cero', blankDesc: 'Construye tu programa ejercicio por ejercicio.',
    doneTitle: 'Todo listo!', doneDesc: 'Tu Coach ya tiene tu perfil. Empieza a entrenar.',
    toDashboard: 'Ir al dashboard', toCoach: 'Hablar con el Coach',
    saving: 'Guardando...'
  },
  en: {
    welcomeTitle: 'Welcome to AIS', welcomeDesc: 'Your hypertrophy operating system. 2 minutes to set it up.',
    start: 'Get Started',
    profileTitle: 'Tell me about yourself', profileDesc: 'The AI Coach will use this data from the first message.',
    weightLabel: 'Body weight (kg)', weightPh: 'E.g: 85',
    expLabel: 'Years training', expPh: 'E.g: 3',
    goalLabel: 'Primary goal',
    goalHyper: 'Maximum hypertrophy', goalStrength: 'Strength and hypertrophy', goalCut: 'Body recomposition',
    next: 'Continue',
    pathTitle: 'How do you want to start?', pathDesc: 'You can import your program or choose a preset routine.',
    importTitle: 'I have a program', importDesc: 'PDF, photo, Excel. AI imports it automatically.',
    routineTitle: 'I want a routine', routineDesc: 'Choose from PPL, Upper/Lower, Full Body and more.',
    blankTitle: 'Start from scratch', blankDesc: 'Build your program exercise by exercise.',
    doneTitle: 'All set!', doneDesc: 'Your Coach has your profile. Start training.',
    toDashboard: 'Go to dashboard', toCoach: 'Talk to Coach',
    saving: 'Saving...'
  },
  fr: {
    welcomeTitle: 'Bienvenue sur AIS', welcomeDesc: "Votre systeme pour l'hypertrophie. 2 minutes pour le configurer.",
    start: 'Commencer',
    profileTitle: 'Parlez-moi de vous', profileDesc: 'Le Coach IA utilisera ces donnees des le premier message.',
    weightLabel: 'Poids corporel (kg)', weightPh: 'Ex: 85',
    expLabel: "Annees d'entrainement", expPh: 'Ex: 3',
    goalLabel: 'Objectif principal',
    goalHyper: 'Hypertrophie maximale', goalStrength: 'Force et hypertrophie', goalCut: 'Recomposition',
    next: 'Continuer',
    pathTitle: 'Comment voulez-vous commencer?', pathDesc: 'Vous pouvez importer votre programme ou choisir une routine.',
    importTitle: "J'ai un programme", importDesc: "PDF, photo, Excel. L'IA l'importe automatiquement.",
    routineTitle: 'Je veux une routine', routineDesc: 'Choisissez parmi PPL, Upper/Lower, Full Body et plus.',
    blankTitle: 'Commencer de zero', blankDesc: 'Construisez votre programme exercice par exercice.',
    doneTitle: 'Tout est pret!', doneDesc: 'Votre Coach a votre profil. Commencez a vous entrainer.',
    toDashboard: 'Aller au tableau de bord', toCoach: 'Parler au Coach',
    saving: 'Sauvegarde...'
  },
  de: {
    welcomeTitle: 'Willkommen bei AIS', welcomeDesc: 'Ihr Hypertrophie-Betriebssystem. 2 Minuten zum Einrichten.',
    start: 'Loslegen',
    profileTitle: 'Erzahlen Sie mir von sich', profileDesc: 'Der KI-Coach verwendet diese Daten ab der ersten Nachricht.',
    weightLabel: 'Korpergewicht (kg)', weightPh: 'z.B: 85',
    expLabel: 'Jahre Training', expPh: 'z.B: 3',
    goalLabel: 'Hauptziel',
    goalHyper: 'Maximale Hypertrophie', goalStrength: 'Kraft und Hypertrophie', goalCut: 'Rekomposition',
    next: 'Weiter',
    pathTitle: 'Wie mochten Sie beginnen?', pathDesc: 'Sie konnen Ihr Programm importieren oder eine Routine wahlen.',
    importTitle: 'Ich habe ein Programm', importDesc: 'PDF, Foto, Excel. KI importiert es automatisch.',
    routineTitle: 'Ich mochte eine Routine', routineDesc: 'Wahlen Sie aus PPL, Upper/Lower, Full Body und mehr.',
    blankTitle: 'Von vorne anfangen', blankDesc: 'Erstellen Sie Ihr Programm Ubung fur Ubung.',
    doneTitle: 'Alles bereit!', doneDesc: 'Ihr Coach hat Ihr Profil. Fangen Sie an zu trainieren.',
    toDashboard: 'Zum Dashboard', toCoach: 'Mit Coach sprechen',
    saving: 'Speichern...'
  },
  it: {
    welcomeTitle: 'Benvenuto su AIS', welcomeDesc: "Il tuo sistema operativo per l'ipertrofia. 2 minuti per configurarlo.",
    start: 'Inizia',
    profileTitle: 'Parlami di te', profileDesc: 'Il Coach AI usera questi dati dal primo messaggio.',
    weightLabel: 'Peso corporeo (kg)', weightPh: 'Es: 85',
    expLabel: 'Anni di allenamento', expPh: 'Es: 3',
    goalLabel: 'Obiettivo principale',
    goalHyper: 'Ipertrofia massima', goalStrength: 'Forza e ipertrofia', goalCut: 'Ricomposizione',
    next: 'Continua',
    pathTitle: 'Come vuoi iniziare?', pathDesc: 'Puoi importare il tuo programma o scegliere una routine.',
    importTitle: 'Ho un programma', importDesc: "PDF, foto, Excel. L'IA lo importa automaticamente.",
    routineTitle: 'Voglio una routine', routineDesc: 'Scegli tra PPL, Upper/Lower, Full Body e altro.',
    blankTitle: 'Inizia da zero', blankDesc: 'Costruisci il tuo programma esercizio per esercizio.',
    doneTitle: 'Tutto pronto!', doneDesc: 'Il tuo Coach ha il tuo profilo. Inizia ad allenarti.',
    toDashboard: 'Vai alla dashboard', toCoach: 'Parla con il Coach',
    saving: 'Salvataggio...'
  },
  nl: {
    welcomeTitle: 'Welkom bij AIS', welcomeDesc: 'Uw hypertrofie-besturingssysteem. 2 minuten om in te stellen.',
    start: 'Beginnen',
    profileTitle: 'Vertel me over jezelf', profileDesc: 'De AI Coach gebruikt deze gegevens vanaf het eerste bericht.',
    weightLabel: 'Lichaamsgewicht (kg)', weightPh: 'Bijv: 85',
    expLabel: 'Jaren training', expPh: 'Bijv: 3',
    goalLabel: 'Hoofddoel',
    goalHyper: 'Maximale hypertrofie', goalStrength: 'Kracht en hypertrofie', goalCut: 'Recompositie',
    next: 'Doorgaan',
    pathTitle: 'Hoe wilt u beginnen?', pathDesc: 'U kunt uw programma importeren of een routine kiezen.',
    importTitle: 'Ik heb een programma', importDesc: 'PDF, foto, Excel. AI importeert het automatisch.',
    routineTitle: 'Ik wil een routine', routineDesc: 'Kies uit PPL, Upper/Lower, Full Body en meer.',
    blankTitle: 'Begin vanaf nul', blankDesc: 'Bouw uw programma oefening voor oefening.',
    doneTitle: 'Klaar!', doneDesc: 'Uw Coach heeft uw profiel. Begin met trainen.',
    toDashboard: 'Naar dashboard', toCoach: 'Praat met Coach',
    saving: 'Opslaan...'
  }
}

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'es'
  const t = T[locale] || T.es

  const [step, setStep] = useState<Step>('welcome')
  const [weight, setWeight] = useState('')
  const [experience, setExperience] = useState('')
  const [goal, setGoal] = useState('hypertrophy')
  const [saving, setSaving] = useState(false)

  const steps: Step[] = ['welcome', 'profile', 'path', 'done']
  const progressPct = (steps.indexOf(step) / (steps.length - 1)) * 100

  const saveProfile = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_goal: goal,
          body_weight_kg: weight ? parseFloat(weight) : undefined,
          training_experience_years: parseInt(experience) || 0,
          language: locale,
        })
      })
    } finally {
      setSaving(false)
    }
  }, [goal, weight, experience, locale])

  const handlePath = useCallback(async (path: 'import' | 'routine' | 'blank') => {
    await saveProfile()
    if (path === 'import') router.push(`/${locale}/import`)
    else if (path === 'routine') router.push(`/${locale}/dashboard?showTemplates=true`)
    else setStep('done')
  }, [saveProfile, locale, router])

  const accent = '#C8FF00'
  const dark = '#0A0A0F'

  return (
    <div style={{ minHeight: '100vh', background: dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Progress */}
        {step !== 'welcome' && step !== 'done' && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: accent, borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* WELCOME */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '20px' }}>🏋️</div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: '10px' }}>{t.welcomeTitle}</h1>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '36px', lineHeight: '1.6' }}>{t.welcomeDesc}</p>
            <button onClick={() => setStep('profile')} style={{ width: '100%', padding: '15px', background: accent, border: 'none', borderRadius: '12px', color: dark, fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              {t.start} →
            </button>
          </div>
        )}

        {/* PROFILE */}
        {step === 'profile' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: '6px' }}>{t.profileTitle}</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>{t.profileDesc}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '5px' }}>{t.weightLabel}</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={t.weightPh}
                  style={{ width: '100%', padding: '11px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '5px' }}>{t.expLabel}</label>
                <input type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder={t.expPh}
                  style={{ width: '100%', padding: '11px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', fontFamily: 'DM Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontFamily: 'DM Mono, monospace', marginBottom: '7px' }}>{t.goalLabel}</label>
                {[['hypertrophy', t.goalHyper], ['strength', t.goalStrength], ['weight_loss', t.goalCut]].map(([val, label]) => (
                  <button key={val} onClick={() => setGoal(val)}
                    style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: '6px', background: goal === val ? 'rgba(200,255,0,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${goal === val ? 'rgba(200,255,0,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', color: goal === val ? accent : '#888', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Mono, monospace' }}>
                    {goal === val ? '● ' : '○ '}{label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('path')} style={{ width: '100%', marginTop: '20px', padding: '13px', background: accent, border: 'none', borderRadius: '10px', color: dark, fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              {t.next} →
            </button>
          </div>
        )}

        {/* PATH */}
        {step === 'path' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: '6px' }}>{t.pathTitle}</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{t.pathDesc}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([
                ['import', '🤖', t.importTitle, t.importDesc, true],
                ['routine', '📋', t.routineTitle, t.routineDesc, false],
                ['blank', '✏️', t.blankTitle, t.blankDesc, false],
              ] as [string, string, string, string, boolean][]).map(([key, emoji, title, desc, highlighted]) => (
                <button key={key} onClick={() => handlePath(key as 'import' | 'routine' | 'blank')} disabled={saving}
                  style={{ padding: '14px', background: highlighted ? 'rgba(200,255,0,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${highlighted ? 'rgba(200,255,0,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', cursor: saving ? 'not-allowed' : 'pointer', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start', opacity: saving ? 0.6 : 1 }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{emoji}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: highlighted ? accent : '#ddd', fontFamily: 'Syne, sans-serif', marginBottom: '3px' }}>{title}</div>
                    <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {saving && <p style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginTop: '10px', fontFamily: 'DM Mono, monospace' }}>{t.saving}</p>}
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '18px' }}>✅</div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: accent, fontFamily: 'Syne, sans-serif', marginBottom: '10px' }}>{t.doneTitle}</h2>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '28px', lineHeight: '1.6' }}>{t.doneDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => router.push(`/${locale}/dashboard`)} style={{ padding: '13px', background: accent, border: 'none', borderRadius: '10px', color: dark, fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                {t.toDashboard}
              </button>
              <button onClick={() => router.push(`/${locale}/coach`)} style={{ padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#888', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Mono, monospace' }}>
                {t.toCoach} →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

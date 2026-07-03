import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const maxDuration = 15

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvcKey = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(getUrl(), getSvcKey(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supa.auth.getUser()
  return user
}

function db() {
  return createClient(getUrl(), getSvcKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = db()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id,display_name,primary_goal,training_experience_years,body_weight_kg')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const {
      exerciseName = 'ejercicio',
      weightKg,
      reps,
      rir,
      setNumber = 1,
      locale = 'es',
      previousSets = [],
      totalSetsToday = 0,
    } = body

    const isEs = locale === 'es'

    // Build context about previous sets of this exercise
    const prevContext = previousSets.length > 0
      ? previousSets.slice(-3).map((s: any) =>
          `S${s.set_number}: ${s.weight_kg}kg×${s.reps_completed}${s.rir_actual != null ? ` RIR${s.rir_actual}` : ''}`
        ).join(' | ')
      : null

    // Compute a simple progression signal
    let progressionSignal = ''
    if (previousSets.length > 0) {
      const lastSameExercise = previousSets[previousSets.length - 1]
      const weightChange = weightKg - (lastSameExercise.weight_kg ?? weightKg)
      const repChange = reps - (lastSameExercise.reps_completed ?? reps)
      if (weightChange > 0) progressionSignal = isEs ? `subió ${weightChange}kg vs anterior` : `+${weightChange}kg vs last`
      else if (repChange > 0) progressionSignal = isEs ? `+${repChange} reps vs anterior` : `+${repChange} reps vs last`
      else if (rir != null && rir < (lastSameExercise.rir_actual ?? 3)) progressionSignal = isEs ? 'más cerca del fallo que antes' : 'closer to failure than before'
    }

    const systemPrompt = isEs
      ? `Eres un coach de élite en hipertrofia. Reaccionas brevemente a cada serie registrada durante el entrenamiento. Tu estilo: directo, técnico, motivador, sin relleno. Atleta: ${profile.display_name}, objetivo: ${profile.primary_goal ?? 'hipertrofia'}, experiencia: ${profile.training_experience_years ?? '?'} años${profile.body_weight_kg ? `, peso: ${profile.body_weight_kg}kg` : ''}. Responde SIEMPRE en español. Máximo 2 frases. Sin emojis al inicio.`
      : `You are an elite hypertrophy coach. React briefly to each set logged during training. Style: direct, technical, motivating, no filler. Athlete: ${profile.display_name}, goal: ${profile.primary_goal ?? 'hypertrophy'}, experience: ${profile.training_experience_years ?? '?'} years${profile.body_weight_kg ? `, bodyweight: ${profile.body_weight_kg}kg` : ''}. Max 2 sentences. No emojis at the start.`

    const userPrompt = isEs
      ? `Ejercicio: ${exerciseName}\nSerie ${setNumber}: ${weightKg}kg × ${reps} reps${rir != null ? `, RIR ${rir}` : ''}${prevContext ? `\nSeries previas esta sesión: ${prevContext}` : ''}${progressionSignal ? `\nProgresión detectada: ${progressionSignal}` : ''}${totalSetsToday > 0 ? `\nTotal series hoy: ${totalSetsToday}` : ''}\n\nReacciona como coach.`
      : `Exercise: ${exerciseName}\nSet ${setNumber}: ${weightKg}kg × ${reps} reps${rir != null ? `, RIR ${rir}` : ''}${prevContext ? `\nPrevious sets this session: ${prevContext}` : ''}${progressionSignal ? `\nProgression signal: ${progressionSignal}` : ''}${totalSetsToday > 0 ? `\nTotal sets today: ${totalSetsToday}` : ''}\n\nReact as coach.`

    const apiKey = (process.env.ANTHROPIC_API_KEY ?? '').trim()
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic error:', errText)
      return NextResponse.json({ error: 'AI unavailable' }, { status: 502 })
    }

    const aiData = await res.json()
    const message = aiData.content?.[0]?.text?.trim() ?? ''

    return NextResponse.json({ message })
  } catch (e: any) {
    console.error('session-set AI error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

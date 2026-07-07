import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function calcDoubleProgression(
  sets: Array<{ weightKg: number; repsCompleted: number; rirActual?: number }>,
  repMin: number,
  repMax: number,
  increment: number
) {
  if (!sets.length) return null
  const w = sets[0].weightKg
  const allHitMax = sets.every(s => s.repsCompleted >= repMax)
  const allAboveMin = sets.every(s => s.repsCompleted >= repMin)

  if (allHitMax) {
    return {
      action: 'increase_weight',
      newWeightKg: w + increment,
      newRepsTarget: repMin,
      reasoning_es: `Completaste todos los sets con ${repMax} reps. Sube a ${w + increment}kg esta semana.`,
      reasoning_en: `You hit ${repMax} reps on all sets. Increase to ${w + increment}kg this week.`
    }
  }
  if (!allAboveMin) {
    return {
      action: 'maintain_weight',
      newWeightKg: w,
      newRepsTarget: repMin,
      reasoning_es: `Aun no llegas al rango minimo. Mantiene ${w}kg y mejora la tecnica.`,
      reasoning_en: `Not yet hitting minimum reps. Keep ${w}kg and focus on technique.`
    }
  }
  return {
    action: 'increase_reps',
    newWeightKg: w,
    newRepsTarget: Math.min(Math.min(...sets.map(s => s.repsCompleted)) + 1, repMax),
    reasoning_es: `Buen trabajo. Mantiene ${w}kg e intenta llegar a ${repMax} reps en todos los sets.`,
    reasoning_en: `Good work. Keep ${w}kg and try to reach ${repMax} reps on all sets.`
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { exerciseId, sessionId, completedSets } = body

    if (!exerciseId || !completedSets?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Buscar configuracion del ejercicio en template activo
    const { data: tmpl } = await (supabase as any)
      .from('template_exercises')
      .select('rep_range_min, rep_range_max, rir_target, progression_methods(config, method_type)')
      .eq('exercise_id', exerciseId)
      .maybeSingle()

    const cfg = tmpl?.progression_methods?.config || {}
    const repMin = tmpl?.rep_range_min || cfg.rep_range_min || 8
    const repMax = tmpl?.rep_range_max || cfg.rep_range_max || 12
    const increment = cfg.weight_increment_kg || 2.5

    const workingSets = completedSets.filter((s: any) => s.setType === 'working' && s.weightKg && s.repsCompleted)
    if (!workingSets.length) return NextResponse.json({ suggestion: null })

    const suggestion = calcDoubleProgression(workingSets, repMin, repMax, increment)
    if (!suggestion) return NextResponse.json({ suggestion: null })

    await (supabase as any)
      .from('progression_log')
      .insert({
        athlete_id: profile.id,
        exercise_id: exerciseId,
        session_id: sessionId || null,
        action_type: suggestion.action,
        prev_weight_kg: workingSets[0].weightKg,
        prev_reps_target: workingSets[0].repsCompleted,
        new_weight_kg: suggestion.newWeightKg,
        new_reps_target: suggestion.newRepsTarget,
        reasoning_es: suggestion.reasoning_es,
        reasoning_en: suggestion.reasoning_en,
        trigger_data: { workingSets: workingSets.length, repMin, repMax },
        applied: false
      })

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[progression/calculate]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

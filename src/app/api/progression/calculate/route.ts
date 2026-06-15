import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface ProgressionRecommendation {
  exercise_id: string
  exercise_name: string
  action_type: 'weight_increase' | 'rep_increase' | 'deload' | 'maintain' | 'set_increase'
  prev_weight_kg: number | null
  new_weight_kg: number | null
  prev_reps_target: number | null
  new_reps_target: number | null
  reasoning_es: string
  reasoning_en: string
  confidence: 'high' | 'medium' | 'low'
}

// POST /api/progression/calculate
// Body: { session_id: string }
// Calcula progresión para todos los ejercicios de la sesión completada
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('athlete_profiles')
    .select('id, language')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json()
  const { session_id } = body
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  // 1. Obtener ejercicios de la sesión con sus sets
  const { data: sessionExercises, error: seError } = await (supabase as any)
    .from('session_exercises')
    .select(`
      id,
      exercise_id,
      exercises(id, name, slug, muscle_group_primary),
      sets(
        id, set_number, set_type, weight_kg, reps_completed, rir_actual, is_personal_record
      )
    `)
    .eq('session_id', session_id)
    .order('order_in_session')

  if (seError || !sessionExercises) {
    return NextResponse.json({ error: 'Session exercises not found' }, { status: 404 })
  }

  const recommendations: ProgressionRecommendation[] = []

  for (const se of sessionExercises) {
    const workingSets = (se.sets || []).filter((s: any) => s.set_type === 'working')
    if (workingSets.length === 0) continue

    const avgRir = workingSets.reduce((sum: number, s: any) => sum + (s.rir_actual || 0), 0) / workingSets.length
    const maxWeight = Math.max(...workingSets.map((s: any) => s.weight_kg || 0))
    const avgReps = workingSets.reduce((sum: number, s: any) => sum + (s.reps_completed || 0), 0) / workingSets.length
    const setCount = workingSets.length

    // Obtener historial del ejercicio
    const { data: history } = await (supabase as any)
      .from('exercise_history')
      .select('*')
      .eq('athlete_id', profile.id)
      .eq('exercise_id', se.exercise_id)
      .single()

    // === LÓGICA: DOUBLE PROGRESSION (método por defecto) ===
    let rec: ProgressionRecommendation | null = null

    if (avgRir <= 1.0 && setCount >= 2) {
      const increment = maxWeight >= 60 ? 2.5 : 1.25
      rec = {
        exercise_id: se.exercise_id,
        exercise_name: se.exercises?.name || '',
        action_type: 'weight_increase',
        prev_weight_kg: maxWeight,
        new_weight_kg: maxWeight + increment,
        prev_reps_target: Math.round(avgReps),
        new_reps_target: Math.round(avgReps),
        reasoning_es: `RIR promedio de ${avgRir.toFixed(1)} — tienes margen. Sube ${increment}kg la próxima sesión.`,
        reasoning_en: `Avg RIR ${avgRir.toFixed(1)} — you have room. Add ${increment}kg next session.`,
        confidence: avgRir === 0 ? 'high' : 'medium'
      }
    } else if (avgRir >= 3.5) {
      rec = {
        exercise_id: se.exercise_id,
        exercise_name: se.exercises?.name || '',
        action_type: 'maintain',
        prev_weight_kg: maxWeight,
        new_weight_kg: maxWeight,
        prev_reps_target: Math.round(avgReps),
        new_reps_target: Math.round(avgReps) + 1,
        reasoning_es: `RIR alto (${avgRir.toFixed(1)}). Mantén el peso e intenta añadir una rep antes de subir carga.`,
        reasoning_en: `High RIR (${avgRir.toFixed(1)}). Keep weight and try adding a rep before increasing load.`,
        confidence: 'low'
      }
    } else {
      rec = {
        exercise_id: se.exercise_id,
        exercise_name: se.exercises?.name || '',
        action_type: 'maintain',
        prev_weight_kg: maxWeight,
        new_weight_kg: maxWeight,
        prev_reps_target: Math.round(avgReps),
        new_reps_target: Math.round(avgReps),
        reasoning_es: `RIR ideal (${avgRir.toFixed(1)}). Mantén carga y reps. Consistencia = progresión.`,
        reasoning_en: `Ideal RIR (${avgRir.toFixed(1)}). Maintain load and reps. Consistency = progression.`,
        confidence: 'high'
      }
    }

    if (rec) {
      await (supabase as any)
        .from('progression_log')
        .insert({
          athlete_id: profile.id,
          exercise_id: se.exercise_id,
          session_id,
          action_type: rec.action_type,
          prev_weight_kg: rec.prev_weight_kg,
          new_weight_kg: rec.new_weight_kg,
          prev_reps_target: rec.prev_reps_target,
          new_reps_target: rec.new_reps_target,
          reasoning_es: rec.reasoning_es,
          reasoning_en: rec.reasoning_en,
          trigger_data: { avg_rir: avgRir, set_count: setCount, avg_reps: avgReps }
        })

      recommendations.push(rec)
    }
  }

  return NextResponse.json({
    success: true,
    session_id,
    recommendations
  })
}

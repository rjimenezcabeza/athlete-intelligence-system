import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: template } = await (supabase as any)
      .from('training_templates')
      .select(`
        id, name, description, training_days_per_week, split_type,
        mesocycle_weeks, difficulty_level, split_description, target_muscle_groups, is_system,
        template_exercises(
          id, day_number, day_label, order_in_day,
          sets_target, rep_range_min, rep_range_max, rir_target, rest_seconds,
          exercises(id, name, muscle_group_primary, equipment)
        )
      `)
      .eq('id', id)
      .single()

    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const days: Record<number, { label: string; exercises: unknown[] }> = {}
    for (const te of (template.template_exercises || [])) {
      if (!days[te.day_number]) {
        days[te.day_number] = { label: te.day_label || `Dia ${te.day_number}`, exercises: [] }
      }
      days[te.day_number].exercises.push({
        id: te.exercises?.id,
        name: te.exercises?.name,
        muscleGroup: te.exercises?.muscle_group_primary,
        equipment: te.exercises?.equipment,
        sets: te.sets_target,
        repMin: te.rep_range_min,
        repMax: te.rep_range_max,
        rir: te.rir_target,
        rest: te.rest_seconds,
        order: te.order_in_day
      })
    }

    for (const day of Object.values(days)) {
      day.exercises.sort((a: any, b: any) => a.order - b.order)
    }

    const totalExercises = template.template_exercises?.length || 0

    return NextResponse.json({
      template: {
        ...template,
        days: Object.entries(days)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([dayNum, data]) => ({ dayNumber: Number(dayNum), ...data })),
        totalExercises,
        template_exercises: undefined
      }
    })
  } catch (error) {
    console.error('[templates/id]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

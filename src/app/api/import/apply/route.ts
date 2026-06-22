import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function adminDb() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll() { return store.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supa.auth.getUser()
  return user
}

function fuzzyMatchExercise(importedName: string, exercises: any[]): any | null {
  const normalized = (s: string) => s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()

  const target = normalized(importedName)
  let best: any = null
  let bestScore = 0

  for (const ex of exercises) {
    const candidate = normalized(ex.name)
    const targetWords = target.split(/\s+/)
    const candidateWords = candidate.split(/\s+/)
    const common = targetWords.filter(w => candidateWords.some(c => c.includes(w) || w.includes(c))).length
    const score = common / Math.max(targetWords.length, candidateWords.length)
    if (score > bestScore && score > 0.4) {
      bestScore = score
      best = { ...ex, confidence: score }
    }
  }
  return best
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { importId, applyProfile, applyNutrition, applyProgram, applySessions } = body

    if (!importId) return NextResponse.json({ error: 'Missing importId' }, { status: 400 })

    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: importedFile } = await (admin as any)
      .from('imported_files')
      .select('extracted_data, import_status')
      .eq('id', importId)
      .eq('athlete_id', profile.id)
      .single()

    if (!importedFile?.extracted_data) {
      return NextResponse.json({ error: 'No extracted data found' }, { status: 404 })
    }

    const data = importedFile.extracted_data
    const results: Record<string, string> = {}

    // 1. Aplicar perfil del atleta
    if (applyProfile && data.athlete) {
      const profileUpdates: Record<string, any> = {}
      if (data.athlete.body_weight_kg) profileUpdates.body_weight_kg = data.athlete.body_weight_kg
      if (data.athlete.height_cm) profileUpdates.height_cm = data.athlete.height_cm
      if (data.athlete.training_experience_years) profileUpdates.training_experience_years = data.athlete.training_experience_years
      if (data.athlete.primary_goal) profileUpdates.primary_goal = data.athlete.primary_goal
      if (data.training_program?.split_type) profileUpdates.training_split_detected = data.training_program.split_type
      if (data.training_program?.days_per_week) profileUpdates.training_days_detected = data.training_program.days_per_week
      profileUpdates.import_onboarded_at = new Date().toISOString()

      await (admin as any).from('athlete_profiles').update(profileUpdates).eq('id', profile.id)
      results.profile = 'applied'
    }

    // 2. Aplicar nutricion
    if (applyNutrition && data.nutrition) {
      const nutUpdates: Record<string, any> = {}
      if (data.nutrition.calories_target) nutUpdates.nutrition_calories_target = data.nutrition.calories_target
      if (data.nutrition.protein_g) nutUpdates.nutrition_protein_g = data.nutrition.protein_g
      if (data.nutrition.carbs_g) nutUpdates.nutrition_carbs_g = data.nutrition.carbs_g
      if (data.nutrition.fat_g) nutUpdates.nutrition_fat_g = data.nutrition.fat_g
      if (data.nutrition.meals_per_day) nutUpdates.nutrition_meals_per_day = data.nutrition.meals_per_day
      if (data.nutrition.notes) nutUpdates.nutrition_notes = data.nutrition.notes

      if (Object.keys(nutUpdates).length > 0) {
        await (admin as any).from('athlete_profiles').update(nutUpdates).eq('id', profile.id)
        results.nutrition = 'applied'
      }
    }

    // 3. Crear template de entrenamiento
    if (applyProgram && data.training_program?.days?.length) {
      const prog = data.training_program

      // Cargar ejercicios de la DB para fuzzy match
      const { data: dbExercises } = await (admin as any)
        .from('exercises').select('id, name').eq('is_global', true)

      const { data: template } = await (admin as any)
        .from('training_templates')
        .insert({
          athlete_id: profile.id,
          name: prog.name || `Programa Importado ${new Date().toLocaleDateString('es')}`,
          description: `Importado automáticamente. Split: ${prog.split_type || 'Custom'}`,
          training_days_per_week: prog.days_per_week || prog.days.length,
          split_type: prog.split_type || 'Custom',
          mesocycle_weeks: prog.mesocycle_weeks || 6,
          is_active: true,
          imported_from_file_id: importId
        })
        .select()
        .single()

      if (template) {
        const templateExercises: any[] = []
        for (const day of prog.days) {
          for (let i = 0; i < (day.exercises || []).length; i++) {
            const ex = day.exercises[i]
            const matched = fuzzyMatchExercise(ex.name, dbExercises || [])
            if (matched?.id) {
              templateExercises.push({
                template_id: template.id,
                exercise_id: matched.id,
                day_number: day.day_number,
                day_label: day.day_label,
                order_in_day: i + 1,
                sets_target: ex.sets || 3,
                rep_range_min: ex.rep_range_min || 8,
                rep_range_max: ex.rep_range_max || 12,
                rir_target: ex.rir_target ?? 2,
                rest_seconds: ex.rest_seconds || 120,
                notes: ex.notes || null
              })
            }
          }
        }

        if (templateExercises.length > 0) {
          await (admin as any).from('template_exercises').insert(templateExercises)
        }

        results.program = `template_created:${template.id}:${templateExercises.length}_exercises`
      }
    }

    // 4. Importar sesiones historicas
    if (applySessions && data.training_sessions?.length) {
      const { data: dbExercises } = await (admin as any)
        .from('exercises').select('id, name').eq('is_global', true)
      let sessionsCreated = 0

      for (const sessionData of data.training_sessions) {
        if (!sessionData.date) continue

        const { data: session } = await (admin as any)
          .from('training_sessions')
          .insert({
            athlete_id: profile.id,
            session_date: sessionData.date,
            source: 'imported',
            imported_from_file_id: importId,
            status: 'completed'
          })
          .select()
          .single()

        if (!session) continue
        sessionsCreated++

        for (let ei = 0; ei < (sessionData.exercises || []).length; ei++) {
          const exData = sessionData.exercises[ei]
          const matched = fuzzyMatchExercise(exData.name || '', dbExercises || [])
          if (!matched?.id) continue

          const { data: sessionExercise } = await (admin as any)
            .from('session_exercises')
            .insert({ session_id: session.id, exercise_id: matched.id, order_in_session: ei + 1 })
            .select()
            .single()

          if (!sessionExercise) continue

          const setsToInsert = (exData.sets || []).map((s: any, i: number) => ({
            session_exercise_id: sessionExercise.id,
            set_number: s.set_number ?? (i + 1),
            set_type: s.set_type ?? 'working',
            weight_kg: s.weight_kg ?? null,
            reps_completed: s.reps ?? s.reps_completed ?? null,
            rir_actual: s.rir ?? s.rir_actual ?? null
          }))

          if (setsToInsert.length > 0) {
            await (admin as any).from('sets').insert(setsToInsert)
          }
        }
      }
      results.sessions = `${sessionsCreated}_sessions_imported`
    }

    // Marcar como aprobado + import_onboarded_at si no se aplico perfil explicitamente
    await (admin as any)
      .from('imported_files')
      .update({ import_status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', importId)

    if (!applyProfile) {
      await (admin as any)
        .from('athlete_profiles')
        .update({ import_onboarded_at: new Date().toISOString() })
        .eq('id', profile.id)
    }

    return NextResponse.json({ ok: true, results })
  } catch (error) {
    console.error('[import/apply]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

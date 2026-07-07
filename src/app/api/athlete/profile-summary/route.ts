import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id, display_name, body_weight_kg, height_cm, date_of_birth, gender, training_experience_years, primary_goal, avatar_url')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const [sessionsResult, latestImportResult, lastSessionResult, prResult, recentSessionsResult] = await Promise.all([
      (supabase as any)
        .from('training_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', profile.id),
      (supabase as any)
        .from('imported_files')
        .select('id, original_filename, extraction_confidence, extracted_data, uploaded_at, import_status')
        .eq('athlete_id', profile.id)
        .in('import_status', ['approved', 'review_required'])
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      (supabase as any)
        .from('training_sessions')
        .select('session_date')
        .eq('athlete_id', profile.id)
        .order('session_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      (supabase as any)
        .from('exercise_history')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', profile.id)
        .not('pr_set_id', 'is', null),
      // Last 16 weeks of sessions for streak calc
      (supabase as any)
        .from('training_sessions')
        .select('session_date')
        .eq('athlete_id', profile.id)
        .gte('session_date', new Date(Date.now() - 16 * 7 * 86400 * 1000).toISOString().split('T')[0])
        .order('session_date', { ascending: false })
    ])

    // Compute weekly streak
    const getWeekKey = (dateStr: string) => {
      const d = new Date(dateStr + 'T12:00:00Z')
      const mon = new Date(d)
      mon.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
      return mon.toISOString().split('T')[0]
    }
    const sessionWeeks = new Set((recentSessionsResult.data ?? []).map((s: any) => getWeekKey(s.session_date)))
    let currentStreak = 0
    const today = new Date()
    const mon = new Date(today)
    mon.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
    while (true) {
      const wk = mon.toISOString().split('T')[0]
      if (!sessionWeeks.has(wk)) break
      currentStreak++
      mon.setUTCDate(mon.getUTCDate() - 7)
    }

    const latestImport = latestImportResult.data
    const ed = latestImport?.extracted_data

    // Support both old schema (ed.nutrition) and new split schema
    const rawNut = ed?.nutrition_training_day ?? ed?.nutrition ?? null
    const rawNutRest = ed?.nutrition_rest_day ?? null

    const nutrition = rawNut ? {
      caloriesTarget: rawNut.calories ?? rawNut.calories_target ?? null,
      proteinG: rawNut.protein_g ?? null,
      carbsG: rawNut.carbs_g ?? null,
      fatG: rawNut.fat_g ?? null,
      fiberG: rawNut.fiber_g ?? null,
      waterMl: rawNut.water_ml ?? null,
      mealsPerDay: rawNut.meals_per_day ?? null,
      nutritionNotes: rawNut.notes ?? null
    } : {
      caloriesTarget: null, proteinG: null, carbsG: null,
      fatG: null, fiberG: null, waterMl: null, mealsPerDay: null, nutritionNotes: null
    }

    const nutritionRestDay = rawNutRest ? {
      caloriesTarget: rawNutRest.calories ?? rawNutRest.calories_target ?? null,
      proteinG: rawNutRest.protein_g ?? null,
      carbsG: rawNutRest.carbs_g ?? null,
      fatG: rawNutRest.fat_g ?? null,
      fiberG: rawNutRest.fiber_g ?? null,
      waterMl: rawNutRest.water_ml ?? null,
      mealsPerDay: rawNutRest.meals_per_day ?? null,
      nutritionNotes: rawNutRest.notes ?? null
    } : null

    const supplements: any[] = ed?.supplements ?? []
    const nutritionNotes: string | null = ed?.nutrition_notes ?? null

    // Extra athlete metrics from extracted data
    const edAthlete = ed?.athlete ?? {}
    const athleteMetrics = {
      bodyFatPct: edAthlete.body_fat_pct ?? null,
      leanMassKg: edAthlete.lean_mass_kg ?? null,
      competitionCategory: edAthlete.competition_category ?? null,
      waistCm: edAthlete.waist_cm ?? null,
      chestCm: edAthlete.chest_cm ?? null,
      armCm: edAthlete.arm_cm ?? null,
      thighCm: edAthlete.thigh_cm ?? null,
      hipCm: edAthlete.hip_cm ?? null,
      calfCm: edAthlete.calf_cm ?? null,
    }

    const splitDetected = ed?.training_program?.split_type ?? null
    const trainingDays = ed?.training_program?.days_per_week ?? null

    return NextResponse.json({
      profile: {
        displayName: profile.display_name,
        bodyWeightKg: profile.body_weight_kg ? Number(profile.body_weight_kg) : null,
        heightCm: profile.height_cm ? Number(profile.height_cm) : null,
        dateOfBirth: profile.date_of_birth ?? null,
        gender: profile.gender ?? null,
        trainingExperienceYears: profile.training_experience_years,
        primaryGoal: profile.primary_goal,
        trainingDaysDetected: trainingDays,
        trainingSplitDetected: splitDetected,
        avatarUrl: profile.avatar_url
      },
      nutrition,
      nutritionRestDay,
      supplements,
      nutritionNotes,
      athleteMetrics,
      stats: {
        totalSessions: sessionsResult.count || 0,
        totalPRs: prResult.count || 0,
        currentStreak,
        activeMesocycle: null,
        lastSessionDate: lastSessionResult.data?.session_date || null
      },
      latestImport: latestImport ? {
        id: latestImport.id,
        filename: latestImport.original_filename,
        confidence: latestImport.extraction_confidence,
        extractedData: ed,
        uploadedAt: latestImport.uploaded_at,
        status: latestImport.import_status
      } : null
    })
  } catch (error) {
    console.error('[athlete/profile-summary]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

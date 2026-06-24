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
      .select('id, display_name, body_weight_kg, training_experience_years, primary_goal, avatar_url')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const [sessionsResult, latestImportResult, lastSessionResult] = await Promise.all([
      (supabase as any)
        .from('training_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', profile.id),
      (supabase as any)
        .from('imported_files')
        .select('id, original_filename, extraction_confidence, extracted_data, uploaded_at')
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
        .maybeSingle()
    ])

    const latestImport = latestImportResult.data
    const ed = latestImport?.extracted_data

    const nutrition = ed?.nutrition ? {
      caloriesTarget: ed.nutrition.calories_target ?? null,
      proteinG: ed.nutrition.protein_g ?? null,
      carbsG: ed.nutrition.carbs_g ?? null,
      fatG: ed.nutrition.fat_g ?? null,
      mealsPerDay: ed.nutrition.meals_per_day ?? null,
      nutritionNotes: ed.nutrition.notes ?? null
    } : {
      caloriesTarget: null, proteinG: null, carbsG: null,
      fatG: null, mealsPerDay: null, nutritionNotes: null
    }

    const splitDetected = ed?.training_program?.split_type ?? null
    const trainingDays = ed?.training_program?.days_per_week ?? null

    return NextResponse.json({
      profile: {
        displayName: profile.display_name,
        bodyWeightKg: profile.body_weight_kg ? Number(profile.body_weight_kg) : null,
        trainingExperienceYears: profile.training_experience_years,
        primaryGoal: profile.primary_goal,
        trainingDaysDetected: trainingDays,
        trainingSplitDetected: splitDetected,
        avatarUrl: profile.avatar_url
      },
      nutrition,
      stats: {
        totalSessions: sessionsResult.count || 0,
        totalPRs: 0,
        activeMesocycle: null,
        lastSessionDate: lastSessionResult.data?.session_date || null
      },
      latestImport: latestImport ? {
        id: latestImport.id,
        filename: latestImport.original_filename,
        confidence: latestImport.extraction_confidence,
        extractedData: ed,
        uploadedAt: latestImport.uploaded_at
      } : null
    })
  } catch (error) {
    console.error('[athlete/profile-summary]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

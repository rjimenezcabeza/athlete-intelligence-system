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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .select('id, import_status, extracted_data, extraction_confidence, extraction_notes, original_filename')
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .single()

    if (!importedFile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ed = importedFile.extracted_data
    const summary = ed ? {
      athleteName: ed.athlete?.display_name ?? null,
      splitDetected: ed.training_program?.split_type ?? null,
      daysPerWeek: ed.training_program?.days_per_week ?? null,
      sessionsCount: ed.training_sessions?.length ?? 0,
      exercisesInProgram: (ed.training_program?.days ?? [])
        .reduce((sum: number, d: any) => sum + (d.exercises?.length ?? 0), 0),
      calories: ed.nutrition?.calories_target ?? null,
      protein: ed.nutrition?.protein_g ?? null,
      hasProfile: !!(ed.athlete),
      hasNutrition: !!(ed.nutrition?.calories_target),
      hasProgram: !!(ed.training_program?.days?.length),
      hasSessions: (ed.training_sessions?.length ?? 0) > 0
    } : null

    return NextResponse.json({
      id: importedFile.id,
      status: importedFile.import_status,
      confidence: importedFile.extraction_confidence,
      filename: importedFile.original_filename,
      summary
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

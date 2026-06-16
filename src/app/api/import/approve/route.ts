import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createDb() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      }
    }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createDb()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { importId, reviewItemIds } = await req.json()
    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: items } = await (supabase as any)
      .from('import_review_items')
      .select('*')
      .eq('imported_file_id', importId)
      .in('id', reviewItemIds || [])

    if (!items || items.length === 0) return NextResponse.json({ error: 'No items to approve' }, { status: 400 })

    let sessionsCreated = 0

    for (const item of items) {
      if (item.item_type !== 'session') continue
      const sessionData = item.corrected_data ?? item.raw_extracted

      const { data: session, error: sessionError } = await (supabase as any)
        .from('training_sessions')
        .insert({
          athlete_id: profile.id,
          session_date: sessionData.date ?? new Date().toISOString().split('T')[0],
          status: 'completed',
          notes: sessionData.notes ?? null,
          source: 'imported',
          imported_from_file_id: importId
        })
        .select('id').single()

      if (sessionError) continue

      for (const exercise of (sessionData.exercises || [])) {
        const { data: ex } = await (supabase as any)
          .from('exercises')
          .select('id')
          .ilike('name', `%${exercise.name.split(' ')[0]}%`)
          .limit(1)
          .single()

        if (!ex) continue

        const { data: sessionEx } = await (supabase as any)
          .from('session_exercises')
          .insert({
            session_id: session.id,
            exercise_id: ex.id,
            order_in_session: (sessionData.exercises || []).indexOf(exercise) + 1
          })
          .select('id').single()

        if (!sessionEx) continue

        for (const set of (exercise.sets || [])) {
          await (supabase as any).from('sets').insert({
            session_exercise_id: sessionEx.id,
            set_number: set.set_number ?? 1,
            set_type: set.set_type ?? 'working',
            weight_kg: set.weight_kg ?? null,
            reps_completed: set.reps ?? null,
            rir_actual: set.rir ?? null
          })
        }
      }

      await (supabase as any)
        .from('import_review_items')
        .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', item.id)

      sessionsCreated++
    }

    await (supabase as any)
      .from('imported_files')
      .update({ import_status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', importId)

    return NextResponse.json({ success: true, sessionsCreated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

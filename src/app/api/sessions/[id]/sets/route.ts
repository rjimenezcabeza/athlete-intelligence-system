import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params
    void sessionId
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      session_exercise_id,
      set_number,
      set_type,
      weight_kg,
      reps_completed,
      rir_actual,
      rpe_actual,
      notes,
    } = body

    if (!session_exercise_id || !set_number) {
      return NextResponse.json({ error: 'session_exercise_id and set_number required' }, { status: 400 })
    }

    const { data: set, error } = await (supabase as any)
      .from('sets')
      .insert({
        session_exercise_id,
        set_number,
        set_type: set_type || 'working',
        weight_kg: weight_kg ?? null,
        reps_completed: reps_completed ?? null,
        rir_actual: rir_actual ?? null,
        rpe_actual: rpe_actual ?? null,
        notes: notes || null,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ set }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface FeedbackBody {
  pump_rating?: number
  local_fatigue?: number
  perceived_recovery?: number
  rir_session_avg?: number
}

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await makeSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body: FeedbackBody = await req.json()
    const { pump_rating, local_fatigue, perceived_recovery, rir_session_avg } = body

    if (pump_rating !== undefined && (pump_rating < 1 || pump_rating > 5)) {
      return NextResponse.json({ error: 'pump_rating must be 1-5' }, { status: 400 })
    }
    if (local_fatigue !== undefined && (local_fatigue < 1 || local_fatigue > 5)) {
      return NextResponse.json({ error: 'local_fatigue must be 1-5' }, { status: 400 })
    }
    if (perceived_recovery !== undefined && (perceived_recovery < 1 || perceived_recovery > 5)) {
      return NextResponse.json({ error: 'perceived_recovery must be 1-5' }, { status: 400 })
    }
    if (rir_session_avg !== undefined && (rir_session_avg < 0 || rir_session_avg > 10)) {
      return NextResponse.json({ error: 'rir_session_avg must be 0-10' }, { status: 400 })
    }

    const allFieldsPresent =
      pump_rating !== undefined &&
      local_fatigue !== undefined &&
      perceived_recovery !== undefined &&
      rir_session_avg !== undefined

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (pump_rating !== undefined) updateData.pump_rating = pump_rating
    if (local_fatigue !== undefined) updateData.local_fatigue = local_fatigue
    if (perceived_recovery !== undefined) updateData.perceived_recovery = perceived_recovery
    if (rir_session_avg !== undefined) updateData.rir_session_avg = rir_session_avg
    if (allFieldsPresent) {
      updateData.status = 'completed'
      updateData.feedback_completed_at = new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('training_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .select('id, status, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, feedback_completed_at')
      .single()

    if (error) {
      console.error('[feedback POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, session: data, completed: allFieldsPresent })
  } catch (err: unknown) {
    console.error('[feedback POST] unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void req
  try {
    const { id } = await params
    const supabase = await makeSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data, error } = await (supabase as any)
      .from('training_sessions')
      .select('id, status, pump_rating, local_fatigue, perceived_recovery, rir_session_avg, feedback_completed_at')
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ session: data })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createServerSideClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '20')
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`*, session_exercises(*, exercise:exercises(name, muscle_group_primary), sets(*))`)
    .eq('athlete_id', profile.id)
    .order('session_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('athlete_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await supabase.from('training_sessions').insert({
    athlete_id: profile.id,
    template_id: body.templateId ?? null,
    session_date: body.sessionDate ?? new Date().toISOString().split('T')[0],
    day_number: body.dayNumber ?? null,
    day_label: body.dayLabel ?? null,
    started_at: new Date().toISOString(),
    source: 'manual',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

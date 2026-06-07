import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSideClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { templateDayId } = await req.json()

  const { data: session, error } = await (supabase as any)
    .from('training_sessions')
    .insert({
      athlete_id: profile.id,
      template_id: templateDayId ?? null,
      session_date: new Date().toISOString().split('T')[0],
      started_at: new Date().toISOString(),
      source: 'manual',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessionId: session.id })
}

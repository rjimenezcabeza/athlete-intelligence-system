import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const getUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const getSvcKey = () => (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

async function getUser() {
  const store = await cookies()
  const supa = createServerClient(getUrl(), getSvcKey(), {
    cookies: { getAll() { return store.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supa.auth.getUser()
  return user
}

function db() { return createClient(getUrl(), getSvcKey()) }

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = db()
    const { data: profile } = await admin.from('athlete_profiles')
      .select('id,display_name,primary_goal,training_experience_years').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    const body = await request.json().catch(() => ({}))
    const { data: sessions } = await admin.from('training_sessions')
      .select('session_date,pump_rating,local_fatigue,perceived_recovery').eq('athlete_id', profile.id)
      .eq('status', 'completed').order('session_date', { ascending: false }).limit(10)
    const apiKey = (process.env.ANTHROPIC_API_KEY ?? '').trim()
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 500,
        system: 'Eres el AI Coach de AIS. Atleta: ' + profile.display_name + ', objetivo: ' + (profile.primary_goal ?? 'hipertrofia') + '. Responde en espanol, conciso.',
        messages: [{ role: 'user', content: body.question ?? 'Dame un resumen de mi progreso' }]
      })
    })
    const aiData = await res.json()
    return NextResponse.json({ response: aiData.content?.[0]?.text ?? '' })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

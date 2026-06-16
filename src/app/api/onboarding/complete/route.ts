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

    const { display_name, training_experience_years, primary_goal, body_weight_kg, weight_unit, language } = await req.json()

    if (!display_name || display_name.trim().length < 2) {
      return NextResponse.json({ error: 'display_name required' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('athlete_profiles')
      .upsert({
        user_id: user.id,
        display_name: display_name.trim(),
        training_experience_years: training_experience_years ? parseInt(training_experience_years) : null,
        primary_goal: primary_goal ?? 'hypertrophy',
        body_weight_kg: body_weight_kg ? parseFloat(body_weight_kg) : null,
        weight_unit: weight_unit ?? 'kg',
        language: language ?? 'es',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, profile: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

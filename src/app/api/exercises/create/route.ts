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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, muscle_group_primary, equipment, movement_pattern, is_bilateral = true, difficulty_level = 2, description } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    if (!muscle_group_primary?.trim()) return NextResponse.json({ error: 'Muscle group required' }, { status: 400 })

    const admin = adminDb()

    // Create slug from name
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data: exercise, error } = await (admin as any)
      .from('exercises')
      .insert({
        name: name.trim(),
        slug: slug + '-custom-' + Date.now(),
        muscle_group_primary: muscle_group_primary.trim(),
        muscle_groups_secondary: [],
        equipment: equipment?.trim() || null,
        movement_pattern: movement_pattern || null,
        exercise_type: 'strength',
        is_bilateral,
        difficulty_level,
        description: description?.trim() || null,
        is_global: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ exercise })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

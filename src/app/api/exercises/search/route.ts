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

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = req.nextUrl.searchParams.get('q') ?? ''
    const admin = adminDb()

    let query = (admin as any)
      .from('exercises')
      .select('id, name, muscle_group_primary, equipment, slug')
      .eq('is_global', true)
      .order('name')

    if (q.length > 0) {
      query = query.ilike('name', '%' + q + '%')
    }

    const { data } = await query.limit(200)

    return NextResponse.json({ exercises: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

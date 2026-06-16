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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createDb()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const importId = req.nextUrl.searchParams.get('importId')
    if (!importId) return NextResponse.json({ error: 'importId required' }, { status: 400 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: importRecord } = await (supabase as any)
      .from('imported_files').select('id').eq('id', importId).eq('athlete_id', profile.id).single()
    if (!importRecord) return NextResponse.json({ error: 'Import not found' }, { status: 404 })

    const { data: items } = await (supabase as any)
      .from('import_review_items')
      .select('*')
      .eq('imported_file_id', importId)
      .eq('review_status', 'pending')
      .order('created_at')

    return NextResponse.json({ items: items || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

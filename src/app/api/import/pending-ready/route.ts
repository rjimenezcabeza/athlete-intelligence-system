import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ files: [] })

    const { data: files } = await (supabase as any)
      .from('imported_files')
      .select('id, original_filename, file_type, file_size_bytes, uploaded_at')
      .eq('athlete_id', profile.id)
      .eq('import_status', 'pending')
      .not('file_size_bytes', 'is', null)
      .gt('file_size_bytes', 0)
      .order('uploaded_at', { ascending: false })

    return NextResponse.json({ files: files || [] })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

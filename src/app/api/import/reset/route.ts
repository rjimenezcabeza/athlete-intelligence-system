import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { importedFileId, importId } = body
    const fileId = importedFileId || importId

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

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Reset specific file if provided, otherwise reset all stuck 'processing' files
    const query = (supabase as any)
      .from('imported_files')
      .update({ import_status: 'pending', extraction_notes: null })
      .eq('athlete_id', profile.id)
      .eq('import_status', 'processing')

    if (fileId) {
      query.eq('id', fileId)
    }

    await query

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[import/reset]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

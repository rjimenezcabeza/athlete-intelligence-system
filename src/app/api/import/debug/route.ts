import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('id')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: buckets } = await (supabase as any).storage.listBuckets()
  const bucketNames = (buckets ?? []).map((b: any) => b.name)

  let storageFiles: any[] = []
  if (bucketNames.includes('imports')) {
    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (profile) {
      const { data: files } = await (supabase as any)
        .storage.from('imports').list(profile.id, { limit: 20 })
      storageFiles = files ?? []
    }
  }

  let dbFile = null
  if (fileId) {
    const { data } = await (supabase as any)
      .from('imported_files').select('*').eq('id', fileId).single()
    dbFile = data
  }

  return NextResponse.json({ buckets: bucketNames, storageFiles, dbFile })
}

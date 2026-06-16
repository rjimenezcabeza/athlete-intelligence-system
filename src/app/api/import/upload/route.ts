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

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/heic': 'image',
  'application/pdf': 'pdf', 'text/plain': 'text', 'text/csv': 'text',
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createDb()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id, subscription_tier').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Limite free tier: 3 importaciones por mes
    if (profile.subscription_tier === 'free') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await (supabase as any)
        .from('imported_files')
        .select('*', { count: 'exact', head: true })
        .eq('athlete_id', profile.id)
        .gte('uploaded_at', startOfMonth.toISOString())

      if ((count ?? 0) >= 3) {
        return NextResponse.json({
          error: 'LIMIT_REACHED',
          message: 'Free plan: 3 imports/month. Upgrade to Pro for unlimited.',
          upgrade_url: '/upgrade'
        }, { status: 403 })
      }
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    if (file.size > 52428800) return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'bin'
    const storagePath = `${user.id}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: storageError } = await (supabase as any).storage
      .from('imports')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })
    if (storageError) throw storageError

    const { data: importRecord, error: dbError } = await (supabase as any)
      .from('imported_files')
      .insert({
        athlete_id: profile.id,
        original_filename: file.name,
        file_type: fileType,
        storage_path: storagePath,
        file_size_bytes: file.size,
        import_status: 'pending'
      })
      .select().single()
    if (dbError) throw dbError

    return NextResponse.json({ success: true, importId: importRecord.id, fileType })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

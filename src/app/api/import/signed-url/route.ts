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
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { filename, contentType, fileSize } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename y contentType requeridos' }, { status: 400 })
    }

    const fileType = ALLOWED_TYPES[contentType as string]
    if (!fileType) {
      return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 })
    }
    if (fileSize > 52428800) {
      return NextResponse.json({ error: 'Archivo demasiado grande (max 50MB)' }, { status: 400 })
    }

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    if (profile.subscription_tier === 'free') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
      const { count } = await (admin as any)
        .from('imported_files')
        .select('*', { count: 'exact', head: true })
        .eq('athlete_id', profile.id)
        .gte('uploaded_at', startOfMonth.toISOString())
      if ((count ?? 0) >= 3) {
        return NextResponse.json({
          error: 'LIMIT_REACHED',
          message: 'Plan gratuito: 3 importaciones/mes. Actualiza a Pro.',
          upgrade_url: '/upgrade'
        }, { status: 403 })
      }
    }

    const ext = (filename as string).split('.').pop() ?? 'bin'
    const storagePath = `${user.id}/${Date.now()}.${ext}`

    const { data: signedData, error: signedError } = await (admin as any).storage
      .from('imports')
      .createSignedUploadUrl(storagePath)
    if (signedError) throw signedError

    const { data: importRecord, error: dbError } = await (admin as any)
      .from('imported_files')
      .insert({
        athlete_id: profile.id,
        original_filename: filename,
        file_type: fileType,
        storage_path: storagePath,
        file_size_bytes: fileSize,
        import_status: 'pending'
      })
      .select('id')
      .single()
    if (dbError) throw dbError

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      storagePath,
      importId: importRecord.id,
      fileType
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

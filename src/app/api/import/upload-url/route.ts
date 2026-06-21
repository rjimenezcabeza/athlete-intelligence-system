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

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg','jpeg','png','webp','gif','heic'].includes(ext)) return 'image'
  if (['xlsx','xls','xlsm','xlsb'].includes(ext)) return 'excel'
  if (ext === 'pdf') return 'pdf'
  return 'text'
}

export async function POST(req: NextRequest) {
  try {
    const store = await cookies()
    const supa = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll() { return store.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminDb()
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body = await req.json()
    const filename = String(body.filename ?? 'file')
    const fileType = getFileType(filename)
    const storagePath = profile.id + '/' + Date.now() + '_' + filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Crear registro en DB primero
    const { data: importRecord, error: dbErr } = await (admin as any)
      .from('imported_files')
      .insert({
        athlete_id: profile.id,
        original_filename: filename,
        storage_path: storagePath,
        file_type: fileType,
        import_status: 'pending',
        uploaded_at: new Date().toISOString()
      })
      .select('id').single()
    if (dbErr) throw new Error(dbErr.message)

    // Generar signed URL para subida directa desde el cliente (5 minutos)
    const { data: uploadData, error: urlErr } = await (admin as any).storage
      .from('imports')
      .createSignedUploadUrl(storagePath)
    if (urlErr) throw new Error(urlErr.message)

    return NextResponse.json({
      importId: importRecord.id,
      uploadUrl: uploadData.signedUrl,
      token: uploadData.token,
      storagePath
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

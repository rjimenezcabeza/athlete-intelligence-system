import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filename, contentType, fileSizeBytes, fileSize } = body

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Check monthly limit for free tier
    if (profile.subscription_tier === 'free') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
      const { count } = await (supabase as any)
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

    // Auto-create bucket if it doesn't exist
    const { data: buckets } = await (supabase as any).storage.listBuckets()
    const bucketExists = buckets?.some((b: any) => b.name === 'imports')
    if (!bucketExists) {
      await (supabase as any).storage.createBucket('imports', {
        public: false,
        fileSizeLimit: 52428800
      })
    }

    // Detect file type
    const ext = (filename as string).split('.').pop()?.toLowerCase() ?? 'bin'
    let fileType = 'other'
    if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'].includes(ext)) fileType = 'excel'
    else if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) fileType = 'image'
    else if (ext === 'pdf') fileType = 'pdf'
    else if (['doc', 'docx'].includes(ext)) fileType = 'word'
    else if (['txt'].includes(ext)) fileType = 'text'

    // Path inside the bucket (relative, no bucket prefix)
    const safeName = (filename as string).replace(/[^a-zA-Z0-9._\-]/g, '_')
    const storagePath = `${profile.id}/${Date.now()}_${safeName}`

    // Create DB record before upload
    const { data: importedFile, error: dbError } = await (supabase as any)
      .from('imported_files')
      .insert({
        athlete_id: profile.id,
        original_filename: filename,
        file_type: fileType,
        storage_path: storagePath,
        file_size_bytes: fileSizeBytes ?? fileSize ?? null,
        import_status: 'pending'
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Generate signed upload URL
    const { data: signedData, error: signedError } = await (supabase as any)
      .storage
      .from('imports')
      .createSignedUploadUrl(storagePath)

    if (signedError) throw signedError

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      storagePath,
      importedFileId: importedFile.id,
      importId: importedFile.id,
      fileType
    })
  } catch (error) {
    console.error('[import/signed-url]', error)
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 })
  }
}

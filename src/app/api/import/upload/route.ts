import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const maxDuration = 10

export async function POST(request: Request) {
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

    // Parse FormData with error handling
    let file: File | null = null
    let filename = 'import'
    let contentType = 'application/octet-stream'
    let fileSize = 0
    let buffer: Buffer

    try {
      const formData = await request.formData()
      file = formData.get('file') as File
      if (file) {
        filename = file.name
        contentType = file.type || 'application/octet-stream'
        fileSize = file.size
        const arrayBuffer = await file.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
      } else {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
    } catch (formErr) {
      console.error('[upload] FormData parse error:', formErr)
      return NextResponse.json({ error: 'Could not parse file upload', details: String(formErr) }, { status: 400 })
    }

    if (!buffer! || buffer.byteLength === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    if (buffer.byteLength > 4 * 1024 * 1024) {
      return NextResponse.json({
        error: 'FILE_TOO_LARGE',
        message: 'El archivo supera el límite de 4MB'
      }, { status: 413 })
    }

    // Auto-create bucket if needed
    const { data: buckets } = await (supabase as any).storage.listBuckets()
    if (!buckets?.some((b: any) => b.name === 'imports')) {
      await (supabase as any).storage.createBucket('imports', {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024
      })
    }

    // Detect file type from extension (more reliable than MIME in browser)
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    let fileType = 'other'
    if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'].includes(ext)) fileType = 'excel'
    else if (['jpg', 'jpeg', 'heic', 'heif'].includes(ext)) fileType = 'image/jpeg'
    else if (ext === 'png') fileType = 'image/png'
    else if (ext === 'webp') fileType = 'image/webp'
    else if (ext === 'gif') fileType = 'image/gif'
    else if (ext === 'pdf') fileType = 'application/pdf'
    else if (['doc', 'docx'].includes(ext)) fileType = 'word'
    else if (ext === 'txt') fileType = 'text'
    else if (contentType.startsWith('image/')) fileType = contentType

    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 100)
    const storagePath = `${profile.id}/${Date.now()}_${safeName}`

    console.log('[upload] Uploading:', { path: storagePath, size: buffer.byteLength, type: contentType, ext })

    const { error: uploadError } = await (supabase as any)
      .storage
      .from('imports')
      .upload(storagePath, buffer, {
        contentType: contentType,
        upsert: false,
        duplex: 'half'
      })

    if (uploadError) {
      console.error('[upload] Storage error:', JSON.stringify(uploadError))
      return NextResponse.json({
        error: 'Storage upload failed',
        details: uploadError.message,
        hint: uploadError.statusCode === '413' ? 'File too large for storage' : undefined
      }, { status: 500 })
    }

    const { data: importedFile, error: dbError } = await (supabase as any)
      .from('imported_files')
      .insert({
        athlete_id: profile.id,
        original_filename: filename,
        file_type: fileType,
        storage_path: storagePath,
        file_size_bytes: buffer.byteLength,
        import_status: 'pending'
      })
      .select('id, original_filename, storage_path, file_size_bytes')
      .single()

    if (dbError) {
      console.error('[upload] DB error:', JSON.stringify(dbError))
      throw dbError
    }

    console.log('[upload] Success:', importedFile.id, 'size:', buffer.byteLength)

    return NextResponse.json({
      ok: true,
      importedFileId: importedFile.id,
      importId: importedFile.id,
      storagePath,
      fileSizeBytes: buffer.byteLength,
      filename
    })
  } catch (error) {
    console.error('[import/upload] fatal error:', error)
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 })
  }
}

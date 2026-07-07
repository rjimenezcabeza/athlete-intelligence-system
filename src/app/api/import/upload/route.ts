import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const maxDuration = 30

// Admin client for storage — bypasses RLS correctly with service role key
function adminStorage() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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

    // Parse JSON body with base64 data
    let filename = 'import'
    let contentType = 'application/octet-stream'
    let buffer: Buffer

    console.log('[upload] Parsing JSON body...')
    try {
      const body = await request.json()
      const { filename: fn, contentType: ct, fileSizeBytes, data } = body

      console.log('[upload] Body received:', { filename: fn, contentType: ct, fileSizeBytes, hasData: !!data, dataLength: data?.length })

      if (!data || !fn) {
        return NextResponse.json({ error: 'Missing file data or filename' }, { status: 400 })
      }

      filename = fn
      contentType = ct || 'application/octet-stream'

      // Validate size BEFORE decoding (base64 is ~33% larger than binary)
      // Vercel body limit: 4.5MB. Base64 of 3.3MB ≈ 4.4MB → safe margin
      const estimatedSize = fileSizeBytes || Math.round(data.length * 0.75)
      if (estimatedSize > 4 * 1024 * 1024) {
        return NextResponse.json({
          error: 'FILE_TOO_LARGE_FOR_PROXY',
          useDirectUpload: true,
          message: 'Archivo mayor de 4MB. Usa la subida directa.'
        }, { status: 413 })
      }

      buffer = Buffer.from(data, 'base64')
      console.log('[upload] Buffer decoded, size:', buffer.byteLength)
    } catch (parseErr) {
      console.error('[upload] JSON parse error:', parseErr)
      return NextResponse.json({ error: 'Could not parse request body', details: String(parseErr) }, { status: 400 })
    }

    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    if (buffer.byteLength > 4 * 1024 * 1024) {
      return NextResponse.json({
        error: 'FILE_TOO_LARGE_FOR_PROXY',
        useDirectUpload: true,
        message: 'Archivo mayor de 4MB. Usa la subida directa.'
      }, { status: 413 })
    }

    // Detect content type from extension (browser MIME type can be empty on mobile)
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const mimeByExt: Record<string, string> = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
      csv: 'text/csv',
      pdf: 'application/pdf',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', heic: 'image/heic', heif: 'image/heif',
      png: 'image/png', webp: 'image/webp', gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    }
    const resolvedContentType = mimeByExt[ext] || contentType || 'application/octet-stream'

    // fileType label for DB
    let fileType = 'other'
    if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'].includes(ext)) fileType = 'excel'
    else if (['jpg', 'jpeg', 'heic', 'heif', 'png', 'webp', 'gif'].includes(ext)) fileType = 'image'
    else if (ext === 'pdf') fileType = 'pdf'
    else if (['doc', 'docx'].includes(ext)) fileType = 'word'
    else if (ext === 'txt') fileType = 'text'

    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 100)
    const storagePath = `${profile.id}/${Date.now()}_${safeName}`

    console.log('[upload] Uploading via admin client:', { path: storagePath, size: buffer.byteLength, type: resolvedContentType })

    // Use admin storage client — SSR client doesn't send Authorization header for storage
    const adminDb = adminStorage()
    const { error: uploadError } = await (adminDb as any)
      .storage
      .from('imports')
      .upload(storagePath, buffer, {
        contentType: resolvedContentType,
        upsert: false
      })

    if (uploadError) {
      console.error('[upload] Storage error:', JSON.stringify(uploadError))
      return NextResponse.json({
        error: 'Storage upload failed',
        details: uploadError.message,
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

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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > 4 * 1024 * 1024) {
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
        fileSizeLimit: 10485760
      })
    }

    // Detect file type from extension (more reliable than MIME in browser)
    const filename = file.name
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    let fileType = 'other'
    if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv'].includes(ext)) fileType = 'excel'
    else if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'bmp'].includes(ext)) fileType = 'image'
    else if (ext === 'pdf') fileType = 'pdf'
    else if (['doc', 'docx'].includes(ext)) fileType = 'word'
    else if (ext === 'txt') fileType = 'text'

    const safeName = filename.replace(/[^a-zA-Z0-9._\-]/g, '_')
    const storagePath = `${profile.id}/${Date.now()}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await (supabase as any)
      .storage
      .from('imports')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      })

    if (uploadError) {
      console.error('[import/upload] Storage error:', uploadError.message)
      return NextResponse.json({
        error: 'Storage upload failed',
        details: uploadError.message
      }, { status: 500 })
    }

    const { data: importedFile, error: dbError } = await (supabase as any)
      .from('imported_files')
      .insert({
        athlete_id: profile.id,
        original_filename: filename,
        file_type: fileType,
        storage_path: storagePath,
        file_size_bytes: file.size,
        import_status: 'pending'
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({
      ok: true,
      importedFileId: importedFile.id,
      importId: importedFile.id,
      storagePath,
      fileSizeBytes: file.size
    })
  } catch (error) {
    console.error('[import/upload]', error)
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 })
  }
}

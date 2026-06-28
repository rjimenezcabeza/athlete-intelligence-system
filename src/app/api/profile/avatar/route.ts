import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Admin client: properly sends Authorization: Bearer <service_role_key> for storage
function adminClient() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  return (await (supabase as any).auth.getUser()).data.user
}

// POST: receive base64 image, upload directly via admin client, save URL to DB
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { base64, contentType } = body

    if (!base64) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 })
    }

    // Detect content type from base64 header or explicit param
    const detectedType = contentType || 'image/jpeg'
    if (!detectedType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
    }

    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()

    // Resolve athlete profile ID
    const { data: profile } = await (admin as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Decode base64 (strip data URL prefix if present)
    const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'Empty image data' }, { status: 400 })
    }
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 })
    }

    const ext = detectedType === 'image/png' ? 'png' : detectedType === 'image/webp' ? 'webp' : 'jpg'
    // Add timestamp to bust cache
    const avatarPath = `${profile.id}/avatar_${Date.now()}.${ext}`

    // Upload directly — admin client sends proper Authorization header
    const { error: uploadError } = await (admin as any)
      .storage.from('avatars').upload(avatarPath, buffer, {
        contentType: detectedType,
        upsert: true
      })

    if (uploadError) {
      console.error('[profile/avatar] storage upload failed:', uploadError)
      return NextResponse.json({
        error: 'Upload failed',
        details: uploadError.message
      }, { status: 500 })
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`

    // Save URL to DB immediately
    await (admin as any)
      .from('athlete_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true, avatarUrl })
  } catch (error) {
    console.error('[profile/avatar POST]', error)
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 })
  }
}

// PATCH: update avatar URL in DB (backward compat)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { avatarUrl } = body
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()
    await (admin as any)
      .from('athlete_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[profile/avatar PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

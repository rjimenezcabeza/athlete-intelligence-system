import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contentType } = body
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
    }

    const supabase = await getSupabase()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('athlete_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Auto-create avatars bucket if missing
    const { data: buckets } = await (supabase as any).storage.listBuckets()
    if (!buckets?.some((b: any) => b.name === 'avatars')) {
      await (supabase as any).storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880
      })
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
    const avatarPath = `${profile.id}/avatar.${ext}`

    const { data: signedData, error } = await (supabase as any)
      .storage.from('avatars').createSignedUploadUrl(avatarPath)
    if (error) throw error

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`

    return NextResponse.json({ signedUrl: signedData.signedUrl, avatarPath, publicUrl })
  } catch (error) {
    console.error('[profile/avatar POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { avatarUrl } = body

    const supabase = await getSupabase()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await (supabase as any)
      .from('athlete_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[profile/avatar PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

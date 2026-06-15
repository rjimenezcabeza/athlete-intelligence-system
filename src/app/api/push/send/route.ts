import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

function getWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  const priv = process.env.VAPID_PRIVATE_KEY || ''
  if (pub.length > 20 && priv.length > 20 && !pub.startsWith('PLACEHOLDER')) {
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'admin@ais.app'),
      pub,
      priv
    )
    return webpush
  }
  return null
}

// POST /api/push/send — enviar notificación (uso interno/server-side)
// Body: { athlete_id, title, body, type, url? }
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const body = await request.json()
  const { athlete_id, title, body: msgBody, type, url = '/' } = body

  if (!athlete_id || !title || !msgBody) {
    return NextResponse.json({ error: 'athlete_id, title, body required' }, { status: 400 })
  }

  const { data: subscriptions } = await (supabase as any)
    .from('push_subscriptions')
    .select('*')
    .eq('athlete_id', athlete_id)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions' })
  }

  const payload = JSON.stringify({
    title,
    body: msgBody,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    url,
    type,
  })

  const push = getWebPush()
  if (!push) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 503 })
  }

  const results = { sent: 0, failed: 0, errors: [] as string[] }

  for (const sub of subscriptions) {
    if (type === 'progression' && !sub.notify_progression) continue
    if (type === 'pattern' && !sub.notify_patterns) continue
    if (type === 'streak' && !sub.notify_streak) continue
    if (type === 'reminder' && !sub.notify_reminders) continue

    try {
      await push.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      results.sent++
    } catch (err: any) {
      results.failed++
      results.errors.push(err.message)

      if (err.statusCode === 410) {
        await (supabase as any)
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id)
      }
    }
  }

  return NextResponse.json({ success: true, ...results })
}

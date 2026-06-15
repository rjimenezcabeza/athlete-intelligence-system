import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

function createAdminDb() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 })
  }

  const supabase = createAdminDb()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const athleteId = session.metadata?.athlete_id
        if (!athleteId) break
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 1)
        await (supabase as any)
          .from('athlete_profiles')
          .update({ subscription_tier: 'pro', subscription_expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() })
          .eq('id', athleteId)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const athleteId = sub.metadata?.athlete_id
        if (!athleteId) break
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        const expiresAt = isActive && sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null
        await (supabase as any)
          .from('athlete_profiles')
          .update({ subscription_tier: isActive ? 'pro' : 'free', subscription_expires_at: expiresAt, updated_at: new Date().toISOString() })
          .eq('id', athleteId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        const athleteId = sub.metadata?.athlete_id
        if (!athleteId) break
        await (supabase as any)
          .from('athlete_profiles')
          .update({ subscription_tier: 'free', subscription_expires_at: null, updated_at: new Date().toISOString() })
          .eq('id', athleteId)
        break
      }
    }
  } catch (e: any) {
    console.error('Webhook handler error:', e.message)
  }

  return NextResponse.json({ received: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'

// ─────────────────────────────────────────────
// Sécurité — clé secrète pour le cron
// ─────────────────────────────────────────────
function isAuthorized(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // pas de secret configuré = dev local
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = { email1: 0, email2: 0, email3: 0, errors: 0 }

  // ─────────────────────────────────────────────
  // Récupérer tous les paniers abandonnés actifs
  // (non récupérés, avec email, créés il y a +1h)
  // ─────────────────────────────────────────────
  const { data: carts, error } = await supabase
    .from('abandoned_carts')
    .select('*')
    .eq('recovered', false)
    .not('customer_email', 'is', null)
    .lt('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString()) // +1h minimum

  if (error) {
    console.error('Cron: failed to fetch abandoned carts', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!carts || carts.length === 0) {
    return NextResponse.json({ message: 'No abandoned carts to process', ...results })
  }

  for (const cart of carts) {
    const createdAt = new Date(cart.created_at)
    const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    try {
      // ── EMAIL 1 — après 1h ──────────────────
      if (!cart.email_1_sent_at && hoursSince >= 1) {
        await sendAbandonedEmail(cart, 1)
        await supabase
          .from('abandoned_carts')
          .update({
            email_1_sent_at: now.toISOString(),
            reminder_count: (cart.reminder_count || 0) + 1,
            last_reminder_sent: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', cart.id)
        results.email1++
        continue // on attend le prochain passage pour email 2
      }

      // ── EMAIL 2 — après 24h ─────────────────
      if (cart.email_1_sent_at && !cart.email_2_sent_at && hoursSince >= 24) {
        await sendAbandonedEmail(cart, 2)
        await supabase
          .from('abandoned_carts')
          .update({
            email_2_sent_at: now.toISOString(),
            reminder_count: (cart.reminder_count || 0) + 1,
            last_reminder_sent: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', cart.id)
        results.email2++
        continue
      }

      // ── EMAIL 3 — après 72h ─────────────────
      if (cart.email_2_sent_at && !cart.email_3_sent_at && hoursSince >= 72) {
        await sendAbandonedEmail(cart, 3)
        await supabase
          .from('abandoned_carts')
          .update({
            email_3_sent_at: now.toISOString(),
            reminder_count: (cart.reminder_count || 0) + 1,
            last_reminder_sent: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', cart.id)
        results.email3++
      }

    } catch (err: any) {
      console.error(`Cron: error processing cart ${cart.id}:`, err.message)
      results.errors++
    }
  }

  console.log('Abandoned cart cron results:', results)
  return NextResponse.json({ success: true, processed: carts.length, ...results })
}

// ─────────────────────────────────────────────
// Helper — appelle l'endpoint email
// ─────────────────────────────────────────────
async function sendAbandonedEmail(cart: any, emailNumber: number) {
  const res = await fetch(`${SITE_URL}/api/orders/abandoned`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart, emailNumber }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || `Email ${emailNumber} failed`)
  }
}

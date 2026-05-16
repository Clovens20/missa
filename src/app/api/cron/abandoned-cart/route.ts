import { NextResponse } from 'next/server'
import { createClient } from 
  '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  getAbandonedCartEmail1,
  getAbandonedCartEmail2,
  getAbandonedCartEmail3,
} from '@/lib/abandoned-cart-emails'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(
  process.env.RESEND_API_KEY
)

// Generate discount code
function generateCode(
  email: string
): string {
  const hash = email
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 4)
  return `MISSA${hash}10`
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = 
    req.headers.get('authorization')
  if (authHeader !== 
    `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const now = new Date()
  const results = {
    email1_sent: 0,
    email2_sent: 0,
    email3_sent: 0,
    errors: 0,
  }

  // ── EMAIL 1: 1 hour after abandon ──
  const oneHourAgo = new Date(
    now.getTime() - 60 * 60 * 1000
  )
  const twoHoursAgo = new Date(
    now.getTime() - 2 * 60 * 60 * 1000
  )

  const { data: carts1 } = await supabase
    .from('abandoned_carts')
    .select('*')
    .eq('recovered', false)
    .is('email_1_sent_at', null)
    .lt('created_at', 
      oneHourAgo.toISOString())
    .gt('created_at', 
      twoHoursAgo.toISOString())
    .not('customer_email', 'is', null)

  for (const cart of carts1 || []) {
    try {
      const { subject, html } = 
        getAbandonedCartEmail1(cart)
      
      await resend.emails.send({
        from: 'Missa Shop <hello@missashop.com>',
        to: cart.customer_email,
        subject,
        html,
      })

      await supabase
        .from('abandoned_carts')
        .update({
          email_1_sent_at: 
            now.toISOString()
        })
        .eq('id', cart.id)

      results.email1_sent++
      
      // Wait to avoid rate limits
      await new Promise(r => 
        setTimeout(r, 500)
      )
    } catch (err) {
      results.errors++
    }
  }

  // ── EMAIL 2: 24h after abandon ──
  const twentyFourHoursAgo = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  )
  const twentyFiveHoursAgo = new Date(
    now.getTime() - 25 * 60 * 60 * 1000
  )

  const { data: carts2 } = await supabase
    .from('abandoned_carts')
    .select('*')
    .eq('recovered', false)
    .not('email_1_sent_at', 'is', null)
    .is('email_2_sent_at', null)
    .lt('created_at', 
      twentyFourHoursAgo.toISOString())
    .gt('created_at', 
      twentyFiveHoursAgo.toISOString())

  for (const cart of carts2 || []) {
    try {
      // Generate discount code
      const code = generateCode(
        cart.customer_email
      )
      const discountPct = 10

      // Save coupon to DB
      await supabase
        .from('coupons')
        .upsert({
          code,
          discount_type: 'percentage',
          discount_value: discountPct,
          max_uses: 1,
          used_count: 0,
          expires_at: new Date(
            now.getTime() + 
            48 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
          description: 
            'Abandoned cart recovery',
        }, { onConflict: 'code' })

      const { subject, html } = 
        getAbandonedCartEmail2(
          cart, code, discountPct
        )

      await resend.emails.send({
        from: 'Missa Shop <hello@missashop.com>',
        to: cart.customer_email,
        subject,
        html,
      })

      await supabase
        .from('abandoned_carts')
        .update({
          email_2_sent_at: 
            now.toISOString(),
          discount_code: code,
          discount_pct: discountPct,
        })
        .eq('id', cart.id)

      results.email2_sent++
      await new Promise(r => 
        setTimeout(r, 500)
      )
    } catch (err) {
      results.errors++
    }
  }

  // ── EMAIL 3: 72h — Last chance ──
  const seventyTwoHoursAgo = new Date(
    now.getTime() - 72 * 60 * 60 * 1000
  )
  const seventyThreeHoursAgo = new Date(
    now.getTime() - 73 * 60 * 60 * 1000
  )

  const { data: carts3 } = await supabase
    .from('abandoned_carts')
    .select('*')
    .eq('recovered', false)
    .not('email_2_sent_at', 'is', null)
    .is('email_3_sent_at', null)
    .lt('created_at', 
      seventyTwoHoursAgo.toISOString())
    .gt('created_at', 
      seventyThreeHoursAgo.toISOString())

  for (const cart of carts3 || []) {
    try {
      const { subject, html } = 
        getAbandonedCartEmail3(
          cart, cart.discount_code
        )

      await resend.emails.send({
        from: 'Missa Shop <hello@missashop.com>',
        to: cart.customer_email,
        subject,
        html,
      })

      await supabase
        .from('abandoned_carts')
        .update({
          email_3_sent_at: 
            now.toISOString()
        })
        .eq('id', cart.id)

      results.email3_sent++
      await new Promise(r => 
        setTimeout(r, 500)
      )
    } catch (err) {
      results.errors++
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    ...results,
  })
}

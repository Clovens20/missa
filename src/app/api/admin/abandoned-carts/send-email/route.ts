import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM } from '@/lib/email'
import {
  getAbandonedCartEmail1,
  getAbandonedCartEmail2,
  getAbandonedCartEmail3,
} from '@/lib/abandoned-cart-emails'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateCode(
  email: string
): string {
  const hash = email
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 4)
  return `MISSA${hash}10`
}

export async function POST(req: Request) {
  try {
    const { cartId, step } = await req.json()
    if (!cartId || !step) {
      return NextResponse.json(
        { error: 'Parameters missing' },
        { status: 400 }
      )
    }

    const { data: cart, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('id', cartId)
      .single()

    if (error || !cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    const email = cart.customer_email || cart.email
    if (!email) {
      return NextResponse.json(
        { error: 'Customer email is empty' },
        { status: 400 }
      )
    }

    // Defensive token generation if missing
    if (!cart.recovery_token) {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      cart.recovery_token = token
      await supabase
        .from('abandoned_carts')
        .update({ recovery_token: token })
        .eq('id', cart.id)
    }

    // Defensive cart_total normalization if missing
    if (cart.cart_total === null || cart.cart_total === undefined) {
      cart.cart_total = cart.total || 0
    }

    let subject = ''
    let html = ''

    if (step === 1) {
      const emailData = getAbandonedCartEmail1(cart)
      subject = emailData.subject
      html = emailData.html
    } else if (step === 2) {
      const code = generateCode(email)
      const discountPct = 10

      // Upsert coupon
      await supabase
        .from('coupons')
        .upsert({
          code,
          discount_type: 'percentage',
          discount_value: discountPct,
          max_uses: 1,
          used_count: 0,
          expires_at: new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toISOString(),
          is_active: true,
          description: 'Abandoned cart recovery manual',
        }, { onConflict: 'code' })

      const emailData = getAbandonedCartEmail2(cart, code, discountPct)
      subject = emailData.subject
      html = emailData.html

      // Save code to cart
      await supabase
        .from('abandoned_carts')
        .update({
          discount_code: code,
          discount_pct: discountPct
        })
        .eq('id', cart.id)
    } else if (step === 3) {
      const code = cart.discount_code || generateCode(email)
      const emailData = getAbandonedCartEmail3(cart, code)
      subject = emailData.subject
      html = emailData.html
    } else {
      return NextResponse.json(
        { error: 'Invalid step' },
        { status: 400 }
      )
    }

    // Send email using Resend
    const { error: resendError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return NextResponse.json({ error: resendError.message }, { status: 400 })
    }

    // Update DB timestamp
    const updateData: any = {}
    if (step === 1) updateData.email_1_sent_at = new Date().toISOString()
    if (step === 2) updateData.email_2_sent_at = new Date().toISOString()
    if (step === 3) updateData.email_3_sent_at = new Date().toISOString()

    await supabase
      .from('abandoned_carts')
      .update(updateData)
      .eq('id', cart.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Manual recovery error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

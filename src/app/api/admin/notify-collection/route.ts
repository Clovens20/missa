import { NextResponse } from 'next/server'
import { createClient } from 
  '@supabase/supabase-js'
import { Resend } from 'resend'
import { getNewCollectionEmail } 
  from '@/lib/collection-alert-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(
  process.env.RESEND_API_KEY
)

export async function POST(req: Request) {
  try {
    const { 
      subject, 
      productIds, 
      type = 'new_products',
    } = await req.json()

    // Get products
    const { data: products } = 
      await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .in('id', productIds || [])
        .eq('is_active', true)
        .limit(4)

    // Get dropship products if needed
    const { data: dropProducts } = 
      await supabase
        .from('dropship_products')
        .select('id, name, slug, selling_price, images')
        .in('id', productIds || [])
        .eq('is_active', true)
        .limit(4)

    const allProducts = [
      ...(products || []),
      ...(dropProducts || []).map(p => ({
        ...p,
        price: p.selling_price,
        is_dropship: true
      })),
    ].slice(0, 4)

    if (allProducts.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 400 }
      )
    }

    // Get confirmed subscribers
    const { data: subscribers } = 
      await supabase
        .from('collection_subscribers')
        .select('*')
        .eq('confirmed', true)
        .eq('notify_new_products', true)

    if (!subscribers?.length) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No subscribers',
      })
    }

    let sent = 0
    let errors = 0

    // Send in batches of 10 to avoid rate limits
    const batches = []
    for (let i = 0; 
      i < subscribers.length; 
      i += 10
    ) {
      batches.push(
        subscribers.slice(i, i + 10)
      )
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(async subscriber => {
          try {
            const { subject: sub, html } = 
              getNewCollectionEmail(
                subscriber,
                allProducts,
                subject,
                type
              )

            await resend.emails.send({
              from: 'Missa Shop <hello@missashop.com>',
              to: subscriber.email,
              subject: sub,
              html,
            })

            await supabase
              .from('collection_subscribers')
              .update({
                emails_sent: 
                  (subscriber.emails_sent 
                    || 0) + 1,
                last_email_at: 
                  new Date().toISOString(),
              })
              .eq('id', subscriber.id)

            sent++
          } catch (err) {
            console.error('Error sending email to', subscriber.email, err)
            errors++
          }
        })
      )
      // Wait between batches
      await new Promise(r => 
        setTimeout(r, 1000)
      )
    }

    // Log notification
    await supabase
      .from('collection_notifications')
      .insert({
        subject,
        type,
        products: allProducts.map(
          p => ({ id: p.id, name: p.name })
        ),
        recipients_count: sent,
      })

    return NextResponse.json({
      success: true,
      sent,
      errors,
      total: subscribers.length,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

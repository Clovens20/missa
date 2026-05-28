import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_dummy_key_for_build',
  { apiVersion: '2024-06-20' as any }
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // ─────────────────────────────────────────────
  // ✅ PAIEMENT RÉUSSI
  // ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    // Only create order if payment succeeded
    if (session.payment_status === 'paid') {
      const metadata = session.metadata!;
      const items = JSON.parse(metadata.items_json || '[]');
      const shipping = session.shipping_details;
      const customer = session.customer_details;

      // NOW create the order in Supabase
      const { error } = await supabase
        .from('orders')
        .insert({
          order_number: metadata.order_number,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          customer_email: customer?.email,
          customer_name: customer?.name,
          customer_phone: customer?.phone,
          shipping_address: shipping?.address ? {
            address: shipping.address.line1,
            city: shipping.address.city,
            state: shipping.address.state,
            zip: shipping.address.postal_code,
            country: shipping.address.country,
          } : null,
          items: items,
          subtotal: session.amount_subtotal! / 100,
          shipping: session.shipping_cost?.amount_total 
            ? session.shipping_cost.amount_total / 100 
            : 0,
          total: session.amount_total! / 100,
          currency: session.currency?.toUpperCase() || 'CAD',
          status: 'confirmed', // ← confirmed from the start, not "en attente"
          payment_status: 'paid',
          source: metadata.source || 'missashopp.com',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating order in Supabase:', error);
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
      }

      console.log(`✅ Order ${metadata.order_number} created successfully`);

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'
        await fetch(`${appUrl}/api/orders/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: metadata.order_number,
            order_number: metadata.order_number,
            customer_email: customer?.email || '',
            customer_name: customer?.name || 'Client',
            total: session.amount_total! / 100,
            items_count: items.length || 1,
            items: items.map((item: any) => ({
              name: item.name,
              qty: item.qty,
              price: item.price
            })),
          })
        })
      } catch (mailErr) {
        console.error('Failed to trigger confirmation email in Stripe Webhook:', mailErr)
      }
    }
  }

  // ─────────────────────────────────────────────
  // ❌ SESSION EXPIRÉE — CLIENT N'A PAS PAYÉ
  // ─────────────────────────────────────────────
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as any

    console.log('Checkout session expired:', session.id, '| Order:', session.metadata?.order_number)

    // No updates to guest_orders or orders since they weren't created!
  }

  return NextResponse.json({ received: true })
}
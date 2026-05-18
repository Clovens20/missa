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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    // Retrieve original pre-inserted guest order to get original items/order details
    const { data: guestOrder, error: guestFetchErr } = await supabase
      .from('guest_orders')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single()

    if (guestFetchErr || !guestOrder) {
      console.error('Matching guest order not found for Stripe session:', session.id)
    }

    const orderNumber = guestOrder?.order_number || ('MS-' + Date.now().toString().slice(-8))
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

    // Split Stripe shipping details name
    const nameParts = (session.shipping_details?.name || session.customer_details?.name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Update guest_orders table which is used for fulfillment/admin panels
    const { error: guestUpdateErr } = await supabase
      .from('guest_orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        stripe_payment_intent: session.payment_intent as string,
        email: session.customer_details?.email || guestOrder?.email,
        first_name: firstName || guestOrder?.first_name,
        last_name: lastName || guestOrder?.last_name,
        phone: session.customer_details?.phone || session.shipping_details?.phone || guestOrder?.phone,
        shipping_address: session.shipping_details?.address ? {
          address: session.shipping_details.address.line1 || '',
          city: session.shipping_details.address.city || '',
          state: session.shipping_details.address.state || '',
          zip: session.shipping_details.address.postal_code || '',
          country: session.shipping_details.address.country || 'CA',
        } : guestOrder?.shipping_address,
        subtotal: (session.amount_subtotal || 0) / 100,
        shipping: (session.shipping_cost?.amount_total || 0) / 100,
        total: (session.amount_total || 0) / 100,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)

    if (guestUpdateErr) {
      console.error('Error updating guest_order status in Webhook:', guestUpdateErr)
    }

    // Insert into legacy orders table as requested for CSP / tracking analytics
    const { error: legacyInsertErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        customer_email: session.customer_details?.email,
        customer_name: session.customer_details?.name || `${firstName} ${lastName}`,
        customer_phone: session.customer_details?.phone || session.shipping_details?.phone,
        shipping_address: session.shipping_details?.address,
        subtotal: (session.amount_subtotal || 0) / 100,
        shipping: (session.shipping_cost?.amount_total || 0) / 100,
        total: (session.amount_total || 0) / 100,
        currency: 'usd',
        payment_status: session.payment_status,
        status: 'confirmed',
        items: lineItems.data.map(item => ({
          name: item.description,
          quantity: item.quantity,
          price: (item.amount_total || 0) / 100 / (item.quantity || 1),
          total: (item.amount_total || 0) / 100,
        })),
      } as any)

    if (legacyInsertErr) {
      console.error('Error inserting legacy order in Webhook:', legacyInsertErr)
    }

    // Trigger automated order confirmation email to customer
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'
      await fetch(`${appUrl}/api/orders/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderNumber,
          order_number: orderNumber,
          customer_email: session.customer_details?.email || guestOrder?.email || '',
          customer_name: session.customer_details?.name || `${firstName} ${lastName}`.trim() || guestOrder?.first_name || 'Client',
          total: (session.amount_total || 0) / 100,
          items_count: guestOrder?.items?.length || lineItems.data.length || 1,
          items: guestOrder?.items || lineItems.data.map(item => ({
            name: item.description,
            qty: item.quantity,
            price: (item.amount_total || 0) / 100 / (item.quantity || 1)
          })),
        })
      })
    } catch (mailErr) {
      console.error('Failed to trigger confirmation email in Stripe Webhook:', mailErr)
    }
  }

  return NextResponse.json({ received: true })
}

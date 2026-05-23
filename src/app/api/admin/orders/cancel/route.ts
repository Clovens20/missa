import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_dummy_key_for_build', { 
  apiVersion: '2024-06-20' as any 
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

    const { data: order, error: orderErr } = await supabase
      .from('guest_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.order_status !== 'pending' && order.order_status !== 'confirmed') {
      return NextResponse.json({ error: 'La commande ne peut pas être annulée à ce stade.' }, { status: 400 })
    }

    let refundSuccess = false
    let refundMessage = ''

    if (order.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        
        if (session.payment_status === 'paid' && session.payment_intent) {
          try {
            await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
            })
            refundSuccess = true
          } catch (refundErr: any) {
            console.error('Stripe refund execution error:', refundErr)
            // If it's already refunded, we consider it a success
            if (refundErr.message?.includes('already been refunded') || refundErr.code === 'charge_already_refunded') {
              refundSuccess = true
            } else {
              refundMessage = refundErr.message || 'Erreur Stripe inconnue'
            }
          }
        } else {
          refundMessage = "Le paiement n'a pas été complété sur Stripe (statut non payé)."
        }
      } catch (sessionErr: any) {
        console.error('Stripe session retrieval error:', sessionErr)
        refundMessage = "Impossible de récupérer la session Stripe."
      }
    }

    // Always update the order status in Supabase so the admin is not blocked from cancelling
    const { error: updateErr } = await supabase
      .from('guest_orders')
      .update({ order_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateErr) throw updateErr

    return NextResponse.json({ 
      success: true, 
      refundSuccess,
      message: refundMessage
    })
  } catch (error: any) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

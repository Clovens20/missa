import { NextResponse } from 'next/server'
import { sendOrderConfirmation, sendAdminOrderAlert } from '@/lib/email'

export async function POST(req: Request) {
  const rawOrder = await req.json()
  
  // Normalisation défensive des champs pour garantir l'envoi de l'email
  const order = {
    id: rawOrder.id || rawOrder.orderNumber || rawOrder.order_number,
    customer_name: rawOrder.customer_name || rawOrder.firstName || 'Client',
    customer_email: rawOrder.customer_email || rawOrder.email,
    total: rawOrder.total,
    items_count: rawOrder.items_count || rawOrder.items?.length || 1,
    items: rawOrder.items || []
  }

  if (!order.customer_email) {
    console.error('Cannot send order confirmation: customer email is missing', rawOrder)
    return NextResponse.json({ error: 'Customer email is missing' }, { status: 400 })
  }

  try {
    await sendOrderConfirmation(order.customer_email, order)
    await sendAdminOrderAlert(order)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

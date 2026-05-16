import { NextResponse } from 'next/server'
import { sendOrderConfirmation, sendAdminOrderAlert } from '@/lib/email'

export async function POST(req: Request) {
  const order = await req.json()
  // order expects: id, customer_name, customer_email, total, items_count, etc.

  try {
    await sendOrderConfirmation(order.customer_email, order)
    await sendAdminOrderAlert(order)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

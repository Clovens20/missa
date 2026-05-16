import { NextResponse } from 'next/server'
import { getCJOrderStatus, getCJTracking } from '@/lib/cj-api'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Called by cron job every 6 hours
// to update tracking for all active
// dropship orders
export async function GET() {
  try {
    // Get all submitted/processing orders
    const { data: orders } = await supabase
      .from('dropship_orders')
      .select('*')
      .in('status', ['submitted', 'processing'])

    let updated = 0
    const errors: string[] = []

    for (const order of orders || []) {
      try {
        if (!order.cj_order_id) continue

        // Get status from CJ
        const cjStatus = await getCJOrderStatus(order.cj_order_id)
        
        if (!cjStatus) continue

        let newStatus = order.status
        let tracking = order.tracking_number
        let trackingUrl = order.tracking_url

        // Map CJ status to our status
        const cjOrderStatus = cjStatus.orderStatus || ''
        
        if (cjOrderStatus === 'WAIT_PAY') {
          newStatus = 'submitted'
        } else if (cjOrderStatus === 'IN_PROCESS' || cjOrderStatus === 'WAIT_SHIP') {
          newStatus = 'processing'
        } else if (cjOrderStatus === 'SHIPPED') {
          newStatus = 'shipped'
          tracking = cjStatus.trackingNumber || tracking
          trackingUrl = cjStatus.trackingUrl || trackingUrl
        } else if (cjOrderStatus === 'DELIVERED') {
          newStatus = 'delivered'
        } else if (cjOrderStatus === 'CANCELLED') {
          newStatus = 'cancelled'
        }

        // Update if changed
        if (newStatus !== order.status || tracking !== order.tracking_number) {
          await supabase
            .from('dropship_orders')
            .update({
              status: newStatus,
              tracking_number: tracking,
              tracking_url: trackingUrl,
              carrier: cjStatus.logisticName,
              shipped_at: newStatus === 'shipped' ? new Date().toISOString() : order.shipped_at,
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          // If shipped, send email to customer
          if (newStatus === 'shipped' && order.status !== 'shipped' && tracking) {
            // Get main order email
            const { data: mainOrder } = await supabase
              .from('guest_orders')
              .select('email, first_name, order_number')
              .eq('id', order.guest_order_id)
              .single()

            if (mainOrder) {
              await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/shipped-notification`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: mainOrder.email,
                    firstName: mainOrder.first_name,
                    orderNumber: mainOrder.order_number,
                    trackingNumber: tracking,
                    items: order.items,
                    total: 0,
                    shippingAddress: {
                      address: order.shipping_address,
                      city: order.shipping_city,
                      state: order.shipping_state,
                      zip: order.shipping_zip,
                      country: order.shipping_country,
                    },
                  }),
                }
              )
            }
          }

          updated++
        }
      } catch (err: any) {
        errors.push(`Order ${order.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: orders?.length || 0,
      updated,
      errors,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

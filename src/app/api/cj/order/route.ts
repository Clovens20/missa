import { NextResponse } from 'next/server'
import { createCJOrder } from '@/lib/cj-api'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    // Get the guest order
    const { data: order, error: orderErr } = await supabase
      .from('guest_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Filter only dropship items
    const dropshipItems = (order.items || []).filter((item: any) => item.is_dropship)

    if (dropshipItems.length === 0) {
      return NextResponse.json(
        { error: 'No dropship items in order' },
        { status: 400 }
      )
    }

    // Get CJ product details for each item
    const cjProducts = await Promise.all(
      dropshipItems.map(async (item: any) => {
        const { data: dp } = await supabase
          .from('dropship_products')
          .select('cj_product_id, variants')
          .eq('id', item.product_id)
          .single()
        
        // Find matching variant
        const variant = dp?.variants?.find((v: any) => v.id === item.variant_id) || dp?.variants?.[0]
        
        return {
          vid: variant?.vid || dp?.cj_product_id,
          quantity: item.qty,
        }
      })
    )

    const addr = order.shipping_address

    // Get the default note from settings
    const { data: noteSettings } = 
      await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'dropship_default_note')
        .single()

    const defaultNote = 
      noteSettings?.value
        ?.replace(/^"|"$/g, '') ||
      'NO INVOICE - NO BRANDING - DROPSHIP'

    // Create order on CJ
    const cjOrderResult = await createCJOrder({
      orderNumber: `MISSA-${order.order_number}`,
      products: cjProducts.filter(p => p.vid),
      fromCountryCode: 'CN',
      toCountryCode: addr.country === 'CA' ? 'CA' : addr.country === 'US' ? 'US' : addr.country || 'CA',
      toProvince: addr.state || '',
      toCity: addr.city || '',
      toAddress: addr.address || '',
      toName: `${order.first_name} ${order.last_name}`,
      toPhone: order.phone || '0000000000',
      toEmail: order.email,
      toPostCode: addr.zip || '',
      logisticName: 'CJPacket Ordinary',
      remark: defaultNote + 
        ' | Missa Shop Order: ' + 
        order.order_number,
    })

    // Store dropship order record
    const { data: dropshipOrder } = await supabase
      .from('dropship_orders')
      .insert({
        guest_order_id: orderId,
        order_number: order.order_number,
        cj_order_id: cjOrderResult?.orderId || null,
        cj_order_number: cjOrderResult?.orderNum || null,
        items: dropshipItems,
        shipping_name: `${order.first_name} ${order.last_name}`,
        shipping_address: addr.address,
        shipping_city: addr.city,
        shipping_state: addr.state,
        shipping_zip: addr.zip,
        shipping_country: addr.country,
        shipping_phone: order.phone || '',
        products_cost: dropshipItems.reduce((s: number, i: any) => s + i.cj_price * i.qty, 0),
        status: cjOrderResult ? 'submitted' : 'failed',
        error_message: cjOrderResult ? null : 'CJ order creation failed',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Update main order status
    if (cjOrderResult) {
      await supabase
        .from('guest_orders')
        .update({ 
          order_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
    }

    return NextResponse.json({
      success: !!cjOrderResult,
      cjOrderId: cjOrderResult?.orderId || null,
      dropshipOrderId: dropshipOrder?.id || null,
      message: cjOrderResult ? 'Order submitted to CJ!' : 'Failed to submit to CJ',
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

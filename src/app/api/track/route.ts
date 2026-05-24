import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim()

    if (!query) {
      return NextResponse.json(
        { error: 'Query required' },
        { status: 400 }
      )
    }

    const isEmail = query.includes('@')

    let orderQuery = supabase
      .from('guest_orders')
      .select('*')

    if (isEmail) {
      orderQuery = orderQuery
        .ilike('email', query)
        .order('created_at', { ascending: false })
        .limit(1)
    } else {
      orderQuery = orderQuery
        .ilike('order_number', `%${query}%`)
        .limit(1)
    }

    const { data, error } = await orderQuery.maybeSingle()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Format to match frontend expectations
    const safeOrder = {
      id: data.id,
      order_number: data.order_number,
      status: data.order_status,
      total_amount: data.total,
      created_at: data.created_at,
      tracking_number: data.tracking_number,
      shipping_address: {
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        address: data.shipping_address?.address || '',
        city: data.shipping_address?.city || '',
        province: data.shipping_address?.state || '',
        country: data.shipping_address?.country || '',
      },
      customer_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      customer_email: data.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      items: (data.items || []).map((item: any) => ({
        id: item.product_id || item.id,
        quantity: item.qty || item.quantity || 1,
        price: item.price,
        product_name: item.name,
        image: item.image,
        size: item.variant?.size || item.size,
        color: item.variant?.color || item.color,
      }))
    }

    return NextResponse.json({ order: safeOrder })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

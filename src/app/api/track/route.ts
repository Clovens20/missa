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

    // Search by order number OR email
    const isEmail = query.includes('@')

    let orderQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        created_at,
        tracking_number,
        shipping_address,
        customer_name,
        customer_email,
        items:order_items(
          id,
          quantity,
          price,
          name:product_name,
          image:product_image,
          size,
          color
        )
      `)

    if (isEmail) {
      orderQuery = orderQuery
        .ilike('customer_email', query)
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

    // Hide sensitive data
    const safeOrder = {
      ...data,
      customer_email: data.customer_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    }

    return NextResponse.json({ order: safeOrder })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

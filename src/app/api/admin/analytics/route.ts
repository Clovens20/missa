import { NextResponse } from 'next/server'
import { createClient } from 
  '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = 
      new URL(req.url)
    const period = 
      searchParams.get('period') || '30'
    const days = parseInt(period)

    const startDate = new Date()
    startDate.setDate(
      startDate.getDate() - days
    )
    const startISO = startDate.toISOString()

    // ── 1. Revenue by day ──────────────
    const { data: ordersByDay } = 
      await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .gte('created_at', startISO)
        .neq('status', 'cancelled')
        .order('created_at', 
          { ascending: true })

    // Group by day
    const revenueByDay: Record<
      string, 
      { date: string; revenue: number; orders: number }
    > = {}

    // Pre-fill all days with 0
    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString()
        .split('T')[0]
      revenueByDay[key] = {
        date: key,
        revenue: 0,
        orders: 0,
      }
    }

    // Fill with actual data
    ordersByDay?.forEach(order => {
      const key = order.created_at
        .split('T')[0]
      if (revenueByDay[key]) {
        revenueByDay[key].revenue += 
          Number(order.total_amount) || 0
        revenueByDay[key].orders += 1
      }
    })

    const dailyData = Object.values(
      revenueByDay
    ).map(d => ({
      ...d,
      // Format date for display
      label: new Date(d.date)
        .toLocaleDateString('fr-CA', {
          month: 'short',
          day: 'numeric',
        }),
      revenue: Math.round(
        d.revenue * 100
      ) / 100,
    }))

    // ── 2. Revenue by hour (today) ─────
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: todayOrders } = 
      await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', 
          todayStart.toISOString())
        .neq('status', 'cancelled')

    const hourlyData = Array.from(
      { length: 24 }, (_, h) => ({
        hour: `${h}h`,
        revenue: 0,
        orders: 0,
      })
    )

    todayOrders?.forEach(order => {
      const h = new Date(order.created_at)
        .getHours()
      hourlyData[h].revenue += 
        Number(order.total_amount) || 0
      hourlyData[h].orders += 1
    })

    // ── 3. Best selling products ───────
    const { data: orderItems } = 
      await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          product_image,
          quantity,
          price,
          order:orders!inner(
            created_at,
            status
          )
        `)
        .gte('order.created_at', startISO)
        .neq('order.status', 'cancelled')

    const productSales: Record<string, {
      id: string
      name: string
      image: string
      quantity: number
      revenue: number
    }> = {}

    orderItems?.forEach(item => {
      const key = item.product_id || 
        item.product_name
      if (!productSales[key]) {
        productSales[key] = {
          id: item.product_id,
          name: item.product_name || 
            'Produit',
          image: item.product_image || '',
          quantity: 0,
          revenue: 0,
        }
      }
      productSales[key].quantity += 
        item.quantity || 1
      productSales[key].revenue += 
        (item.price || 0) * 
        (item.quantity || 1)
    })

    const bestSellers = Object.values(
      productSales
    )
      .sort((a, b) => 
        b.revenue - a.revenue
      )
      .slice(0, 8)
      .map(p => ({
        ...p,
        revenue: Math.round(
          p.revenue * 100
        ) / 100,
      }))

    // ── 4. Orders by status ────────────
    const { data: allOrders } = 
      await supabase
        .from('orders')
        .select('status, total_amount')
        .gte('created_at', startISO)

    const statusCount: Record<
      string, number
    > = {}
    allOrders?.forEach(o => {
      statusCount[o.status] = 
        (statusCount[o.status] || 0) + 1
    })

    const ordersByStatus = [
      { 
        name: 'En attente', 
        value: statusCount['pending'] || 0,
        color: '#F7C59F',
      },
      { 
        name: 'Confirmées', 
        value: statusCount['confirmed'] || 
          statusCount['processing'] || 0,
        color: '#FF6B35',
      },
      { 
        name: 'Expédiées', 
        value: statusCount['shipped'] || 0,
        color: '#4ECDC4',
      },
      { 
        name: 'Livrées', 
        value: statusCount['delivered'] || 
          statusCount['completed'] || 0,
        color: '#45B7D1',
      },
      { 
        name: 'Annulées', 
        value: statusCount['cancelled'] || 0,
        color: '#FF6B6B',
      },
    ].filter(s => s.value > 0)

    // ── 5. Traffic sources ─────────────
    // Based on UTM params or referrer
    // stored in orders
    const { data: ordersWithSource } = 
      await supabase
        .from('orders')
        .select('source, metadata')
        .gte('created_at', startISO)

    const sourceCount: Record<
      string, number
    > = {
      'Direct': 0,
      'Google': 0,
      'Facebook': 0,
      'Instagram': 0,
      'WhatsApp': 0,
      'Autre': 0,
    }

    ordersWithSource?.forEach(o => {
      const src = o.source || 'Direct'
      if (sourceCount[src] !== undefined) {
        sourceCount[src]++
      } else {
        sourceCount['Autre']++
      }
    })

    const totalWithSource = 
      Object.values(sourceCount)
        .reduce((a, b) => a + b, 0)
    
    const trafficSources = 
      totalWithSource > 0
        ? Object.entries(sourceCount)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({
              name,
              value,
              pct: Math.round(
                (value / totalWithSource) 
                * 100
              ),
            }))
            .sort((a, b) => b.value - a.value)
        : []

    // ── 6. Recent orders ───────────────
    const { data: recentOrders } = 
      await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          total_amount,
          status,
          created_at,
          items:order_items(
            product_name,
            quantity
          )
        `)
        .order('created_at', 
          { ascending: false })
        .limit(10)

    // ── 7. KPI comparison ──────────────
    const prevStart = new Date(startDate)
    prevStart.setDate(
      prevStart.getDate() - days
    )

    const { data: prevOrders } = 
      await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', 
          prevStart.toISOString())
        .lt('created_at', startISO)
        .neq('status', 'cancelled')

    const currentRevenue = 
      ordersByDay?.reduce(
        (sum, o) => 
          sum + (Number(o.total_amount) || 0),
        0
      ) || 0

    const prevRevenue = 
      prevOrders?.reduce(
        (sum, o) => 
          sum + (Number(o.total_amount) || 0),
        0
      ) || 0

    const revenueGrowth = prevRevenue > 0
      ? Math.round(
          ((currentRevenue - prevRevenue) / 
          prevRevenue) * 100
        )
      : 0

    // ── 8. Conversion rate ─────────────
    const visitorCountRes = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startISO)
    
    const visitorCount = visitorCountRes.count

    const conversionRate = 
      visitorCount && visitorCount > 0
        ? ((ordersByDay?.length || 0) / 
            visitorCount * 100)
            .toFixed(2)
        : null

    return NextResponse.json({
      dailyData,
      hourlyData,
      bestSellers,
      ordersByStatus,
      trafficSources,
      recentOrders: recentOrders || [],
      summary: {
        currentRevenue: Math.round(
          currentRevenue * 100
        ) / 100,
        prevRevenue: Math.round(
          prevRevenue * 100
        ) / 100,
        revenueGrowth,
        conversionRate,
        totalOrders: ordersByDay?.length || 0,
      },
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

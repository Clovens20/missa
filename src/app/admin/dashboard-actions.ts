'use server'

import { createClient } from '@supabase/supabase-js'

export async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isoToday = today.toISOString()
  
  try {
    const [
      { count: totalOrders },
      { count: pendingOrders },
      { data: todayOrders },
      { data: products },
      { count: customersRes },
      { data: recentOrders }
    ] = await Promise.all([
      supabase.from('guest_orders').select('*', { count: 'exact', head: true }),
      supabase.from('guest_orders').select('*', { count: 'exact', head: true }).eq('order_status', 'pending'),
      supabase.from('guest_orders').select('total, order_status, email').gte('created_at', isoToday),
      supabase.from('products').select('id, stock_quantity, low_stock_threshold').eq('is_active', true),
      supabase.from('abandoned_carts').select('*', { count: 'exact', head: true }),
      supabase.from('guest_orders').select('*').order('created_at', { ascending: false }).limit(6)
    ])

    const { data: customerEmails } = await supabase.from('guest_orders').select('email')
    const uniqueEmails = new Set(customerEmails?.map(c => c.email?.toLowerCase()).filter(Boolean) || [])
    const todayEmails = new Set(todayOrders?.map(o => o.email?.toLowerCase()).filter(Boolean) || [])

    const { data: allRevenueData } = await supabase.from('guest_orders').select('total').not('order_status', 'eq', 'cancelled')
    
    const totalRevenue = allRevenueData?.reduce((s, o) => s + (o.total || 0), 0) || 0
    const todayRevenue = todayOrders?.filter(o => o.order_status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0) || 0
    
    const prods = products || []
    const lowStock = prods.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5)).length

    return {
      stats: {
        totalRevenue,
        todayRevenue,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: prods.length,
        lowStockProducts: lowStock,
        totalCustomers: uniqueEmails.size,
        newCustomersToday: todayEmails.size,
        revenueGrowth: 15.2
      },
      recentOrders: recentOrders || []
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    return null
  }
}

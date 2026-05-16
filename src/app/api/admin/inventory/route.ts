import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30'
    const days = parseInt(period)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startISO = startDate.toISOString()

    // ── OWN PRODUCTS DATA ─────────────

    // Get all own products with cost
    const { data: ownProducts } = await supabase
      .from('products')
      .select(`
        id, name, slug,
        price, cost_price,
        stock_quantity,
        initial_stock,
        total_invested,
        images,
        is_active,
        category
      `)
      .order('name')

    // Get sales for own products
    const { data: ownSales } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        price,
        order:orders!inner(
          created_at,
          status,
          source
        )
      `)
      .gte('order.created_at', startISO)
      .neq('order.status', 'cancelled')
      .is('dropship_product_id', null)
      // Only own products

    // Aggregate own product sales
    const ownSalesMap: Record<string, {
      units_sold: number
      revenue: number
      orders: number
    }> = {}

    ownSales?.forEach(item => {
      const pid = item.product_id
      if (!pid) return
      if (!ownSalesMap[pid]) {
        ownSalesMap[pid] = {
          units_sold: 0,
          revenue: 0,
          orders: 0,
        }
      }
      ownSalesMap[pid].units_sold += item.quantity || 1
      ownSalesMap[pid].revenue += (item.price || 0) * (item.quantity || 1)
      ownSalesMap[pid].orders += 1
    })

    // Build own products inventory
    const ownInventory = (ownProducts || []).map(p => {
      const sales = ownSalesMap[p.id] || {
        units_sold: 0,
        revenue: 0,
        orders: 0,
      }
      const costPrice = p.cost_price || 0
      const sellPrice = p.price || 0
      const unitProfit = sellPrice - costPrice
      const totalRevenue = sales.revenue
      const totalCost = costPrice * sales.units_sold
      const totalProfit = totalRevenue - totalCost
      const invested = p.total_invested || (costPrice * (p.initial_stock || 0))
      const roi = invested > 0
        ? Math.round((totalProfit / invested) * 100)
        : 0
      const stockValue = costPrice * (p.stock_quantity || 0)

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images?.[0]?.url || null,
        category: p.category,
        is_active: p.is_active,
        // Pricing
        cost_price: costPrice,
        sell_price: sellPrice,
        unit_margin: unitProfit,
        margin_pct: costPrice > 0
          ? Math.round((unitProfit / costPrice) * 100)
          : 0,
        // Stock
        current_stock: p.stock_quantity || 0,
        initial_stock: p.initial_stock || 0,
        stock_value: stockValue,
        // Sales
        units_sold: sales.units_sold,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        total_invested: invested,
        roi_pct: roi,
        // Status
        break_even_units: unitProfit > 0
          ? Math.ceil(invested / unitProfit)
          : null,
        is_profitable: totalProfit > 0,
        health: invested === 0 
          ? 'no_cost'
          : roi >= 100 
            ? 'excellent'
            : roi >= 50 
              ? 'good'
              : roi >= 0 
                ? 'low'
                : 'loss',
      }
    })

    // ── DROPSHIPPING DATA ─────────────

    const { data: dropProducts } = await supabase
      .from('dropship_products')
      .select(`
        id, name,
        cj_price, selling_price,
        is_active, images
      `)

    const { data: dropSales } = await supabase
      .from('order_items')
      .select(`
        dropship_product_id,
        product_name,
        quantity,
        price,
        order:orders!inner(
          created_at,
          status
        )
      `)
      .gte('order.created_at', startISO)
      .neq('order.status', 'cancelled')
      .not('dropship_product_id', 'is', null)

    // Aggregate dropship sales
    const dropSalesMap: Record<string, {
      units_sold: number
      revenue: number
      cj_cost: number
    }> = {}

    dropSales?.forEach(item => {
      const did = item.dropship_product_id
      if (!did) return
      
      const product = dropProducts?.find(p => p.id === did)
      const cjPrice = product?.cj_price || 0
      
      if (!dropSalesMap[did]) {
        dropSalesMap[did] = {
          units_sold: 0,
          revenue: 0,
          cj_cost: 0,
        }
      }
      dropSalesMap[did].units_sold += item.quantity || 1
      dropSalesMap[did].revenue += (item.price || 0) * (item.quantity || 1)
      dropSalesMap[did].cj_cost += cjPrice * (item.quantity || 1)
    })

    const dropInventory = (dropProducts || []).map(p => {
      const sales = dropSalesMap[p.id] || {
        units_sold: 0,
        revenue: 0,
        cj_cost: 0,
      }
      const profit = sales.revenue - sales.cj_cost

      return {
        id: p.id,
        name: p.name,
        image: p.images?.[0]?.url || null,
        is_active: p.is_active,
        cj_price: p.cj_price || 0,
        selling_price: p.selling_price || 0,
        unit_margin: (p.selling_price || 0) - (p.cj_price || 0),
        units_sold: sales.units_sold,
        total_revenue: sales.revenue,
        total_cj_cost: sales.cj_cost,
        total_profit: profit,
        margin_pct: p.cj_price > 0
          ? Math.round(((p.selling_price - p.cj_price) / p.cj_price) * 100)
          : 0,
      }
    })

    // ── GLOBAL SUMMARY ────────────────

    const ownTotals = {
      total_invested: ownInventory.reduce((s, p) => s + p.total_invested, 0),
      total_revenue: ownInventory.reduce((s, p) => s + p.total_revenue, 0),
      total_cost: ownInventory.reduce((s, p) => s + p.total_cost, 0),
      total_profit: ownInventory.reduce((s, p) => s + p.total_profit, 0),
      total_units: ownInventory.reduce((s, p) => s + p.units_sold, 0),
      stock_value: ownInventory.reduce((s, p) => s + p.stock_value, 0),
      products_count: ownInventory.length,
      profitable_count: ownInventory.filter(p => p.is_profitable).length,
    }

    const dropTotals = {
      total_revenue: dropInventory.reduce((s, p) => s + p.total_revenue, 0),
      total_cj_cost: dropInventory.reduce((s, p) => s + p.total_cj_cost, 0),
      total_profit: dropInventory.reduce((s, p) => s + p.total_profit, 0),
      total_units: dropInventory.reduce((s, p) => s + p.units_sold, 0),
      products_count: dropInventory.length,
    }

    const grandTotal = {
      total_revenue: ownTotals.total_revenue + dropTotals.total_revenue,
      total_profit: ownTotals.total_profit + dropTotals.total_profit,
      total_expenses: ownTotals.total_invested + dropTotals.total_cj_cost,
      net_profit: (ownTotals.total_profit + dropTotals.total_profit) - ownTotals.total_invested,
    }

    return NextResponse.json({
      period: days,
      ownProducts: ownInventory,
      dropProducts: dropInventory,
      ownTotals,
      dropTotals,
      grandTotal,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

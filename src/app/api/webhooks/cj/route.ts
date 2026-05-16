import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, messageType, params } = body

    console.log('CJ Webhook Received:', { type, messageType, params })

    // Handle STOCK updates
    if (type === 'STOCK') {
      // params = { vid: [{...stock}] }
      for (const [vid, stockList] of Object.entries(params)) {
        const stockData = stockList as any[]
        
        // Calculate total stock across warehouses
        const totalStock = stockData.reduce(
          (sum, s) => sum + (s.storageNum || 0),
          0
        )
        
        // Update product in Supabase
        // We use dropship_products table in this project
        await (supabase.from('dropship_products') as any)
          .update({
            stock_quantity: totalStock,
            is_active: totalStock > 0,
            last_stock_sync: new Date().toISOString()
          } as any)
          .eq('cj_variant_id', vid)
        
        // Notify admin if stock = 0
        if (totalStock === 0) {
          await (supabase.from('admin_notifications') as any)
            .insert({
              type: 'stock_empty',
              title: '⚠️ Stock épuisé CJ',
              message: `La variante CJ (ID: ${vid}) est désormais en rupture de stock.`,
              created_at: new Date().toISOString()
            })
        }
      }
    }

    // Handle PRODUCT updates
    if (type === 'PRODUCT') {
      const { pid, productStatus } = params
      
      // productStatus: 2=removed, 3=onsale
      if (productStatus === 2) {
        await (supabase.from('dropship_products') as any)
          .update({ 
            is_active: false,
            cj_status: 'REMOVED'
          } as any)
          .eq('cj_product_id', pid)
      }
    }

    // Always return 200 within 3 seconds (CJ requirement)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('CJ Webhook Error:', error)
    // Still return 200 to CJ to stop retries, but log error
    return NextResponse.json({ success: true, error: error.message })
  }
}

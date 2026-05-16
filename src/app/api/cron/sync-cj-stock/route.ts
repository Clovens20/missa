import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCJToken } from '@/lib/cj-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1'

// This route is called by a cron job every hour to sync CJ stock
export async function GET(req: Request) {
  // Security check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If not bearer, check if it's a manual trigger from admin with public key
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Get all active products that come from CJ
    const { data: products } = await supabase
      .from('dropship_products')
      .select('id, name, cj_product_id, stock_quantity, is_active')
      .not('cj_product_id', 'is', null)

    if (!products?.length) {
      return NextResponse.json({
        message: 'No CJ products to sync',
        synced: 0,
      })
    }

    // Get fresh CJ token
    const token = await getCJToken()

    if (!token) {
      return NextResponse.json({ error: 'CJ auth failed' }, { status: 500 })
    }

    let synced = 0
    let outOfStock = 0
    let errors = 0
    const updates: any[] = []

    // Sync each product
    for (const product of products) {
      try {
        // Get real-time stock from CJ
        const res = await fetch(
          `${CJ_API_URL}/product/query?pid=${product.cj_product_id}`,
          {
            method: 'GET',
            headers: {
              'CJ-Access-Token': token,
              'Content-Type': 'application/json',
            },
          }
        )
        const data = await res.json()
        const cjProduct = data?.data

        if (!cjProduct) {
          // Product removed from CJ
          await supabase
            .from('dropship_products')
            .update({
              stock_quantity: 0,
              is_active: false,
              cj_status: 'REMOVED',
              last_stock_sync: new Date().toISOString(),
            })
            .eq('id', product.id)

          outOfStock++
          continue
        }

        // Calculate new total stock
        const newStock = cjProduct.variants?.reduce(
          (sum: number, v: any) => sum + (v.variantStock || 0),
          0
        ) || cjProduct.productStock || 0

        // Only update if stock changed
        if (newStock !== product.stock_quantity) {
          updates.push({
            id: product.id,
            stock_quantity: newStock,
            is_active: newStock > 0,
            cj_status: cjProduct.productStatus || 'ENABLE',
            last_stock_sync: new Date().toISOString(),
            cj_variants: cjProduct.variants || []
          })

          if (newStock === 0) outOfStock++
        }

        synced++

        // Small delay to avoid CJ rate limiting
        await new Promise(r => setTimeout(r, 200))

      } catch (err) {
        console.error(`Error syncing product ${product.id}:`, err)
        errors++
      }
    }

    // Bulk update changed products
    if (updates.length > 0) {
      for (const update of updates) {
        const { id, ...data } = update
        await supabase
          .from('dropship_products')
          .update(data)
          .eq('id', id)
      }
    }

    // Log the sync
    await supabase
      .from('sync_logs')
      .insert({
        type: 'cj_stock_sync',
        synced_count: synced,
        out_of_stock_count: outOfStock,
        error_count: errors,
        updated_count: updates.length,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      synced,
      updated: updates.length,
      out_of_stock: outOfStock,
      errors,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const limit = parseInt(searchParams.get('limit') || '24')
    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'newest'
    const category = searchParams.get('category') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '9999')
    const inStock = searchParams.get('inStock') === 'true'
    const onSale = searchParams.get('onSale') === 'true'

    // ── Build query ───────────────────
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .gte('price', minPrice)
      .lte('price', maxPrice)

    if (category) {
      query = query.eq('category', category)
    }

    if (inStock) {
      query = query.gt('stock_quantity', 0)
    }

    if (onSale) {
      query = query
        .not('compare_price', 'is', null)
        .gt('compare_price', 0)
    }

    // Sorting
    switch (sort) {
      case 'popular':
        query = query.order('sold_count', { ascending: false })
        break
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'rating':
        query = query.order('review_avg', { ascending: false })
        break
      case 'discount':
        query = query.order('compare_price', { ascending: false })
        break
      default: // newest
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data: products, count } = await query

    // ── Get categories ────────────────
    const { data: catData } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)

    const categories = [
      ...new Set(
        catData?.map(p => p.category)
          .filter(Boolean)
      )
    ].sort()

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      categories,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

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
    
    const q = searchParams.get('q') || ''
    const page = parseInt(
      searchParams.get('page') || '1'
    )
    const limit = parseInt(
      searchParams.get('limit') || '20'
    )
    const sortBy = 
      searchParams.get('sort') || 
      'relevant'
    const minPrice = parseFloat(
      searchParams.get('minPrice') || '0'
    )
    const maxPrice = parseFloat(
      searchParams.get('maxPrice') || '9999'
    )
    const colors = searchParams
      .get('colors')?.split(',')
      .filter(Boolean) || []
    const sizes = searchParams
      .get('sizes')?.split(',')
      .filter(Boolean) || []
    const categories = searchParams
      .get('categories')?.split(',')
      .filter(Boolean) || []
    const inStock = 
      searchParams.get('inStock') === 'true'
    const onSale = 
      searchParams.get('onSale') === 'true'
    const suggestions = 
      searchParams.get('suggestions') === 
      'true'

    // ── SUGGESTIONS MODE ───────────────
    if (suggestions && q.length >= 2) {
      
      // Get matching products
      const { data: products } = 
        await supabase
          .from('products')
          .select('id, name, slug, price, images, category')
          .eq('is_active', true)
          .ilike('name', `%${q}%`)
          .limit(5)

      // Get matching categories
      const { data: cats } = 
        await supabase
          .from('products')
          .select('category')
          .eq('is_active', true)
          .ilike('category', `%${q}%`)
          .limit(3)

      // Get popular searches
      const { data: popular } = 
        await supabase
          .from('search_history')
          .select('query')
          .ilike('query', `%${q}%`)
          .order('created_at', 
            { ascending: false })
          .limit(3)

      const uniqueCats = [
        ...new Set(
          cats?.map(c => c.category)
            .filter(Boolean)
        )
      ]

      return NextResponse.json({
        products: products || [],
        categories: uniqueCats,
        popularSearches: popular?.map(
          p => p.query
        ) || [],
      })
    }

    // ── FULL SEARCH ────────────────────
    let query = supabase
      .from('products')
      .select(`
        *,
        review_count,
        review_avg
      `, { count: 'exact' })
      .eq('is_active', true)
      .gte('price', minPrice)
      .lte('price', maxPrice)

    // Text search
    if (q.trim()) {
      query = query.or(
        `name.ilike.%${q}%,` +
        `description.ilike.%${q}%,` +
        `category.ilike.%${q}%,` +
        `tags.cs.{${q}}`
      )
    }

    // Category filter
    if (categories.length > 0) {
      query = query.in(
        'category', categories
      )
    }

    // In stock filter
    if (inStock) {
      query = query.gt(
        'stock_quantity', 0
      )
    }

    // On sale filter
    if (onSale) {
      query = query.not(
        'compare_price', 'is', null
      )
    }

    // Color filter
    if (colors.length > 0) {
      query = query.overlaps(
        'available_colors', colors
      )
    }

    // Size filter  
    if (sizes.length > 0) {
      query = query.overlaps(
        'available_sizes', sizes
      )
    }

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', 
          { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', 
          { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', 
          { ascending: false })
        break
      case 'popular':
        query = query.order('sold_count', 
          { ascending: false })
        break
      case 'rating':
        query = query.order('review_avg', 
          { ascending: false })
        break
      default: // relevant
        if (q.trim()) {
          query = query.order('sold_count', 
            { ascending: false })
        } else {
          query = query.order('created_at', 
            { ascending: false })
        }
    }

    // Pagination
    const from = (page - 1) * limit
    query = query.range(
      from, from + limit - 1
    )

    const { data: products, count } = 
      await query

    // Log search
    if (q.trim() && !suggestions) {
      await supabase
        .from('search_history')
        .insert({
          query: q.trim().toLowerCase(),
          results_count: count || 0,
        })
    }

    // Get available filters 
    // for current results
    const { data: filterData } = 
      await supabase
        .from('products')
        .select(
          'category, available_colors, available_sizes, price'
        )
        .eq('is_active', true)
        .ilike('name', q ? `%${q}%` : '%')

    const allCategories = [
      ...new Set(
        filterData?.map(p => p.category)
          .filter(Boolean)
      )
    ]
    
    const allColors = [
      ...new Set(
        filterData?.flatMap(
          p => p.available_colors || []
        ).filter(Boolean)
      )
    ]

    const allSizes = [
      ...new Set(
        filterData?.flatMap(
          p => p.available_sizes || []
        ).filter(Boolean)
      )
    ]

    const prices = filterData?.map(
      p => p.price
    ).filter(Boolean) || []
    
    const priceRange = {
      min: Math.floor(Math.min(...prices) || 0),
      max: Math.ceil(Math.max(...prices) || 500),
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      totalPages: Math.ceil(
        (count || 0) / limit
      ),
      filters: {
        categories: allCategories,
        colors: allColors,
        sizes: allSizes,
        priceRange,
      },
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

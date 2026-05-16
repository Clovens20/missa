import { NextResponse } from 'next/server'
import { searchWithSupplierData } from '@/lib/cj-api'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    let searchTerm = query
    
    // ── URL DETECTION & PARSING ──
    if (query.includes('aliexpress.com') || query.includes('alibaba.com')) {
      try {
        // Extract product name from URL
        // Example: aliexpress.com/item/100500123.html or alibaba.com/product-detail/name_123.html
        const urlObj = new URL(query)
        const pathParts = urlObj.pathname.split('/')
        const lastPart = pathParts[pathParts.length - 1]
        
        // Clean name (remove .html, replace - with space)
        searchTerm = lastPart
          .replace(/\.html.*$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\d+/g, '') // Remove long IDs
          .trim()
        
        if (searchTerm.length < 5) {
          // If extracted name too short, try middle part
          searchTerm = pathParts[pathParts.length - 2]?.replace(/[-_]/g, ' ') || searchTerm
        }
      } catch (e) {
        // Fallback to query
      }
    }

    // Check cache first
    const cacheKey = `search:${query}:${page}:${category}`
    const { data: cached } = await supabase
      .from('cj_search_cache')
      .select('results, expires_at')
      .eq('search_key', cacheKey)
      .single()

    if (cached && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({
        ...cached.results,
        fromCache: true,
      })
    }

    // Search CJ API
    const results = await searchWithSupplierData({
      productName: searchTerm,
      categoryId: category || undefined,
      pageNum: page,
      pageSize: 20,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    })

    // Cache for 1 hour
    await supabase
      .from('cj_search_cache')
      .upsert({
        search_key: cacheKey,
        results,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'search_key' })

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

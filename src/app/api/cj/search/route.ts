import { NextResponse } from 'next/server'
import { searchWithSupplierData } from '@/lib/cj-api'
import { translateToCJ } from '@/lib/cj-translate'
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
    
    // ── ID DETECTION ──
    // If query is just a long number, search by ID directly
    const isCJId = /^\d{15,25}$/.test(query.trim())
    
    // ── URL DETECTION & PARSING ──
    if (query.includes('aliexpress.com') || query.includes('alibaba.com') || query.includes('amazon.com')) {
      try {
        const urlObj = new URL(query)
        const path = urlObj.pathname.toLowerCase()
        
        // Remove common URL clutter
        const cleanPath = path
          .replace(/\.html.*$/, '')
          .replace(/product-detail\//g, '')
          .replace(/item\//g, '')
          .replace(/\/$/, '')
        
        const pathParts = cleanPath.split('/')
        const lastPart = pathParts[pathParts.length - 1]
        
        // Extract words, keeping alphanumeric ones longer than 2 chars
        // We no longer strip ALL numbers, just standalone long IDs
        const words = lastPart
          .split(/[-_]/)
          .filter(w => w.length > 2 && !/^\d{10,}$/.test(w))
          
        searchTerm = words.join(' ')
        
        // Strategy 2: Check common query params if path is too short
        if (searchTerm.length < 5) {
          searchTerm = urlObj.searchParams.get('title') || 
                      urlObj.searchParams.get('key') || 
                      urlObj.searchParams.get('q') || 
                      searchTerm
        }
        
        console.log(`🔗 [DEBUG] Extracted search term from URL: "${searchTerm}"`)
      } catch (e) {
        console.warn('⚠️ [DEBUG] Failed to parse URL, using raw query')
      }
    }

    // ── TRANSLATION ──
    const { translated, wasTranslated } = translateToCJ(searchTerm)
    const finalSearchTerm = translated

    // Check cache first
    const cacheKey = `search:${query}:${page}:${category}`
    try {
      const { data: cached } = await supabase
        .from('cj_search_cache')
        .select('results, expires_at')
        .eq('search_key', cacheKey)
        .single()

      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log('⚡ [DEBUG] Serving from cache')
        return NextResponse.json({
          ...cached.results,
          fromCache: true,
        })
      }
    } catch (cacheErr) {
      // Ignore cache errors
    }

    // Search CJ API
    console.log('🔍 [DEBUG] Starting CJ Search for:', isCJId ? query : finalSearchTerm)
    
    const results = await searchWithSupplierData({
      productName: isCJId ? undefined : finalSearchTerm,
      productId: isCJId ? query.trim() : undefined,
      categoryId: category || undefined,
      pageNum: page,
      pageSize: 20,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    })

    console.log('📦 [DEBUG] CJ Raw Results Count:', results?.list?.length || 0)
    
    // ── FALLBACK STRATEGY ──
    // If no results, try a broader search (first 2 words only)
    if (results?.list?.length === 0 && finalSearchTerm.split(' ').length > 2) {
      const broadTerm = finalSearchTerm.split(' ').slice(0, 2).join(' ')
      console.log('🔄 [DEBUG] Trying broad fallback search:', broadTerm)
      const fallbackResults = await searchWithSupplierData({
        productName: broadTerm,
        pageNum: 1,
        pageSize: 10
      })
      if (fallbackResults?.list?.length > 0) {
        results.list = fallbackResults.list
        results.total = fallbackResults.total
        console.log(`✅ [DEBUG] Fallback found ${results.list.length} products`)
      }
    }

    // Cache results for 1 hour
    if (results?.list?.length > 0) {
      try {
        await supabase
          .from('cj_search_cache')
          .upsert({
            search_key: cacheKey,
            results,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'search_key' })
      } catch (dbErr) {
        console.warn('⚠️ [DEBUG] Failed to cache results')
      }
    }

    return NextResponse.json({
      ...results,
      search_info: {
        original: query,
        searchTerm: searchTerm,
        translated: finalSearchTerm,
        was_translated: wasTranslated,
        count: results?.list?.length || 0,
        debug_info: 'Optimization applied: nested parsing + broad fallback'
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

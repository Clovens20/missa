import { NextResponse } from 'next/server'
import { getCJToken, searchCJProducts } from '@/lib/cj-api'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CJ_API_URL = process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1'

// ── Extract keywords from image filename/metadata ──
function extractKeywordsFromFile(filename: string): string[] {
  const clean = filename
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
  
  return clean.split(' ')
    .filter(w => w.length > 2)
    .slice(0, 3)
}

// ── Smart fallback search ──
async function smartFallbackSearch(keywords: string[], category?: string): Promise<any[]> {
  const searchTerms = [
    keywords.join(' '),
    keywords[0] || 'fashion',
    'women ' + (keywords[0] || 'dress'),
    keywords.join(' ') + ' fashion',
  ]

  const allResults: any[] = []
  
  for (const term of searchTerms) {
    try {
      await new Promise(r => setTimeout(r, 1100))
      
      const results = await searchCJProducts({
        productName: term,
        categoryId: category,
        pageNum: 1,
        pageSize: 10,
        sortField: 'quantity',
        sortOrder: 'DESC',
      })
      
      const list = results?.list || []
      
      // Add unique products only
      list.forEach((p: any) => {
        const pid = p.pid || p.productId
        if (!allResults.find(r => (r.pid || r.productId) === pid)) {
          allResults.push({
            ...p,
            _matchScore: term === searchTerms[0] ? 100 : 50,
            supplierInfo: {
              supplierName: p.supplierName || 'CJDropshipping',
              countryCode: p.countryCode || 'CN',
              productSales: p.productSales || p.saleNum || 0,
              productScore: p.productScore || 4.5,
              supplierScore: p.supplierScore || 4.5,
              reviewCount: p.commentNum || 0,
              processingTime: p.processingTime || '2-5 days',
              shippingFromUS: p.countryCode === 'US',
            }
          })
        }
      })

      if (allResults.length >= 20) break
      
    } catch (err) {
      continue
    }
  }

  // Sort by sales
  return allResults.sort((a, b) => 
    (b.supplierInfo?.productSales || 0) - (a.supplierInfo?.productSales || 0)
  ).slice(0, 20)
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null
    const pageNum = parseInt(formData.get('pageNum') as string) || 1

    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { error: 'Image required' },
        { status: 400 }
      )
    }

    let cjSearchSuccess = false
    let results: any[] = []
    let searchMethod = 'fallback'

    // ── METHOD 1: Try CJ Image Search ──
    try {
      const token = await getCJToken()
      let requestBody: any

      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        requestBody = {
          imageBase64: base64,
          pageNum,
          pageSize: 20,
        }
      } else {
        requestBody = {
          imageUrl,
          pageNum,
          pageSize: 20,
        }
      }

      // Add delay to respect rate limit
      await new Promise(r => setTimeout(r, 1100))

      const response = await fetch(
        `${CJ_API_URL}/product/searchByImage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
          body: JSON.stringify(requestBody),
        }
      )

      const data = await response.json()

      if (data.code === 200 && data.data?.list?.length > 0) {
        cjSearchSuccess = true
        searchMethod = 'cj_image'
        results = data.data.list.map((p: any) => ({
          ...p,
          supplierInfo: {
            supplierName: p.supplierName || 'CJDropshipping',
            countryCode: p.countryCode || 'CN',
            productSales: p.productSales || 0,
            productScore: p.productScore || 4.5,
            supplierScore: p.supplierScore || 4.5,
            reviewCount: p.commentNum || 0,
            processingTime: p.processingTime || '2-5 days',
            shippingFromUS: p.countryCode === 'US',
          }
        }))
      }
    } catch (cjError) {
      // CJ image search failed, use fallback
      console.log('CJ image search failed, using fallback')
    }

    // ── METHOD 2: Smart Fallback ──
    if (!cjSearchSuccess) {
      // Extract keywords from filename or use popular terms
      let keywords: string[] = []
      
      if (imageFile) {
        keywords = extractKeywordsFromFile(imageFile.name)
      } else if (imageUrl) {
        // Extract from URL path
        const urlParts = imageUrl.split('/').pop() || ''
        keywords = extractKeywordsFromFile(urlParts)
      }

      // Default to popular categories if no keywords found
      if (keywords.length === 0) {
        keywords = ['women', 'fashion']
      }

      results = await smartFallbackSearch(keywords)
      searchMethod = 'smart_text'
    }

    return NextResponse.json({
      list: results,
      total: results.length,
      searchMethod,
      cjImageSearchAvailable: cjSearchSuccess,
      message: cjSearchSuccess
        ? 'Résultats par analyse visuelle CJ'
        : 'Résultats par recherche intelligente',
    })

  } catch (error: any) {
    // Final fallback: return trending products
    try {
      await new Promise(r => setTimeout(r, 1100))
      const trending = await searchCJProducts({
        productName: 'women fashion',
        pageNum: 1,
        pageSize: 20,
        sortField: 'quantity',
        sortOrder: 'DESC',
      })
      
      return NextResponse.json({
        list: trending?.list || [],
        total: trending?.list?.length || 0,
        searchMethod: 'trending_fallback',
        message: 'Produits tendance',
      })
    } catch {
      return NextResponse.json({
        list: [],
        total: 0,
        error: error.message,
        searchMethod: 'failed',
      })
    }
  }
}

import { NextResponse } from 'next/server'
import { getCJToken, searchByImage, extractKeywordsFromUrl, searchWithSupplierData } from '@/lib/cj-api'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null

    if (!imageFile && !imageUrl) {
      return NextResponse.json({ error: 'Image or URL required' }, { status: 400 })
    }

    // ── CASE 1: Alibaba/AliExpress URL ──
    if (imageUrl && (imageUrl.includes('aliexpress.com') || imageUrl.includes('alibaba.com'))) {
      const keywords = extractKeywordsFromUrl(imageUrl)
      if (keywords.length > 0) {
        const results = await searchWithSupplierData({
          productName: keywords.join(' '),
          pageSize: 20
        })
        return NextResponse.json({
          list: results.list || [],
          total: results.total || 0,
          searchMethod: 'smart_link',
          message: `Recherche basée sur le lien: ${keywords.join(' ')}`
        })
      }
    }

    // ── CASE 2: Image Search (File or URL) ──
    try {
      const data = await searchByImage(imageFile || imageUrl!)
      if (data?.list?.length > 0) {
        return NextResponse.json({
          list: data.list,
          total: data.list.length,
          searchMethod: 'cj_image',
          message: 'Analyse visuelle CJ réussie'
        })
      }
    } catch (cjError: any) {
      console.warn('CJ Image Search failed, trying fallback:', cjError.message)
    }

    // ── CASE 3: Smart Fallback (Keywords from filename/URL) ──
    const nameToParse = imageFile ? imageFile.name : (imageUrl || '')
    const keywords = extractKeywordsFromUrl(nameToParse)
    const fallbackTerms = keywords.length > 0 ? keywords.join(' ') : 'new fashion'
    
    const fallbackResults = await searchWithSupplierData({
      productName: fallbackTerms,
      pageSize: 20
    })

    return NextResponse.json({
      list: fallbackResults.list || [],
      total: fallbackResults.total || 0,
      searchMethod: 'smart_text',
      message: 'Recherche par mots-clés (IA)'
    })

  } catch (error: any) {
    console.error('Image search final error:', error)
    return NextResponse.json({ error: error.message, list: [], total: 0 }, { status: 500 })
  }
}

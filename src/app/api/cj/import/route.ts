import { NextResponse } from 'next/server'
import { 
  getCJProductDetail,
  getCJProductMedia,
  calculateSellingPrice,
  verifyCJStock
} from '@/lib/cj-api'
import { createClient } from 
  '@supabase/supabase-js'
import { slugify } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: Request
) {
  try {
    const body = await request.json()
    const { 
      pid,
      // Import config
      sellingPrice,
      comparePrice,
      categoryId,
      customName,
      customDescription,
      // Images: array of selected urls
      selectedImages,
      // boolean: keep video or not
      includeVideo,
      // Tags array
      tags,
      // Variants config
      variants,
    } = body

    if (!pid) {
      return NextResponse.json(
        { error: 'pid required' },
        { status: 400 }
      )
    }

    // Check if already imported
    const { data: existing } = 
      await supabase
        .from('dropship_products')
        .select('id, name')
        .eq('cj_product_id', pid)
        .single()

    if (existing) {
      return NextResponse.json(
        { 
          error: 'Produit déjà importé',
          existingId: existing.id,
          existingName: existing.name,
        },
        { status: 409 }
      )
    }

    // Get full product detail from CJ
    const [cjProduct, mediaData] = 
      await Promise.all([
        getCJProductDetail(pid),
        getCJProductMedia(pid),
      ])
    
    if (!cjProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé sur CJ' },
        { status: 404 }
      )
    }

    // ✅ Verify real stock before import
    const firstVid = cjProduct.variants?.[0]?.vid
    if (firstVid) {
      const realStock = await verifyCJStock(firstVid)
      if (realStock === 0) {
        return NextResponse.json({
          error: '❌ Stock épuisé sur CJ pour la variante principale',
          code: 'OUT_OF_STOCK'
        }, { status: 400 })
      }
    }

    // Get markup setting
    const { data: markupSetting } = 
      await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 
          'dropship_markup_percentage')
        .single()
    
    const markup = parseInt(
      markupSetting?.value || '150'
    )

    const rawCjPrice = cjProduct.sellPrice || cjProduct.productPrice || '0'
    const cjPrice = typeof rawCjPrice === 'string'
      ? parseFloat(rawCjPrice.split('-')[0])
      : parseFloat(rawCjPrice.toString())
    
    const finalSellingPrice = 
      sellingPrice || 
      calculateSellingPrice(cjPrice, markup)
    
    const finalComparePrice = 
      comparePrice || 
      finalSellingPrice * 1.25

    // Build SELECTED images array
    // (filtered by admin choice)
    const finalImages = selectedImages?.length > 0
      ? selectedImages.map(
          (url: string, i: number) => ({
            url,
            alt: customName || 
              cjProduct.productNameEn || 
              cjProduct.productName,
            is_primary: i === 0,
          })
        )
      : mediaData.images
          .filter(img => img.selected)
          .map((img, i) => ({
            url: img.url,
            alt: img.alt,
            is_primary: i === 0,
          }))

    // Build variants with images
    const finalVariants = 
      variants?.length > 0 
        ? variants
        : (Array.isArray(cjProduct.variants) ? cjProduct.variants : [])
            .map((v: any) => {
              const properties = Array.isArray(v.variantProperty) ? v.variantProperty : []
              return {
                id: v.vid,
                vid: v.vid,
                sku: v.variantSku,
                size: properties.find(
                  (p: any) => 
                    p.propertyName
                      ?.toLowerCase() === 'size'
                )?.propertyValueEn,
                color: properties.find(
                  (p: any) => 
                    p.propertyName
                      ?.toLowerCase() === 'color'
                )?.propertyValueEn,
                image: v.variantImage || null,
                stock: v.variantStock || 999,
                cjPrice: parseFloat(
                  v.variantSellPrice || cjPrice
                ),
                properties: properties,
              }
            })

    const productName = customName || 
      cjProduct.productNameEn || 
      cjProduct.productName

    // Build description
    const finalDescription = 
      customDescription || 
      cjProduct.description || 
      cjProduct.productNameEn ||
      ''

    // Build tags
    const finalTags = tags?.length > 0 
      ? tags 
      : [
          cjProduct.categoryName,
          cjProduct.materialEn,
        ].filter(Boolean)

    // Calculate total stock
    const totalStock = cjProduct.variants?.reduce(
      (sum: number, v: any) => sum + (v.variantStock || 0),
      0
    ) || cjProduct.productStock || 0

    // Insert into dropship_products
    const { data: inserted, error } = 
      await supabase
        .from('dropship_products')
        .insert({
          cj_product_id: pid,
          cj_category_id: 
            cjProduct.categoryId,
          cj_category_name: 
            cjProduct.categoryName,
          name: productName,
          slug: slugify(productName) + 
            '-' + pid.substring(0, 6),
          description: finalDescription,
          short_description: 
            finalDescription
              .substring(0, 150) + '...',
          material: 
            cjProduct.materialEn || 
            cjProduct.productMaterial,
          cj_price: cjPrice,
          selling_price: finalSellingPrice,
          compare_price: finalComparePrice,
          profit_margin: 
            finalSellingPrice - cjPrice,
          shipping_time: '7-15 jours',
          shipping_from: 
            cjProduct.countryCode || 'CN',
          variants: finalVariants,
          images: finalImages,
          video_url: includeVideo 
            ? mediaData.video 
            : null,
          stock_quantity: totalStock,
          cj_variants: finalVariants,
          cj_status: cjProduct.productStatus || 'ENABLE',
          last_stock_sync: new Date().toISOString(),
          supplier: 'cj',
          category_id: categoryId || null,
          tags: finalTags,
          is_active: totalStock > 0,
          is_dropship: true,
          weight: typeof cjProduct.productWeight === 'string' 
            ? parseFloat(cjProduct.productWeight.split('-')[0]) 
            : cjProduct.productWeight,
          availability_type: 'worldwide',
          available_countries: ['*'],
        })
        .select()
        .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      product: inserted,
      message: 'Produit importé avec succès!',
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

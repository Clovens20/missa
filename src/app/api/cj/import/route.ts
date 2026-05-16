import { NextResponse } from 'next/server'
import { 
  getCJProductDetail,
  getCJProductMedia,
  calculateSellingPrice 
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

    const cjPrice = parseFloat(
      cjProduct.sellPrice || 
      cjProduct.productPrice || 0
    )
    
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
        : (cjProduct.variants || [])
            .map((v: any) => ({
              id: v.vid,
              vid: v.vid,
              sku: v.variantSku,
              size: v.variantProperty?.find(
                (p: any) => 
                  p.propertyName
                    .toLowerCase() === 'size'
              )?.propertyValueEn,
              color: v.variantProperty?.find(
                (p: any) => 
                  p.propertyName
                    .toLowerCase() === 'color'
              )?.propertyValueEn,
              image: v.variantImage || null,
              stock: v.variantStock || 999,
              price: parseFloat(
                v.variantSellPrice || cjPrice
              ),
              properties: 
                v.variantProperty || [],
            }))

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
          stock_quantity: 
            cjProduct.productStock || 999,
          category_id: categoryId || null,
          tags: finalTags,
          is_active: false,
          is_dropship: true,
          weight: cjProduct.productWeight,
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

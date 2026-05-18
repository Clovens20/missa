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
import { getColorHex } from '@/lib/colors'
import { generateFakeReviewsForProduct } from '@/lib/fake-reviews'

function cleanHtml(html: string): string {
  if (!html) return ''
  
  let text = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
  
  // Clean line spaces and filter out consecutive empty lines
  return text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

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
    const cjPriceUSD = typeof rawCjPrice === 'string'
      ? parseFloat(rawCjPrice.split('-')[0])
      : parseFloat(rawCjPrice.toString())
      
    const USD_TO_CAD_RATE = 1.38 // Taux de change USD vers CAD
    const cjPrice = parseFloat((cjPriceUSD * USD_TO_CAD_RATE).toFixed(2))
    
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
                color_hex: getColorHex(properties.find(
                  (p: any) => 
                    p.propertyName
                      ?.toLowerCase() === 'color'
                )?.propertyValueEn || ''),
                image: v.variantImage || null,
                stock: v.variantStock || 999,
                cjPrice: parseFloat(
                  v.variantSellPrice || cjPrice
                ),
                properties: properties,
              }
            })

    // Utilitaire de traduction Google (Gratuit) avec découpage
    async function translateToFr(text: string) {
      if (!text || text.length < 3) return text;
      
      const translateChunk = async (chunk: string) => {
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `q=${encodeURIComponent(chunk)}`
          });
          const data = await res.json();
          let translated = '';
          if (data && data[0]) {
            data[0].forEach((item: any) => { if (item[0]) translated += item[0]; });
          }
          return translated || chunk;
        } catch (err) {
          console.error("Translation error on chunk:", err);
          return chunk;
        }
      };

      if (text.length <= 1500) {
        return await translateChunk(text);
      }

      // Si le texte est très long, on le découpe en essayant de ne pas couper au milieu d'une phrase
      const chunks = text.match(/.{1,1500}(?:\s|$)/g) || [text];
      const translatedChunks = [];
      for (const chunk of chunks) {
        translatedChunks.push(await translateChunk(chunk));
      }

      return translatedChunks.join(' ');
    }

    const rawProductName = customName || 
      cjProduct.productNameEn || 
      cjProduct.productName

    const productName = customName ? rawProductName : await translateToFr(rawProductName);

    // Build and clean description
    const rawDescription = 
      customDescription || 
      cjProduct.description || 
      cjProduct.productNameEn ||
      ''
    
    const cleanedDescription = cleanHtml(rawDescription)
    const finalDescription = customDescription ? cleanedDescription : await translateToFr(cleanedDescription)

    // Build tags
    const finalTags = tags?.length > 0 
      ? tags 
      : [
          cjProduct.categoryName,
          cjProduct.materialEn,
        ].filter(Boolean)

    // Calculate total stock from final variants (which have a fallback of 999)
    const totalStock = finalVariants?.reduce(
      (sum: number, v: any) => sum + (v.stock || 0),
      0
    ) || cjProduct.productStock || 999

    // Generate random engagement metrics
    const randomSoldCount = Math.floor(Math.random() * 150) + 20; // 20 to 169
    const contextStr = `${cjProduct.categoryName || ''} ${productName} ${finalTags.join(' ')}`;
    const fakeReviewsData = generateFakeReviewsForProduct("DUMMY_ID", contextStr);
    const randomReviewCount = fakeReviewsData.reviewCount;
    const randomRating = fakeReviewsData.reviewAvg;

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
          sold_count: randomSoldCount,
          rating: randomRating,
          review_count: randomReviewCount,
        })
        .select()
        .single()

    if (error) throw error

    // Insert the generated reviews
    const reviewsToInsert = fakeReviewsData.reviews.map(r => ({
      ...r,
      product_id: inserted.id
    }));
    const { error: reviewsError } = await supabase.from('product_reviews').insert(reviewsToInsert);
    if (reviewsError) {
      console.error('Failed to insert fake reviews:', reviewsError);
    }

    // ✅ Sync directly to main products table to appear on storefront immediately
    const { error: prodError } = await supabase
      .from('products')
      .insert({
        id: inserted.id, // Share the exact same ID
        name: inserted.name,
        slug: inserted.slug,
        description: inserted.description,
        short_description: inserted.short_description,
        price: inserted.selling_price,
        compare_price: inserted.compare_price,
        cost_price: inserted.cj_price, // cj_price maps to cost_price in main table
        stock_quantity: inserted.stock_quantity,
        images: inserted.images,
        category_id: inserted.category_id,
        tags: inserted.tags,
        is_active: inserted.is_active,
        is_dropship: true,
        supplier: 'cj',
        cj_product_id: inserted.cj_product_id,
        shipping_time: inserted.shipping_time,
        shipping_from: inserted.shipping_from,
        sku: inserted.cj_product_id,
        weight: inserted.weight,
        cj_status: inserted.cj_status,
        last_stock_sync: inserted.last_stock_sync,
        availability_type: 'worldwide',
        available_countries: ['*'],
        variants: finalVariants,
        colors: [...new Set(finalVariants.map((v: any) => v.color).filter(Boolean))],
        sizes: [...new Set(finalVariants.map((v: any) => v.size).filter(Boolean))],
        sold_count: randomSoldCount,
        rating: randomRating,
        review_count: randomReviewCount,
        review_avg: randomRating,
      })
      
    if (prodError) {
      console.error('Failed to sync CJ product to main products table:', prodError)
      // We do not throw error so the dropship import isn't considered "failed", but we log it.
    }

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

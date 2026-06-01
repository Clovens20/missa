import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addEproloProduct } from '@/lib/eprolo'
import { slugify } from '@/lib/utils'
import { generateFakeReviewsForProduct } from '@/lib/fake-reviews'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      pid, 
      sellingPrice, 
      categoryId, 
      subcategoryId,
      wholesale_moq,
      _eproloData,
      customName,
      customDescription,
      selectedImages,
      tags
    } = body

    if (!pid) {
      return NextResponse.json({ error: 'pid required' }, { status: 400 })
    }

    // Check if already imported
    const { data: existing } = await supabase
      .from('dropship_products')
      .select('id, name')
      .eq('cj_product_id', pid)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Produit déjà importé', existingId: existing.id, existingName: existing.name },
        { status: 409 }
      )
    }

    // We must ADD the product to our Eprolo account before importing to our store
    // This adds it to Eprolo and returns the full product details.
    const addResult = await addEproloProduct([pid])
    
    if (addResult.code !== '0' && addResult.code !== 0) {
      throw new Error(addResult.msg || 'Failed to add product to Eprolo account')
    }

    const rawProduct = addResult.data?.[0] || _eproloData
    
    if (!rawProduct) {
      throw new Error('Eprolo product data is missing after adding.')
    }

    const eproloPrice = parseFloat(rawProduct.variantlist?.[0]?.cost || '0')
    const USD_TO_CAD_RATE = 1.38
    const costPrice = parseFloat((eproloPrice * USD_TO_CAD_RATE).toFixed(2))
    const finalSellingPrice = sellingPrice || parseFloat((costPrice * 2.5).toFixed(2))
    const finalComparePrice = parseFloat((finalSellingPrice * 1.25).toFixed(2))

    let mappedImages = Array.isArray(rawProduct.imagelist)
      ? rawProduct.imagelist.map((img: any, i: number) => ({
          url: img.src || img.url,
          alt: rawProduct.title,
          is_primary: i === 0
        }))
      : [
          { url: rawProduct.imagefirst || 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80', alt: rawProduct.title, is_primary: true }
        ]

    // Override with selected images if provided
    if (selectedImages && Array.isArray(selectedImages) && selectedImages.length > 0) {
      mappedImages = selectedImages.map((url: string, i: number) => ({
        url,
        alt: customName || rawProduct.title,
        is_primary: i === 0
      }))
    }

    const mappedVariants = Array.isArray(rawProduct.variantlist)
      ? rawProduct.variantlist.map((v: any) => ({
          id: v.id,
          vid: v.id,
          sku: v.sku,
          size: v.option2 || v.option3 || null,
          color: v.option1 || null,
          image: v.imagesid ? rawProduct.imagelist?.find((i: any) => i.id === v.imagesid)?.src : null,
          stock: v.inventory_quantity || 99,
          cjPrice: parseFloat(v.cost || eproloPrice)
        }))
      : []

    const totalStock = mappedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || rawProduct.stock || 99
    const productName = customName || rawProduct.title || rawProduct.name || 'Produit EPROLO'
    const slug = slugify(productName) + '-' + pid.substring(0, 6)
    const description = customDescription || rawProduct.description || productName

    // Generate random engagement metrics
    const randomSoldCount = Math.floor(Math.random() * 150) + 20
    const fakeReviewsData = generateFakeReviewsForProduct("DUMMY_ID", productName, productName)

    const finalTags = tags || ['EPROLO']

    // Insert into dropship_products
    const { data: inserted, error } = await supabase
      .from('dropship_products')
      .insert({
        cj_product_id: pid,
        cj_category_id: 'eprolo_cat',
        cj_category_name: 'EPROLO',
        name: productName,
        slug,
        description,
        short_description: description.substring(0, 150) + '...',
        cj_price: costPrice,
        selling_price: finalSellingPrice,
        compare_price: finalComparePrice,
        profit_margin: finalSellingPrice - costPrice,
        shipping_time: '7-15 jours',
        shipping_from: 'CN',
        variants: mappedVariants,
        images: mappedImages,
        stock_quantity: totalStock,
        cj_variants: mappedVariants,
        cj_status: 'ENABLE',
        last_stock_sync: new Date().toISOString(),
        supplier: 'eprolo',
        category_id: categoryId || null,
        tags: finalTags,
        is_active: totalStock > 0,
        is_dropship: true,
        weight: rawProduct.weight ? parseFloat(rawProduct.weight) : null,
        sold_count: randomSoldCount,
        rating: fakeReviewsData.reviewAvg,
        review_count: fakeReviewsData.reviewCount
      })
      .select()
      .single()

    if (error) throw error

    // Sync to main products table
    const { error: prodError } = await supabase
      .from('products')
      .insert({
        id: inserted.id,
        name: inserted.name,
        slug: inserted.slug,
        description: inserted.description,
        short_description: inserted.short_description,
        price: inserted.selling_price,
        compare_price: inserted.compare_price,
        cost_price: inserted.cj_price,
        stock_quantity: inserted.stock_quantity,
        images: inserted.images,
        category_id: inserted.category_id,
        subcategory_id: subcategoryId || null,
        wholesale_moq: wholesale_moq || 10,
        tags: inserted.tags,
        is_active: inserted.is_active,
        is_dropship: true,
        supplier: 'eprolo',
        cj_product_id: inserted.cj_product_id,
        shipping_time: inserted.shipping_time,
        shipping_from: inserted.shipping_from,
        sku: inserted.cj_product_id,
        weight: rawProduct.weight ? parseFloat(rawProduct.weight) : null,
        cj_status: inserted.cj_status,
        last_stock_sync: inserted.last_stock_sync,
        availability_type: 'worldwide',
        available_countries: ['*'],
        variants: mappedVariants,
        colors: [...new Set(mappedVariants.map((v: any) => v.color).filter(Boolean))],
        sizes: [...new Set(mappedVariants.map((v: any) => v.size).filter(Boolean))],
        sold_count: randomSoldCount,
        rating: fakeReviewsData.reviewAvg,
        review_count: fakeReviewsData.reviewCount,
        review_avg: fakeReviewsData.reviewAvg
      })

    if (prodError) {
      console.error('Failed to sync Eprolo product to main products table:', prodError)
    }

    // Insert fake reviews
    const reviewsToInsert = fakeReviewsData.reviews.map(r => ({
      ...r,
      product_id: inserted.id
    }))
    await supabase.from('product_reviews').insert(reviewsToInsert)

    return NextResponse.json({
      success: true,
      product: inserted,
      message: 'Produit Eprolo importé avec succès!'
    })
  } catch (error: any) {
    console.error('Eprolo Import Route Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

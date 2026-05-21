import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateFakeReviewsForProduct } from '@/lib/fake-reviews'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // 1. Fetch products with 0 reviews
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, tags')
      .or('review_count.eq.0,review_count.is.null')

    if (error) throw error
    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "Tous les produits ont déjà des avis." })
    }

    let totalGenerated = 0;

    // 2. Loop through and generate
    for (const product of products) {
      const contextStr = `${product.name} ${(product.tags || []).join(' ')}`
      const fakeReviewsData = generateFakeReviewsForProduct(product.id, contextStr, product.name)
      
      const reviewsToInsert = fakeReviewsData.reviews.map(r => ({
        product_id: product.id,
        customer_name: r.customer_name,
        rating: r.rating,
        title: r.title,
        body: r.body,
        is_verified: r.is_verified,
        status: 'approved'
      }))

      await supabase.from('product_reviews').insert(reviewsToInsert)

      await supabase.from('products').update({
        rating: fakeReviewsData.reviewAvg,
        review_avg: fakeReviewsData.reviewAvg,
        review_count: fakeReviewsData.reviewCount
      }).eq('id', product.id)

      totalGenerated += reviewsToInsert.length
    }

    return NextResponse.json({
      success: true,
      productsCount: products.length,
      reviewsCount: totalGenerated
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

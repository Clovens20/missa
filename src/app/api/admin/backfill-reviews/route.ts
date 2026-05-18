import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateFakeReviewsForProduct } from '@/lib/fake-reviews'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    // Get all products that have 0 reviews or null
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, tags, category_id, categories(name)')

    if (error) throw error

    let totalUpdated = 0

    for (const product of products) {
      // Check if product already has reviews
      const { count } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)
      
      if (count && count > 0) {
        continue // Skip products that already have reviews
      }

      const tagsList = product.tags || []
      const categoryName = (product.categories as any)?.name || ''
      const contextStr = `${categoryName} ${product.name} ${tagsList.join(' ')}`
      
      const fakeReviewsData = generateFakeReviewsForProduct('DUMMY', contextStr)
      
      const reviewsToInsert = fakeReviewsData.reviews.map(r => ({
        ...r,
        product_id: product.id
      }))

      // Insert reviews
      await supabase.from('product_reviews').insert(reviewsToInsert)

      // Update product stats
      await supabase.from('products').update({
        rating: fakeReviewsData.reviewAvg,
        review_avg: fakeReviewsData.reviewAvg,
        review_count: fakeReviewsData.reviewCount
      }).eq('id', product.id)
      
      // Update dropship_products stats if it exists
      await supabase.from('dropship_products').update({
        rating: fakeReviewsData.reviewAvg,
        review_count: fakeReviewsData.reviewCount
      }).eq('id', product.id)

      totalUpdated++
    }

    return NextResponse.json({
      success: true,
      message: `Backfill complet: ${totalUpdated} produits mis à jour.`,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

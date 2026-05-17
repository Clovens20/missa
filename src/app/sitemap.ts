import { MetadataRoute } from 'next'
import { createClient } from 
  '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function sitemap(): 
  Promise<MetadataRoute.Sitemap> {
  
  const siteUrl = 
    process.env.NEXT_PUBLIC_SITE_URL || 
    'https://www.missashopp.com'

  // Static pages
  const staticPages: 
    MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/track`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Dynamic product pages
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('updated_at', 
      { ascending: false })

  const productPages: 
    MetadataRoute.Sitemap = 
    (products || []).map(p => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // Category pages
  const { data: categories } = 
    await supabase
      .from('products')
      .select('category_id, categories(name, slug)')
      .eq('is_active', true)
      .not('category_id', 'is', null)

  const uniqueCategories = Array.from(new Set(
    categories?.map(c => (c as any).categories?.name).filter(Boolean)
  ))

  const categoryPages: 
    MetadataRoute.Sitemap = 
    uniqueCategories.map(cat => ({
      url: `${siteUrl}/catalog?category=${encodeURIComponent(cat as string)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
  ]
}

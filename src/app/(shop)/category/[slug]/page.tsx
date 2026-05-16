import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import CategoryPageClient from '@/components/shop/CategoryPageClient'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: cat } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!cat) return { title: 'Catégorie | Missa Shop' }

  return {
    title: `${cat.name} | Missa Shop`,
    description: cat.description,
    openGraph: {
      title: `${cat.name} | Missa Shop`,
      images: [cat.image_url],
    }
  }
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ sub?: string }>
}) {
  const { slug } = await params
  const { sub } = await searchParams
  
  const { data: categoryData } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  // Use DB category or a virtual one to prevent 404
  const category = categoryData || {
    id: 'virtual',
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    slug: slug,
    image_url: null
  }

  let prodQuery = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  let dropshipQuery = supabase
    .from('dropship_products')
    .select('*')
    .eq('is_active', true)

  if (category.id !== 'virtual') {
    prodQuery = prodQuery.eq('category_id', category.id)
    // For dropship products, we match by category name or tag since they might not have a category_id yet
    dropshipQuery = dropshipQuery.or(`tags.cs.{${category.slug}},tags.cs.{${category.name}},name.ilike.%${category.name}%`)
  } else {
    // Virtual category search by tag/name
    prodQuery = prodQuery.or(`tags.cs.{${slug}},name.ilike.%${slug}%`)
    dropshipQuery = dropshipQuery.or(`tags.cs.{${slug}},name.ilike.%${slug}%`)
  }

  if (sub) {
    // If sub is provided, filter by tag or name
    prodQuery = prodQuery.or(`tags.cs.{${sub}},name.ilike.%${sub}%`)
    dropshipQuery = dropshipQuery.or(`tags.cs.{${sub}},name.ilike.%${sub}%`)
  }

  const [prodRes, dropshipRes] = await Promise.all([
    prodQuery.order('created_at', { ascending: false }),
    dropshipQuery.order('imported_at', { ascending: false })
  ])

  const products = [
    ...(prodRes.data || []),
    ...(dropshipRes.data || []).map(p => ({ ...p, is_dropship: true }))
  ]

  return (
    <>
      <Header />
      <CartDrawer />
      <main>
        <div className="relative h-48 md:h-64 overflow-hidden">
          {category.image_url && (
            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/60 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{category.name}</h1>
              <p className="text-white/90">{products?.length || 0} produits disponibles</p>
            </div>
          </div>
        </div>
        <CategoryPageClient category={category} initialProducts={products || []} />
      </main>
      <Footer />
    </>
  )
}

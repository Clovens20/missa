import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import ProductDetailClient from '@/components/shop/ProductDetailClient'
import RelatedProducts from '@/components/shop/RelatedProducts'
import BreadcrumbSEO from '@/components/shop/BreadcrumbSEO'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!product) {
    const { data: dropshipProduct } = await supabase
      .from('dropship_products')
      .select('*')
      .eq('slug', slug)
      .single()
    if (dropshipProduct) product = dropshipProduct as any
  }

  if (!product) return { title: 'Produit introuvable | Missa Shop' }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'
  const productUrl = `${siteUrl}/product/${product.slug}`
  const imageUrl = product.images?.[0]?.url || `${siteUrl}/og-default.jpg`
  
  const cleanDesc = (product.meta_description || product.short_description || product.description)
    ?.replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 160) || `Découvrez ${product.name} sur ${process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop'}.`

  return {
    title: `${product.name} — $${product.price}`,
    description: cleanDesc,
    keywords: [product.name, process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop', 'boutique en ligne'],
    openGraph: {
      title: product.name,
      description: cleanDesc,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: product.name,
      }],
      url: productUrl,
      type: 'website',
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: cleanDesc,
      images: [imageUrl],
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'USD',
      'product:availability': (product.stock_quantity || 0) > 0 ? 'in stock' : 'out of stock',
    },
  }
}

function ProductSchema({ product }: { product: any }) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, '').trim(),
    image: product.images?.map((img: any) => img.url) || [],
    url: `${siteUrl}/product/${product.slug}`,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: (product.stock_quantity || 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop',
      },
    },
    ...(product.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.review_avg,
        reviewCount: product.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let { data: product } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('slug', slug)
    .single()

  if (!product) {
    const { data: dropshipProduct } = await supabase
      .from('dropship_products')
      .select('*')
      .eq('slug', slug)
      .single()
    if (dropshipProduct) {
      product = { ...dropshipProduct, is_dropship: true }
    }
  }

  if (!product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(8)

  const { data: suggested } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .neq('category_id', product.category_id)
    .limit(8)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <>
      <ProductSchema product={product}/>
      <BreadcrumbSEO
        items={[
          { name: 'Accueil', url: '/' },
          { name: product.category?.name || 'Catalogue', url: `/catalog?category=${product.category?.slug || ''}` },
          { name: product.name, url: `/product/${product.slug}` },
        ]}
      />
      <Header />
      <CartDrawer />
      <main>
        <ProductDetailClient product={product} reviews={reviews || []} />
        {related && related.length > 0 && (
          <RelatedProducts title="🔗 Dans la même catégorie" subtitle={`Plus de produits en ${product.category?.name}`} products={related} accentColor="primary" />
        )}
        {suggested && suggested.length > 0 && (
          <RelatedProducts title="✨ Vous aimerez aussi" subtitle="Sélection spéciale pour vous" products={suggested} accentColor="secondary" />
        )}
      </main>
      <Footer />
    </>
  )
}

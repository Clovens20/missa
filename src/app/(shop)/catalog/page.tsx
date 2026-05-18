import { supabase } from '@/lib/supabase'
import CatalogContent from './CatalogContent'
import type { Metadata } from 'next'

export const revalidate = 60 // Cache for 60 seconds

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}): Promise<Metadata> {
  const { category } = await searchParams
  
  const title = category
    ? `${category} — Missa Shop`
    : 'Catalogue — Missa Shop'
  
  const description = category
    ? `Découvrez notre collection ${category}. Mode premium à petits prix. Livraison rapide au Canada, USA et Haïti.`
    : 'Tout notre catalogue mode: robes, sacs, bijoux, chaussures et accessoires. Prix abordables, qualité premium.'

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: category
        ? `https://www.missashopp.com/catalog?category=${encodeURIComponent(category)}`
        : 'https://www.missashopp.com/catalog',
    },
  }
}

export default async function CatalogPage() {
  // Fetch initial data on the SERVER
  const [prodRes, catRes] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
  ])

  return (
    <CatalogContent 
      initialProducts={prodRes.data || []} 
      initialCategories={catRes.data || []} 
    />
  )
}

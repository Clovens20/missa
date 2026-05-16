'use client'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface ProductGridProps {
  title: string
  subtitle?: string
  products: Product[]
  loading?: boolean
  accentColor?: 'primary' | 'secondary'
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"/>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3"/>
        <div className="h-4 bg-gray-200 rounded w-3/4"/>
        <div className="h-3 bg-gray-200 rounded w-1/2"/>
        <div className="h-5 bg-gray-200 rounded w-1/3"/>
        <div className="h-10 bg-gray-200 rounded-xl"/>
      </div>
    </div>
  )
}

export default function ProductGrid({
  title,
  subtitle,
  products,
  loading,
  accentColor = 'primary',
}: ProductGridProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 text-lg">
              {subtitle}
            </p>
          )}
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mt-4"/>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array(8).fill(0).map((_, i) => (
                <SkeletonCard key={i}/>
              ))
            : products.length === 0
              ? (
                <div className="col-span-full text-center py-16 text-gray-400">
                   Aucun produit disponible
                </div>
              )
              : products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                  />
                ))
          }
        </div>
      </div>
    </section>
  )
}

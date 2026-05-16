'use client'
import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'
import { motion, AnimatePresence } from 'framer-motion'

interface CategoryFilterGridProps {
  products: any[]
  categories: any[]
  title?: string
  subtitle?: string
}

export default function CategoryFilterGrid({
  products,
  categories,
  title = "Toute la Boutique",
  subtitle = "Découvrez notre collection complète"
}: CategoryFilterGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products
    return products.filter(p => p.category_id === activeCategory)
  }, [activeCategory, products])

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-500 text-lg">
                {subtitle}
              </p>
            )}
            <div className="w-16 h-1 bg-primary rounded-full mt-4"/>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                !activeCategory 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              Tout voir
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard
                  product={product}
                  index={i}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="font-bold">Aucun produit dans cette catégorie</p>
          </div>
        )}
      </div>
    </section>
  )
}

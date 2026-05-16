'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import ProductCard from './ProductCard'
import type { Product, Category } from '@/types'

interface Props {
  category: Category
  initialProducts: Product[]
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
  { value: 'rating', label: 'Mieux notés' },
]

export default function CategoryPageClient({
  category,
  initialProducts
}: Props) {
  const [products] = useState(initialProducts)
  const [sort, setSort] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 500])
  const [showFilters, setShowFilters] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)

  // Apply filters + sort
  let filtered = [...products]

  if (inStockOnly) {
    filtered = filtered.filter(p => p.stock_quantity > 0)
  }
  if (onSaleOnly) {
    filtered = filtered.filter(p => p.is_on_sale)
  }
  filtered = filtered.filter(
    p => p.price >= priceRange[0] && p.price <= priceRange[1]
  )

  switch(sort) {
    case 'price_asc':
      filtered.sort((a,b) => a.price - b.price)
      break
    case 'price_desc':
      filtered.sort((a,b) => b.price - a.price)
      break
    case 'popular':
      filtered.sort((a,b) => b.sold_count - a.sold_count)
      break
    case 'rating':
      filtered.sort((a,b) => b.rating - a.rating)
      break
    default:
      filtered.sort((a,b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <p className="text-gray-500 text-sm">
          <strong className="text-gray-900">{filtered.length}</strong> produits
        </p>

        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:border-primary focus:outline-none bg-white cursor-pointer">
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-4 py-2 hover:border-primary hover:text-primary transition-colors bg-white">
            <SlidersHorizontal className="w-4 h-4"/>
            Filtres
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        
        {/* Filter sidebar */}
        {(showFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">Filtres</h3>
                <button
                  onClick={() => {
                    setInStockOnly(false)
                    setOnSaleOnly(false)
                    setPriceRange([0, 500])
                  }}
                  className="text-xs text-primary hover:underline">
                  Réinitialiser
                </button>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Prix</h4>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
                    className="w-20 border rounded-lg px-2 py-1 text-center focus:border-primary focus:outline-none"
                    min="0"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                    className="w-20 border rounded-lg px-2 py-1 text-center focus:border-primary focus:outline-none"
                    min="0"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-primary">En stock uniquement</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={e => setOnSaleOnly(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-primary">En promotion</span>
                </label>
              </div>
            </div>
          </aside>
        )}

        {/* Products grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 font-medium text-lg">Aucun produit trouvé</p>
              <button
                onClick={() => {
                  setInStockOnly(false)
                  setOnSaleOnly(false)
                  setPriceRange([0, 500])
                }}
                className="mt-4 text-primary font-semibold hover:underline text-sm">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}>
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

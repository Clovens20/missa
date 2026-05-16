'use client'
import { useState } from 'react'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import ProductCard from '@/components/shop/ProductCard'
import type { Product, Category } from '@/types'

interface CatalogContentProps {
  initialProducts: Product[]
  initialCategories: Category[]
}

export default function CatalogContent({ initialProducts, initialCategories }: CatalogContentProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sort, setSort] = useState('newest')

  const filtered = initialProducts
    .filter(p => !activeCategory || p.category_id === activeCategory)
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-gray-50 min-h-screen">
        <div className="bg-primary pt-16 pb-32">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">Catalogue Missa</h1>
            <p className="text-orange-100 text-lg">Découvrez toutes nos collections premium</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-16 pb-20">
          <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 mb-8 flex flex-wrap items-center justify-between gap-4 border border-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-2xl font-bold transition-all">
                <SlidersHorizontal className="w-5 h-5 text-primary"/>
                Filtres
              </button>
              <span className="text-gray-400 font-medium">{filtered.length} produits trouvés</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500 hidden sm:block">Trier par:</span>
              <div className="relative group">
                <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-3 pr-12 rounded-2xl font-bold outline-none cursor-pointer transition-all">
                  <option value="newest">Nouveautés</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="popular">Populaires</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"/>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <AnimatePresence>
              {showFilters && (
                <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full lg:w-64 space-y-8">
                  <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                    <h3 className="font-black text-lg mb-6 uppercase tracking-tighter text-gray-900 border-b pb-4">Catégories</h3>
                    <ul className="space-y-2">
                      <li><button onClick={() => setActiveCategory(null)} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${!activeCategory ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Tout voir</button></li>
                      {initialCategories.map(cat => (
                        <li key={cat.id}><button onClick={() => setActiveCategory(cat.id)} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeCategory === cat.id ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{cat.name}</button></li>
                      ))}
                    </ul>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            <div className="flex-1">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-lg">
                  <Search className="w-16 h-16 text-gray-200 mx-auto mb-4"/>
                  <h3 className="text-xl font-bold text-gray-900">Aucun produit trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filtered.map((product, i) => (<ProductCard key={product.id} product={product} index={i} />))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

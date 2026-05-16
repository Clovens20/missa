'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal, ChevronDown,
  X, Star, TrendingUp,
  Sparkles, Package,
  Grid3X3, LayoutList,
  ArrowUpDown, Search,
  RefreshCw,
} from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import Link from 'next/link'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { ChevronUp } from 'lucide-react'

// ── Sort options ─────────────────────
const SORT_OPTIONS = [
  { value: 'newest', label: '🆕 Nouveautés' },
  { value: 'popular', label: '🔥 Populaires' },
  { value: 'price_asc', label: '💰 Prix croissant' },
  { value: 'price_desc', label: '💎 Prix décroissant' },
  { value: 'rating', label: '⭐ Mieux notés' },
  { value: 'discount', label: '🏷️ Meilleures promos' },
]

const PRICE_RANGES = [
  { label: 'Tout', min: 0, max: 9999 },
  { label: 'Moins de $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100+', min: 100, max: 9999 },
]

const ITEMS_PER_PAGE = 20

export default function HomePage() {

  // ── State ───────────────────────────
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const pageRef = useRef(1)
  const isLoadingRef = useRef(false)

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0])
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [onlyOnSale, setOnlyOnSale] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: products.length < total,
    loading: loadingMore,
    rootMargin: '500px',
  })

  // ── Fetch products ──────────────────
  const fetchProducts = useCallback(
    async (
      opts: {
        category?: string
        sort?: string
        minPrice?: number
        maxPrice?: number
        inStock?: boolean
        onSale?: boolean
        page?: number
        append?: boolean
      } = {}
    ) => {
      const {
        category = activeCategory,
        sort = sortBy,
        minPrice = priceRange.min,
        maxPrice = priceRange.max,
        inStock = onlyInStock,
        onSale = onlyOnSale,
        page: pg = 1,
        append = false,
      } = opts

      if (isLoadingRef.current) return
      isLoadingRef.current = true

      if (!append) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams({
          limit: ITEMS_PER_PAGE.toString(),
          page: pg.toString(),
          sort,
          minPrice: minPrice.toString(),
          maxPrice: maxPrice.toString(),
          inStock: inStock.toString(),
          onSale: onSale.toString(),
          ...(category !== 'all' && {
            category
          }),
        })

        const res = await fetch(`/api/shop/products?${params}`)
        const data = await res.json()

        const newProducts = data.products || []

        if (append) {
          setProducts(prev => {
            const ids = new Set(prev.map((p: any) => p.id))
            return [
              ...prev,
              ...newProducts.filter((p: any) => !ids.has(p.id)),
            ]
          })
        } else {
          setProducts(newProducts)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }

        setTotal(data.total || 0)

        // Get categories from first load
        if (categories.length === 0 && data.categories) {
          setCategories(data.categories)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
        isLoadingRef.current = false
      }
    },
    [activeCategory, sortBy, priceRange, onlyInStock, onlyOnSale, categories.length]
  )

  // Load categories separately
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/shop/categories')
        const data = await res.json()
        setCategories(data.categories || [])
      } catch {}
    }
    loadCategories()
  }, [])

  // Initial load
  useEffect(() => {
    pageRef.current = 1
    setPage(1)
    fetchProducts({ page: 1 })
  }, [activeCategory, sortBy, priceRange, onlyInStock, onlyOnSale])

  // Load more
  function loadMore() {
    if (isLoadingRef.current) return
    if (!hasMore) return

    pageRef.current += 1
    setPage(pageRef.current)
    fetchProducts({
      page: pageRef.current,
      append: true,
    })
  }

  const hasMore = products.length < total
  const activeFiltersCount = [
    activeCategory !== 'all',
    priceRange.min > 0 || priceRange.max < 9999,
    onlyInStock,
    onlyOnSale,
  ].filter(Boolean).length

  return (
    <>
      <Header />
      <CartDrawer />
      <div className="min-h-screen bg-gray-50">

        {/* ── TOP BANNER (compact) ── */}
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white text-center py-2 px-4 text-xs font-bold hidden sm:block">
          🚚 Livraison gratuite dès $50 · 🔒 Paiement sécurisé · ↩️ Retour 30 jours
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4">

          {/* ── CATEGORY TABS ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide px-2 py-2">
              {/* All tab */}
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Grid3X3 className="w-4 h-4"/>
                Tous
                {activeCategory === 'all' && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black ml-2">
                    {total}
                  </span>
                )}
              </button>

              {/* Category tabs */}
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── FILTER BAR ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Results count */}
            <p className="text-sm text-gray-500 mr-auto">
              <span className="font-black text-gray-900">
                {loading ? '...' : total}
              </span>
              {' '}produits
              {activeCategory !== 'all' && ` dans "${activeCategory}"`}
            </p>

            {/* Sort button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSort(!showSort)
                  setShowFilters(false)
                }}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-primary/50 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm">
                <ArrowUpDown className="w-4 h-4"/>
                {SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Trier'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`}/>
              </button>

              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 min-w-[200px] overflow-hidden">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value)
                          setShowSort(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${sortBy === opt.value ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}>
                        {opt.label}
                        {sortBy === opt.value && (
                          <span className="text-primary font-black">✓</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filters button */}
            <button
              onClick={() => {
                setShowFilters(!showFilters)
                setShowSort(false)
              }}
              className={`flex items-center gap-2 border font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm ${activeFiltersCount > 0 ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 hover:border-primary/50 text-gray-700'}`}>
              <SlidersHorizontal className="w-4 h-4"/>
              Filtres
              {activeFiltersCount > 0 && (
                <span className="bg-white/20 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ml-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View mode */}
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hidden sm:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                <Grid3X3 className="w-4 h-4"/>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                <LayoutList className="w-4 h-4"/>
              </button>
            </div>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setPriceRange(PRICE_RANGES[0])
                  setOnlyInStock(false)
                  setOnlyOnSale(false)
                }}
                className="flex items-center gap-1 text-xs text-red-400 font-bold hover:underline ml-2">
                <X className="w-3 h-3"/>
                Effacer
              </button>
            )}
          </div>

          {/* ── FILTER PANEL ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex flex-wrap gap-6">

                  {/* Price ranges */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Prix</p>
                    <div className="flex gap-2 flex-wrap">
                      {PRICE_RANGES.map(range => (
                        <button
                          key={range.label}
                          onClick={() => setPriceRange(range)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${priceRange.label === range.label ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick filters */}
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Afficher</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        {
                          key: 'inStock',
                          label: '✅ En stock',
                          active: onlyInStock,
                          toggle: () => setOnlyInStock(!onlyInStock),
                        },
                        {
                          key: 'onSale',
                          label: '🔥 En promo',
                          active: onlyOnSale,
                          toggle: () => setOnlyOnSale(!onlyOnSale),
                        },
                      ].map(f => (
                        <button
                          key={f.key}
                          onClick={f.toggle}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${f.active ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ACTIVE FILTER TAGS ── */}
          {(activeCategory !== 'all' || priceRange.min > 0 || priceRange.max < 9999 || onlyInStock || onlyOnSale) && (
            <div className="flex flex-wrap gap-2">
              {activeCategory !== 'all' && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  📁 {activeCategory}
                  <button onClick={() => setActiveCategory('all')} className="hover:text-red-400 text-base leading-none">×</button>
                </span>
              )}
              {(priceRange.min > 0 || priceRange.max < 9999) && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  💰 {priceRange.label}
                  <button onClick={() => setPriceRange(PRICE_RANGES[0])} className="hover:text-red-400 text-base leading-none">×</button>
                </span>
              )}
              {onlyInStock && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  ✅ En stock
                  <button onClick={() => setOnlyInStock(false)} className="hover:text-red-400 text-base leading-none">×</button>
                </span>
              )}
              {onlyOnSale && (
                <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                  🔥 En promo
                  <button onClick={() => setOnlyOnSale(false)} className="hover:text-red-400 text-base leading-none">×</button>
                </span>
              )}
            </div>
          )}

          {/* ── PRODUCTS GRID ── */}
          {loading ? (
            // Loading skeleton
            <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="bg-gray-100" style={{ aspectRatio: '4/5' }}/>
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2"/>
                    <div className="h-4 bg-gray-100 rounded"/>
                    <div className="h-4 bg-gray-100 rounded w-3/4"/>
                    <div className="h-5 bg-gray-100 rounded w-1/3"/>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4"/>
              <h3 className="text-xl font-black text-gray-900 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-400 mb-6 text-sm">
                {activeCategory !== 'all' ? `Aucun produit dans "${activeCategory}"` : 'La boutique est vide pour le moment'}
              </p>
              <button onClick={() => { setActiveCategory('all'); setPriceRange(PRICE_RANGES[0]); setOnlyInStock(false); setOnlyOnSale(false); }} className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors">
                Voir tous les produits
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-3 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </AnimatePresence>
              </div>

              {/* ── INFINITE SCROLL ZONE ── */}
              <div className="space-y-6">
                {/* Sentinel div — triggers load */}
                {hasMore && (
                  <div
                    ref={sentinelRef}
                    className="h-4 w-full"
                    aria-hidden="true"
                  />
                )}

                {/* Loading spinner */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 font-semibold">
                      Chargement...
                    </span>
                  </div>
                )}

                {/* End of products */}
                {!hasMore && products.length > 0 && (
                  <div className="text-center py-8 space-y-2">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="h-px bg-gray-200 flex-1 max-w-[100px]"/>
                      <span className="text-2xl">🎉</span>
                      <div className="h-px bg-gray-200 flex-1 max-w-[100px]"/>
                    </div>
                    <p className="text-sm text-gray-400 font-semibold">
                      Vous avez tout vu!
                    </p>
                    <p className="text-xs text-gray-300">
                      {total} produits affichés
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <ScrollToTopButton />
      <Footer />
    </>
  )
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-colors">
          <ChevronUp className="w-5 h-5"/>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

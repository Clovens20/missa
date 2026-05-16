'use client'
import { useState, useEffect, 
  useCallback, Suspense } from 'react'
import { useSearchParams, 
  useRouter } from 'next/navigation'
import { motion, AnimatePresence } 
  from 'framer-motion'
import { 
  Search, Package, 
  Loader, X 
} from 'lucide-react'
import SmartSearchBar 
  from '@/components/shop/SmartSearchBar'
import SearchFilters, 
  { FilterState, DEFAULT_FILTERS } 
  from '@/components/shop/SearchFilters'
import ProductCard 
  from '@/components/shop/ProductCard'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''

  const [results, setResults] = 
    useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = 
    useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = 
    useState(false)
  const [filters, setFilters] = 
    useState<FilterState>(DEFAULT_FILTERS)
  const [availableFilters, 
    setAvailableFilters] = useState<any>({
    categories: [],
    colors: [],
    sizes: [],
    priceRange: { min: 0, max: 500 },
  })

  const fetchResults = useCallback(
    async (
      query: string,
      f: FilterState,
      p: number,
      append = false
    ) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          page: p.toString(),
          limit: '20',
          sort: f.sortBy,
          minPrice: f.minPrice.toString(),
          maxPrice: f.maxPrice.toString(),
          inStock: f.inStock.toString(),
          onSale: f.onSale.toString(),
          ...(f.colors.length > 0 && {
            colors: f.colors.join(',')
          }),
          ...(f.sizes.length > 0 && {
            sizes: f.sizes.join(',')
          }),
          ...(f.categories.length > 0 && {
            categories: f.categories.join(',')
          }),
        })

        const res = await fetch(
          `/api/shop/search?${params}`
        )
        const data = await res.json()

        if (append) {
          setResults(prev => [
            ...prev, 
            ...(data.products || [])
          ])
        } else {
          setResults(data.products || [])
        }
        
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 0)
        
        if (data.filters) {
          setAvailableFilters(data.filters)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, []
  )

  // Fetch when query or filters change
  useEffect(() => {
    setPage(1)
    fetchResults(q, filters, 1)
  }, [q, filters, fetchResults])

  function handleFilterChange(
    newFilters: FilterState
  ) {
    setFilters(newFilters)
    setPage(1)
  }

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchResults(q, filters, nextPage, true)
  }

  // Active filter tags
  const activeTags = [
    ...filters.colors.map(c => ({
      label: c,
      remove: () => handleFilterChange({
        ...filters,
        colors: filters.colors.filter(
          x => x !== c
        )
      })
    })),
    ...filters.sizes.map(s => ({
      label: s,
      remove: () => handleFilterChange({
        ...filters,
        sizes: filters.sizes.filter(
          x => x !== s
        )
      })
    })),
    ...(filters.inStock ? [{
      label: 'En stock',
      remove: () => handleFilterChange({
        ...filters, inStock: false
      })
    }] : []),
    ...(filters.onSale ? [{
      label: 'En promo',
      remove: () => handleFilterChange({
        ...filters, onSale: false
      })
    }] : []),
    ...(filters.minPrice > 0 || 
      filters.maxPrice < 500 ? [{
      label: `$${filters.minPrice} — $${filters.maxPrice}`,
      remove: () => handleFilterChange({
        ...filters,
        minPrice: 0,
        maxPrice: 500,
      })
    }] : []),
  ]

  return (
    <div className="max-w-7xl mx-auto 
      px-4 py-8 space-y-6 min-h-screen">
      
      {/* Search bar area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SmartSearchBar
          placeholder="Rechercher..."
          className="w-full max-w-2xl"
          autoFocus={!q}
        />
        <div className="flex items-center gap-2">
           <span className="text-gray-400 text-sm font-medium uppercase tracking-widest">Trié par :</span>
           <select 
             value={filters.sortBy}
             onChange={(e) => handleFilterChange({...filters, sortBy: e.target.value})}
             className="bg-gray-100 border-0 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
           >
             <option value="relevant">Pertinence</option>
             <option value="newest">Nouveautés</option>
             <option value="popular">Popularité</option>
             <option value="price_asc">Prix croissant</option>
             <option value="price_desc">Prix décroissant</option>
             <option value="rating">Mieux notés</option>
           </select>
        </div>
      </div>

      {/* Query + results count */}
      {q && (
        <div className="flex items-center 
          gap-3 flex-wrap">
          <h1 className="text-2xl 
            font-black text-gray-900">
            {loading && results.length === 0
              ? 'Recherche en cours...' 
              : `${total} résultat${total > 1 ? 's' : ''} pour "`
            }
            {!loading && (
              <span className="text-primary italic">
                {q}
              </span>
            )}
            {!loading && '"'}
          </h1>
        </div>
      )}

      {/* Active filter tags */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider mr-2">Filtres actifs:</span>
          {activeTags.map((tag, i) => (
            <span key={i}
              className="flex items-center 
                gap-1.5 bg-white border border-primary/20 
                text-primary text-xs 
                font-black px-3 py-1.5 
                rounded-xl shadow-sm">
              {tag.label}
              <button
                onClick={tag.remove}
                className="hover:text-red-500 
                  transition-colors ml-1">
                <X className="w-3 h-3"/>
              </button>
            </span>
          ))}
          <button
            onClick={() => 
              setFilters(DEFAULT_FILTERS)}
            className="text-xs text-red-500 
              font-black hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto">
            TOUT EFFACER
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Filters sidebar */}
        <SearchFilters
          filters={filters}
          onChange={handleFilterChange}
          availableFilters={availableFilters}
          totalResults={total}
          loading={loading}
        />

        {/* Results */}
        <div className="flex-1 min-w-0">
          
          {/* Results grid or states */}
          {loading && results.length === 0 ? (
            <div className="grid 
              grid-cols-2 sm:grid-cols-3 
              xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map(
                (_, i) => (
                <div key={i}
                  className="bg-gray-100 
                    rounded-3xl aspect-[3/4] 
                    animate-pulse"/>
              ))}
            </div>
          ) : results.length === 0 && !loading ? (
            /* Empty state */
            <div className="text-center 
              py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem]">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50">
                <Package className="w-10 h-10 text-gray-300"/>
              </div>
              <h3 className="text-2xl 
                font-black text-gray-900 mb-2">
                Oups ! Aucun résultat
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                {q 
                  ? `Nous n'avons trouvé aucun article correspondant à "${q}". Essayez avec d'autres mots-clés.` 
                  : 'Commencez par rechercher un produit pour voir des résultats.'
                }
              </p>
              <div className="flex gap-4 
                justify-center flex-wrap">
                <button
                  onClick={() => 
                    setFilters(DEFAULT_FILTERS)}
                  className="bg-gray-900 hover:bg-black 
                    text-white font-black 
                    px-8 py-4 rounded-2xl 
                    text-sm transition-all shadow-lg active:scale-95">
                  Effacer les filtres
                </button>
                <button
                  onClick={() => 
                    router.push('/')}
                  className="bg-white border-2 border-gray-200
                    text-gray-900 font-black 
                    px-8 py-4 rounded-2xl 
                    text-sm hover:border-primary transition-all active:scale-95">
                  Retour à l'accueil
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Products grid */}
              <div className="grid 
                grid-cols-2 sm:grid-cols-3 
                xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {results.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.3,
                        delay: Math.min(i, 12) * 0.05
                      }}>
                      <ProductCard 
                        product={product}
                        index={i}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div className="text-center 
                  mt-12 py-8 border-t border-gray-100">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="group relative inline-flex items-center 
                      gap-3 bg-gray-900 hover:bg-black 
                      text-white font-black px-12 py-5 
                      rounded-2xl text-base 
                      transition-all shadow-2xl active:scale-95
                      disabled:opacity-50">
                    {loading ? (
                      <Loader className="w-5 h-5 
                        animate-spin"/>
                    ) : (
                      <Search className="w-5 h-5 group-hover:scale-125 transition-transform"/>
                    )}
                    Charger plus d'articles
                  </button>
                  <p className="text-xs 
                    text-gray-400 mt-4 font-bold uppercase tracking-widest">
                    Affichage de {results.length} sur {total} produits
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-primary w-10 h-10"/></div>}>
          <SearchResults />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

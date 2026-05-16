'use client'
import { 
  useState, useEffect, useRef,
  useCallback 
} from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Search, X, Clock, TrendingUp,
  Tag, ArrowRight, Loader,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

const TRENDING = [
  'Robe été',
  'Sac à main',
  'Bijoux dorés',
  'T-shirt femme',
  'Sandales',
  'Parfum',
]

export default function SmartSearchBar({
  placeholder = 'Rechercher un produit...',
  className = '',
  autoFocus = false,
}: {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [query, setQuery] = useState('')
  const [focused, setFocused] = 
    useState(false)
  const [loading, setLoading] = 
    useState(false)
  const [suggestions, setSuggestions] = 
    useState<{
      products: any[]
      categories: string[]
      popularSearches: string[]
    }>({
      products: [],
      categories: [],
      popularSearches: [],
    })
  const [recentSearches, setRecentSearches] = 
    useState<string[]>([])
  
  const debounceRef = useRef<any>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage
      .getItem('missa_recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(
        e.target as Node
      )) {
        setFocused(false)
      }
    }
    document.addEventListener(
      'mousedown', handleClick
    )
    return () => document.removeEventListener(
      'mousedown', handleClick
    )
  }, [])

  // Debounced suggestions fetch
  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSuggestions({
          products: [],
          categories: [],
          popularSearches: [],
        })
        return
      }

      setLoading(true)
      try {
        const res = await fetch(
          `/api/shop/search?q=` +
          `${encodeURIComponent(q)}` +
          `&suggestions=true`
        )
        const data = await res.json()
        setSuggestions(data)
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }, []
  )

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(
      () => fetchSuggestions(val), 
      300
    )
  }

  function handleSearch(q?: string) {
    const searchQuery = q || query
    if (!searchQuery.trim()) return

    // Save to recent
    const updated = [
      searchQuery,
      ...recentSearches.filter(
        s => s !== searchQuery
      ),
    ].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem(
      'missa_recent_searches',
      JSON.stringify(updated)
    )

    setFocused(false)
    setQuery(searchQuery)
    router.push(
      `/search?q=${encodeURIComponent(searchQuery)}`
    )
  }

  function clearRecent(
    e: React.MouseEvent,
    item: string
  ) {
    e.stopPropagation()
    const updated = recentSearches
      .filter(s => s !== item)
    setRecentSearches(updated)
    localStorage.setItem(
      'missa_recent_searches',
      JSON.stringify(updated)
    )
  }

  const showDropdown = focused && (
    query.length >= 2
      ? (
          suggestions.products.length > 0 ||
          suggestions.categories.length > 0 ||
          suggestions.popularSearches.length > 0
        )
      : (
          recentSearches.length > 0 ||
          TRENDING.length > 0
        )
  )

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}>
      
      {/* Search input */}
      <div className={`
        flex items-center gap-3 
        bg-white border-2 
        rounded-2xl px-4 
        transition-all duration-200
        ${focused 
          ? 'border-primary shadow-lg shadow-primary/10' 
          : 'border-gray-200 hover:border-gray-300'
        }`}>
        
        {loading ? (
          <Loader className="w-5 h-5 
            text-primary animate-spin 
            flex-shrink-0"/>
        ) : (
          <Search className="w-5 h-5 
            text-gray-400 flex-shrink-0"/>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') 
              handleSearch()
            if (e.key === 'Escape')
              setFocused(false)
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 py-3.5 
            bg-transparent text-gray-900 
            placeholder:text-gray-400 
            text-sm focus:outline-none"
        />
        
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => {
                setQuery('')
                setSuggestions({
                  products: [],
                  categories: [],
                  popularSearches: [],
                })
                inputRef.current?.focus()
              }}
              className="w-6 h-6 
                bg-gray-200 hover:bg-gray-300 
                rounded-full flex items-center 
                justify-center flex-shrink-0 
                transition-colors">
              <X className="w-3 h-3 
                text-gray-500"/>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => handleSearch()}
          className="bg-primary 
            hover:bg-primary-dark 
            text-white font-bold px-5 py-2 
            rounded-xl text-sm 
            transition-all flex-shrink-0">
          Chercher
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ 
              opacity: 0, 
              y: -8,
              scale: 0.98,
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
            }}
            exit={{ 
              opacity: 0, 
              y: -8,
              scale: 0.98,
            }}
            transition={{ duration: 0.15 }}
            className="absolute top-full 
              left-0 right-0 mt-2 
              bg-white border border-gray-100 
              rounded-2xl shadow-2xl 
              z-50 overflow-hidden
              max-h-[80vh] overflow-y-auto">
            
            {query.length >= 2 ? (
              /* Search suggestions */
              <div className="p-3 space-y-1">
                
                {/* Product suggestions */}
                {suggestions.products.length > 0 && (
                  <>
                    <p className="text-[10px] 
                      font-black text-gray-400 
                      uppercase tracking-wide 
                      px-3 py-2">
                      Produits
                    </p>
                    {suggestions.products
                      .map((p, i) => (
                      <Link
                        key={i}
                        href={`/product/${p.slug}`}
                        onClick={() => {
                          setFocused(false)
                        }}
                        className="flex items-center 
                          gap-3 px-3 py-2.5 
                          rounded-xl 
                          hover:bg-gray-50 
                          transition-colors group">
                        
                        {/* Image */}
                        <div className="w-10 h-10 
                          rounded-xl overflow-hidden 
                          bg-gray-100 flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <img
                              src={p.images[0].url}
                              alt={p.name}
                              className="w-full h-full 
                                object-cover"
                            />
                          ) : (
                            <div className="w-full 
                              h-full bg-gray-100"/>
                          )}
                        </div>
                        
                        <div className="flex-1 
                          min-w-0">
                          <p className="text-gray-900 
                            text-sm font-semibold 
                            truncate">
                            {p.name}
                          </p>
                          {p.category && (
                            <p className="text-gray-400 
                              text-xs truncate">
                              {p.category}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right 
                          flex-shrink-0">
                          <p className="text-primary 
                            font-black text-sm">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {/* Category suggestions */}
                {suggestions.categories
                  .length > 0 && (
                  <>
                    <div className="h-px 
                      bg-gray-100 my-2"/>
                    <p className="text-[10px] 
                      font-black text-gray-400 
                      uppercase tracking-wide 
                      px-3 py-2">
                      Catégories
                    </p>
                    {suggestions.categories
                      .map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => 
                          handleSearch(cat)}
                        className="flex items-center 
                          gap-3 w-full px-3 py-2.5 
                          rounded-xl hover:bg-gray-50 
                          transition-colors text-left">
                        <div className="w-8 h-8 
                          bg-primary/10 rounded-xl 
                          flex items-center 
                          justify-center">
                          <Tag className="w-4 h-4 
                            text-primary"/>
                        </div>
                        <span className="text-gray-700 
                          text-sm font-medium">
                          {cat}
                        </span>
                        <ArrowRight 
                          className="w-4 h-4 
                            text-gray-300 ml-auto"/>
                      </button>
                    ))}
                  </>
                )}

                {/* Popular searches */}
                {suggestions.popularSearches
                  .length > 0 && (
                  <>
                    <div className="h-px 
                      bg-gray-100 my-2"/>
                    <p className="text-[10px] 
                      font-black text-gray-400 
                      uppercase tracking-wide 
                      px-3 py-2">
                      Recherches populaires
                    </p>
                    {suggestions.popularSearches
                      .map((s, i) => (
                      <button
                        key={i}
                        onClick={() => 
                          handleSearch(s)}
                        className="flex items-center 
                          gap-3 w-full px-3 py-2.5 
                          rounded-xl hover:bg-gray-50 
                          transition-colors text-left">
                        <TrendingUp 
                          className="w-4 h-4 
                            text-secondary 
                            flex-shrink-0"/>
                        <span className="text-gray-700 
                          text-sm">
                          {s}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {/* See all results */}
                <div className="border-t 
                  border-gray-100 pt-2 mt-2">
                  <button
                    onClick={() => 
                      handleSearch()}
                    className="flex items-center 
                      justify-center gap-2 
                      w-full py-2.5 
                      text-primary font-bold 
                      text-sm hover:bg-primary/5 
                      rounded-xl transition-colors">
                    <Search className="w-4 h-4"/>
                    Voir tous les résultats 
                    pour "{query}"
                    <ArrowRight 
                      className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state — show recent + trending */
              <div className="p-3 space-y-1">
                
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center 
                      justify-between px-3 py-2">
                      <p className="text-[10px] 
                        font-black text-gray-400 
                        uppercase tracking-wide">
                        Récentes
                      </p>
                      <button
                        onClick={() => {
                          setRecentSearches([])
                          localStorage.removeItem(
                            'missa_recent_searches'
                          )
                        }}
                        className="text-[10px] 
                          text-gray-400 
                          hover:text-red-400 
                          transition-colors">
                        Effacer
                      </button>
                    </div>
                    {recentSearches.map(
                      (s, i) => (
                      <div key={i}
                        className="flex items-center 
                          gap-3 px-3 py-2.5 
                          rounded-xl 
                          hover:bg-gray-50 
                          transition-colors group 
                          cursor-pointer"
                        onClick={() => 
                          handleSearch(s)}>
                        <Clock className="w-4 h-4 
                          text-gray-300 flex-shrink-0"/>
                        <span className="flex-1 
                          text-gray-600 text-sm">
                          {s}
                        </span>
                        <button
                          onClick={e => 
                            clearRecent(e, s)}
                          className="opacity-0 
                            group-hover:opacity-100 
                            text-gray-300 
                            hover:text-gray-500 
                            transition-all text-lg 
                            leading-none">
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="h-px 
                      bg-gray-100 my-2"/>
                  </>
                )}

                {/* Trending */}
                <p className="text-[10px] 
                  font-black text-gray-400 
                  uppercase tracking-wide 
                  px-3 py-2 
                  flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 
                    text-primary"/>
                  Tendances
                </p>
                <div className="flex flex-wrap 
                  gap-2 px-3 pb-3">
                  {TRENDING.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => 
                        handleSearch(t)}
                      className="flex items-center 
                        gap-1.5 bg-gray-100 
                        hover:bg-primary/10 
                        hover:text-primary 
                        text-gray-600 text-xs 
                        font-semibold px-3 py-2 
                        rounded-full 
                        transition-colors">
                      <TrendingUp 
                        className="w-3 h-3"/>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

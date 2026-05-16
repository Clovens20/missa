'use client'
import { useState } from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  SlidersHorizontal, X, 
  ChevronDown, ChevronUp,
  Check, RotateCcw,
} from 'lucide-react'

export interface FilterState {
  minPrice: number
  maxPrice: number
  colors: string[]
  sizes: string[]
  categories: string[]
  sortBy: string
  inStock: boolean
  onSale: boolean
}

export const DEFAULT_FILTERS: FilterState = {
  minPrice: 0,
  maxPrice: 500,
  colors: [],
  sizes: [],
  categories: [],
  sortBy: 'relevant',
  inStock: false,
  onSale: false,
}

const SORT_OPTIONS = [
  { value: 'relevant', label: '✨ Pertinents' },
  { value: 'newest', label: '🆕 Nouveautés' },
  { value: 'popular', label: '🔥 Populaires' },
  { value: 'price_asc', label: '💰 Prix croissant' },
  { value: 'price_desc', label: '💎 Prix décroissant' },
  { value: 'rating', label: '⭐ Mieux notés' },
]

const COLOR_MAP: Record<string, string> = {
  'Noir': '#000000',
  'Blanc': '#FFFFFF',
  'Rouge': '#EF4444',
  'Bleu': '#3B82F6',
  'Vert': '#22C55E',
  'Jaune': '#EAB308',
  'Rose': '#EC4899',
  'Violet': '#A855F7',
  'Orange': '#F97316',
  'Gris': '#6B7280',
  'Beige': '#D2B48C',
  'Marron': '#92400E',
  'Black': '#000000',
  'White': '#FFFFFF',
  'Red': '#EF4444',
  'Blue': '#3B82F6',
  'Green': '#22C55E',
  'Pink': '#EC4899',
  'Purple': '#A855F7',
  'Gray': '#6B7280',
}

interface SearchFiltersProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  availableFilters: {
    categories: string[]
    colors: string[]
    sizes: string[]
    priceRange: { min: number; max: number }
  }
  totalResults: number
  loading?: boolean
}

export default function SearchFilters({
  filters,
  onChange,
  availableFilters,
  totalResults,
  loading = false,
}: SearchFiltersProps) {
  const [mobileOpen, setMobileOpen] = 
    useState(false)
  const [sections, setSections] = 
    useState({
      sort: true,
      price: true,
      color: true,
      size: true,
      category: false,
    })

  function toggleSection(
    key: keyof typeof sections
  ) {
    setSections(p => ({
      ...p, [key]: !p[key]
    }))
  }

  function toggleArrayFilter(
    key: 'colors' | 'sizes' | 'categories',
    value: string
  ) {
    const current = filters[key]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: updated })
  }

  const activeCount = [
    filters.colors.length > 0,
    filters.sizes.length > 0,
    filters.categories.length > 0,
    filters.inStock,
    filters.onSale,
    filters.minPrice > 0,
    filters.maxPrice < 
      (availableFilters.priceRange?.max || 500),
  ].filter(Boolean).length

  function FilterContent() {
    return (
      <div className="space-y-5">
        
        {/* Reset */}
        {activeCount > 0 && (
          <button
            onClick={() => 
              onChange(DEFAULT_FILTERS)}
            className="flex items-center 
              gap-2 text-sm text-red-400 
              hover:text-red-300 font-bold 
              transition-colors w-full 
              justify-center bg-red-500/10 
              hover:bg-red-500/15 
              py-2 rounded-xl">
            <RotateCcw className="w-4 h-4"/>
            Réinitialiser ({activeCount})
          </button>
        )}

        {/* Sort */}
        <div>
          <button
            onClick={() => 
              toggleSection('sort')}
            className="flex items-center 
              justify-between w-full 
              text-sm font-black 
              text-gray-900 mb-3">
            Trier par
            {sections.sort 
              ? <ChevronUp className="w-4 h-4"/> 
              : <ChevronDown className="w-4 h-4"/>
            }
          </button>
          {sections.sort && (
            <div className="space-y-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange({
                    ...filters, 
                    sortBy: opt.value
                  })}
                  className={`flex items-center 
                    justify-between w-full 
                    px-3 py-2 rounded-xl 
                    text-sm transition-colors
                    ${filters.sortBy === opt.value
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                  {opt.label}
                  {filters.sortBy === 
                    opt.value && (
                    <Check className="w-4 h-4"/>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100"/>

        {/* Price range */}
        <div>
          <button
            onClick={() => 
              toggleSection('price')}
            className="flex items-center 
              justify-between w-full 
              text-sm font-black 
              text-gray-900 mb-3">
            Prix
            {sections.price 
              ? <ChevronUp className="w-4 h-4"/> 
              : <ChevronDown className="w-4 h-4"/>
            }
          </button>
          {sections.price && (
            <div className="space-y-4">
              <div className="flex items-center 
                justify-between text-sm">
                <span className="font-black 
                  text-primary">
                  ${filters.minPrice}
                </span>
                <span className="text-gray-400">
                  —
                </span>
                <span className="font-black 
                  text-primary">
                  ${filters.maxPrice}
                </span>
              </div>
              
              {/* Min price slider */}
              <div className="space-y-2">
                <label className="text-xs 
                  text-gray-500">
                  Prix minimum
                </label>
                <input
                  type="range"
                  min={
                    availableFilters
                      .priceRange?.min || 0
                  }
                  max={filters.maxPrice}
                  value={filters.minPrice}
                  onChange={e => onChange({
                    ...filters,
                    minPrice: +e.target.value,
                  })}
                  className="w-full accent-primary"
                />
              </div>
              
              {/* Max price slider */}
              <div className="space-y-2">
                <label className="text-xs 
                  text-gray-500">
                  Prix maximum
                </label>
                <input
                  type="range"
                  min={filters.minPrice}
                  max={
                    availableFilters
                      .priceRange?.max || 500
                  }
                  value={filters.maxPrice}
                  onChange={e => onChange({
                    ...filters,
                    maxPrice: +e.target.value,
                  })}
                  className="w-full accent-primary"
                />
              </div>

              {/* Quick price buttons */}
              <div className="flex gap-2 
                flex-wrap">
                {[
                  [0, 25, 'Moins de $25'],
                  [25, 50, '$25 - $50'],
                  [50, 100, '$50 - $100'],
                  [100, 500, 'Plus de $100'],
                ].map(([min, max, label]) => (
                  <button
                    key={label}
                    onClick={() => onChange({
                      ...filters,
                      minPrice: min as number,
                      maxPrice: max as number,
                    })}
                    className={`text-xs px-3 
                      py-1.5 rounded-full 
                      border transition-colors
                      ${filters.minPrice === min && 
                        filters.maxPrice === max
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-primary/50'
                      }`}>
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100"/>

        {/* Colors */}
        {availableFilters.colors.length > 0 && (
          <div>
            <button
              onClick={() => 
                toggleSection('color')}
              className="flex items-center 
                justify-between w-full 
                text-sm font-black 
                text-gray-900 mb-3">
              Couleur
              {filters.colors.length > 0 && (
                <span className="bg-primary 
                  text-white text-[10px] 
                  font-black w-5 h-5 
                  rounded-full flex items-center 
                  justify-center mr-auto ml-2">
                  {filters.colors.length}
                </span>
              )}
              {sections.color 
                ? <ChevronUp className="w-4 h-4"/> 
                : <ChevronDown className="w-4 h-4"/>
              }
            </button>
            {sections.color && (
              <div className="flex flex-wrap 
                gap-2">
                {availableFilters.colors
                  .map((color, i) => {
                  const hex = COLOR_MAP[color] 
                    || '#ccc'
                  const isSelected = 
                    filters.colors.includes(color)
                  const isLight = 
                    ['Blanc', 'White', '#FFFFFF', 
                     'Beige'].includes(color)
                  
                  return (
                    <button
                      key={i}
                      onClick={() => 
                        toggleArrayFilter(
                          'colors', color
                        )}
                      title={color}
                      className={`
                        w-9 h-9 rounded-full 
                        border-2 transition-all 
                        flex items-center 
                        justify-center
                        ${isSelected
                          ? 'border-primary scale-110 shadow-lg'
                          : isLight 
                            ? 'border-gray-300 hover:border-gray-400'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      style={{ 
                        background: hex 
                      }}>
                      {isSelected && (
                        <Check className={`w-4 h-4 
                          ${isLight 
                            ? 'text-gray-800' 
                            : 'text-white'
                          }`}/>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {availableFilters.colors.length > 0 && (
          <div className="h-px bg-gray-100"/>
        )}

        {/* Sizes */}
        {availableFilters.sizes.length > 0 && (
          <div>
            <button
              onClick={() => 
                toggleSection('size')}
              className="flex items-center 
                justify-between w-full 
                text-sm font-black 
                text-gray-900 mb-3">
              Taille
              {filters.sizes.length > 0 && (
                <span className="bg-primary 
                  text-white text-[10px] 
                  font-black w-5 h-5 
                  rounded-full flex items-center 
                  justify-center mr-auto ml-2">
                  {filters.sizes.length}
                </span>
              )}
              {sections.size 
                ? <ChevronUp className="w-4 h-4"/> 
                : <ChevronDown className="w-4 h-4"/>
              }
            </button>
            {sections.size && (
              <div className="flex flex-wrap 
                gap-2">
                {availableFilters.sizes
                  .map((size, i) => (
                  <button
                    key={i}
                    onClick={() => 
                      toggleArrayFilter(
                        'sizes', size
                      )}
                    className={`min-w-[44px] h-10 
                      px-3 rounded-xl border-2 
                      text-sm font-bold 
                      transition-all
                      ${filters.sizes.includes(size)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick toggles */}
        <div className="space-y-2">
          {[
            { 
              key: 'inStock' as const, 
              label: '✅ En stock seulement' 
            },
            { 
              key: 'onSale' as const, 
              label: '🔥 En promotion' 
            },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onChange({
                ...filters, 
                [key]: !filters[key]
              })}
              className={`flex items-center 
                gap-3 w-full px-4 py-3 
                rounded-xl border-2 text-sm 
                font-bold transition-all
                ${filters[key]
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
              <div className={`w-5 h-5 
                rounded border-2 flex items-center 
                justify-center transition-all
                ${filters[key]
                  ? 'bg-primary border-primary'
                  : 'border-gray-300'
                }`}>
                {filters[key] && (
                  <Check className="w-3 h-3 
                    text-white"/>
                )}
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block 
        w-64 flex-shrink-0">
        <div className="bg-white 
          border border-gray-100 
          rounded-2xl p-5 sticky top-4">
          <div className="flex items-center 
            justify-between mb-5">
            <h3 className="font-black 
              text-gray-900 flex items-center 
              gap-2">
              <SlidersHorizontal 
                className="w-5 h-5 
                  text-primary"/>
              Filtres
            </h3>
            {!loading && (
              <span className="text-xs 
                text-gray-400 font-semibold">
                {totalResults} résultats
              </span>
            )}
          </div>
          <FilterContent/>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => 
            setMobileOpen(true)}
          className="flex items-center 
            gap-2 bg-white border 
            border-gray-200 rounded-2xl 
            px-4 py-3 text-sm font-bold 
            text-gray-700 shadow-sm 
            hover:border-primary 
            transition-colors">
          <SlidersHorizontal 
            className="w-4 h-4"/>
          Filtres
          {activeCount > 0 && (
            <span className="bg-primary 
              text-white text-[10px] 
              font-black w-5 h-5 
              rounded-full flex items-center 
              justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => 
                  setMobileOpen(false)}
                className="fixed inset-0 
                  bg-black/50 z-40"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ 
                  type: 'spring', 
                  damping: 25 
                }}
                className="fixed left-0 top-0 
                  bottom-0 w-80 bg-white z-50 
                  overflow-y-auto shadow-2xl">
                
                <div className="flex items-center 
                  justify-between p-5 
                  border-b border-gray-100">
                  <h3 className="font-black 
                    text-gray-900 text-lg 
                    flex items-center gap-2">
                    <SlidersHorizontal 
                      className="w-5 h-5 
                        text-primary"/>
                    Filtres
                  </h3>
                  <button
                    onClick={() => 
                      setMobileOpen(false)}
                    className="w-8 h-8 
                      bg-gray-100 rounded-full 
                      flex items-center 
                      justify-center 
                      hover:bg-gray-200">
                    <X className="w-4 h-4 
                      text-gray-500"/>
                  </button>
                </div>

                <div className="p-5">
                  <FilterContent/>
                </div>

                <div className="p-5 
                  border-t border-gray-100">
                  <button
                    onClick={() => 
                      setMobileOpen(false)}
                    className="w-full bg-primary 
                      hover:bg-primary-dark 
                      text-white font-black 
                      py-4 rounded-2xl 
                      transition-colors">
                    Voir {totalResults} résultats
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

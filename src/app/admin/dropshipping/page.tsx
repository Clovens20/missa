'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, Search, Plus, ShoppingBag, TrendingUp, Package, RefreshCw, 
  ExternalLink, Check, X, Filter, ChevronDown, Star, Truck, DollarSign,
  ArrowRight, Eye, EyeOff, Import, Loader, Trash2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import CJImportDrawer from '@/components/admin/CJImportDrawer'
import SupplierMessagePanel from '@/components/admin/SupplierMessagePanel'
import CJImageSearch from '@/components/admin/CJImageSearch'
import CJProductCard from '@/components/admin/CJProductCard'
import { LayoutGrid, List, Layers, Image as ImageIcon } from 'lucide-react'

const CJ_CATEGORIES = [
  { id: '', name: 'Toutes catégories' },
  { id: '2904', name: '👗 Vêtements Femme' },
  { id: '2905', name: '👔 Vêtements Homme' },
  { id: '2906', name: '👟 Chaussures' },
  { id: '2907', name: '👜 Sacs' },
  { id: '2908', name: '💄 Beauté' },
  { id: '2909', name: '🏠 Maison & Déco' },
  { id: '2910', name: '📱 Électronique' },
  { id: '2911', name: '💍 Bijoux' },
  { id: '2912', name: '🏃 Sport' },
  { id: '2913', name: '👶 Enfants' },
]

// ── Live Price + Margin Editor ──
function PriceMarginEditor({ 
  product,
  onSave 
}: { 
  product: any
  onSave: (id: string, price: number) => void
}) {
  const [price, setPrice] = useState(
    product.selling_price || 0
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Calculate margin in real time
  const cjPrice = product.cj_price || 0
  const margin = price - cjPrice
  const marginPct = cjPrice > 0
    ? Math.round((margin / cjPrice) * 100)
    : 0
  const isGood = margin > 0
  const isGreat = marginPct >= 100
  // 100% ROI = great!

  async function handleSave() {
    if (price <= 0) return
    setSaving(true)
    await onSave(product.id, price)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1.5">
      
      {/* Price input */}
      <div className="flex items-center 
        gap-1.5">
        <span className="text-gray-500 
          text-sm">$</span>
        <input
          type="number"
          value={price}
          onChange={e => {
            setPrice(
              parseFloat(e.target.value) || 0
            )
            setSaved(false)
          }}
          onBlur={handleSave}
          onKeyDown={e => 
            e.key === 'Enter' && handleSave()
          }
          step="0.50"
          min="0"
          className="w-24 bg-gray-800 
            border border-gray-700 
            rounded-lg px-2.5 py-1.5 
            text-white text-sm font-bold
            focus:outline-none 
            focus:border-primary
            transition-colors"
        />
        {saving && (
          <div className="w-3.5 h-3.5 
            border border-gray-500 
            border-t-primary rounded-full 
            animate-spin"/>
        )}
        {saved && (
          <span className="text-secondary 
            text-xs">✓</span>
        )}
      </div>

      {/* Live margin display */}
      <div className={`flex items-center 
        gap-1.5 px-2.5 py-1 rounded-lg
        transition-all duration-200
        ${isGreat
          ? 'bg-secondary/15'
          : isGood
            ? 'bg-primary/10'
            : 'bg-red-500/10'
        }`}>
        
        {/* Margin amount */}
        <span className={`font-black 
          text-sm transition-colors
          ${isGreat
            ? 'text-secondary'
            : isGood
              ? 'text-primary'
              : 'text-red-400'
          }`}>
          {isGood ? '+' : ''}
          ${margin.toFixed(2)}
        </span>

        {/* Separator */}
        <span className="text-gray-700">·</span>

        {/* ROI percentage */}
        <span className={`text-xs font-bold
          ${isGreat
            ? 'text-secondary'
            : isGood
              ? 'text-gray-400'
              : 'text-red-400'
          }`}>
          {marginPct}% ROI
        </span>

        {/* Emoji indicator */}
        <span className="text-xs">
          {marginPct >= 200 ? '🔥' 
           : marginPct >= 100 ? '✅' 
           : marginPct >= 50 ? '👍' 
           : isGood ? '⚠️' 
           : '❌'}
        </span>
      </div>

      {/* Warning if too low */}
      {!isGood && (
        <p className="text-red-400 
          text-[10px] leading-tight">
          Prix trop bas!
        </p>
      )}
      {isGood && marginPct < 50 && (
        <p className="text-yellow-400 
          text-[10px] leading-tight">
          Marge faible
        </p>
      )}
    </div>
  )
}

// ── Product Status Badge ──
function ProductStatusBadge({ 
  product 
}: { 
  product: any 
}) {
  // Check if product was recently 
  // verified as available
  const lastChecked = product.updated_at
  const daysSinceCheck = lastChecked
    ? Math.floor(
        (Date.now() - 
        new Date(lastChecked).getTime()
        ) / (1000 * 60 * 60 * 24)
      )
    : 999

  if (daysSinceCheck > 30) {
    return (
      <div className="flex items-center 
        gap-1 text-[10px] 
        text-yellow-400 font-semibold 
        mt-1">
        <span>⚠️</span>
        <span>Vérifier disponibilité CJ</span>
      </div>
    )
  }
  return null
}

export default function DropshippingPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'imported' | 'orders' | 'messages'>('search')
  const [featureOn, setFeatureOn] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  
  // Search state
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  
  // Imported products state
  const [importedProducts, setImportedProducts] = useState<any[]>([])
  const [loadingImported, setLoadingImported] = useState(false)
  
  // Dropship orders state
  const [dropshipOrders, setDropshipOrders] = useState<any[]>([])
  
  // Import state
  const [importing, setImporting] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [importPrice, setImportPrice] = useState<string>('')
  const [importCategory, setImportCategory] = useState<string>('')
  
  // Stats
  const [stats, setStats] = useState({
    totalImported: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  })

  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text')
  const [imageSearchPreview, setImageSearchPreview] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchInfo, setSearchInfo] = useState<any>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    const [settingRes, importedRes, ordersRes, catRes] = await Promise.all([
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'feature_dropshipping')
        .single(),
      supabase
        .from('dropship_products')
        .select('*')
        .order('imported_at', { ascending: false }),
      supabase
        .from('dropship_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
    ])

    setFeatureOn(settingRes.data?.value === true || settingRes.data?.value === 'true')
    setCategories(catRes.data || [])
    
    const imported = importedRes.data || []
    setImportedProducts(imported)
    setDropshipOrders(ordersRes.data || [])
    
    setStats({
      totalImported: imported.length,
      activeProducts: imported.filter(p => p.is_active).length,
      pendingOrders: (ordersRes.data || []).filter(o => o.status === 'submitted' || o.status === 'processing').length,
      totalRevenue: 0,
    })
  }

  async function toggleFeature() {
    const newVal = !featureOn
    await supabase
      .from('site_settings')
      .update({ value: newVal })
      .eq('key', 'feature_dropshipping')
    setFeatureOn(newVal)
    toast.success(newVal ? '✅ Dropshipping activé!' : '⏸️ Dropshipping désactivé')
  }

  async function handleSearch(resetPage = true) {
    setSearching(true)
    if (resetPage) {
      setPage(1)
      setSearchResults([])
      setSearchInfo(null)
    }
    
    try {
      const params = new URLSearchParams({
        q: query,
        page: resetPage ? '1' : page.toString(),
        ...(category && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      })

      const res = await fetch(`/api/cj/search?${params}`)
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const products = data.list || data.products || []
      
      if (resetPage) {
        setSearchResults(products)
        setSearchInfo(data.search_info || null)
      } else {
        setSearchResults(prev => [...prev, ...products])
      }
      
      setHasMore(products.length === 20)
    } catch (err: any) {
      toast.error('Erreur de recherche: ' + err.message)
    } finally {
      setSearching(false)
    }
  }

  async function handleImport(product: any) {
    const pid = product.pid || product.productId
    setImporting(pid)
    
    try {
      // ✅ VERIFY STATUS BEFORE IMPORT
      const res = await fetch(`/api/cj/product?pid=${pid}`)
      const data = await res.json()
      
      // Handle both { data: { productStatus } } and { productStatus } depending on API response
      const status = data?.data?.productStatus || data?.productStatus
      
      if (status === 'REMOVED' || status === 'OFFLINE' || !data) {
        toast.error("❌ Ce produit n'est plus disponible sur CJ")
        return
      }

      setSelectedProduct(product)
      // Pre-fill import price with 2.5x CJ price
      const cjPrice = parseFloat(product.sellPrice || product.productPrice || 0)
      setImportPrice((Math.ceil(cjPrice * 2.5 * 2) / 2).toFixed(2))
    } catch (err) {
      toast.error("Erreur lors de la vérification du produit")
    } finally {
      setImporting(null)
    }
  }

  async function confirmImport() {
    if (!selectedProduct) return
    const pid = selectedProduct.pid || selectedProduct.productId
    setImporting(pid)
    
    try {
      const res = await fetch('/api/cj/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pid,
          sellingPrice: parseFloat(importPrice) || undefined,
          categoryId: importCategory || undefined,
        }),
      })
      
      const data = await res.json()
      
      if (data.error) {
        if (res.status === 409) {
          toast.error('Produit déjà importé!')
        } else {
          throw new Error(data.error)
        }
      } else {
        toast.success('✅ Produit importé! Activez-le dans "Importés"')
        setSelectedProduct(null)
        loadInitialData()
        setActiveTab('imported')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setImporting(null)
    }
  }

  async function toggleProductActive(id: string, isActive: boolean) {
    await supabase.from('dropship_products').update({ is_active: isActive }).eq('id', id)
    setImportedProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: isActive } : p))
    toast.success(isActive ? '✅ Produit visible sur le shop!' : '⏸️ Produit masqué')
  }

  async function updatePrice(id: string, price: number) {
    await supabase.from('dropship_products').update({ 
      selling_price: price,
      profit_margin: price - (importedProducts.find(p => p.id === id)?.cj_price || 0)
    }).eq('id', id)
    toast.success('Prix mis à jour!')
  }

  async function deleteImportedProduct(
    id: string,
    name: string
  ) {
    if (!confirm(
      `Supprimer "${name}" de Missa Shop?\n\n` +
      `⚠️ Cette action est irréversible.\n` +
      `Le produit sera retiré du shop.`
    )) return

    const { error } = await supabase
      .from('dropship_products')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erreur: ' + error.message)
      return
    }

    // Remove from local state instantly
    setImportedProducts(prev => 
      prev.filter(p => p.id !== id)
    )

    toast.success(
      `🗑️ "${name}" supprimé!`
    )

    // Refresh stats
    loadInitialData()
  }

  async function syncTracking() {
    const res = await fetch('/api/cj/tracking')
    const data = await res.json()
    toast.success(`✅ ${data.updated} commandes mises à jour!`)
    loadInitialData()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-400"/>
            </div>
            Dropshipping CJDropshipping
          </h1>
          <p className="text-gray-500 text-sm mt-1">Importez des produits et gérez vos commandes CJDropshipping</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={syncTracking}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <RefreshCw className="w-4 h-4"/>
            Sync tracking
          </button>

          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${featureOn ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-800 border-gray-700'}`}>
            <span className={`text-sm font-bold ${featureOn ? 'text-secondary' : 'text-gray-400'}`}>{featureOn ? '✅ Actif' : '⏸️ Désactivé'}</span>
            <button
              onClick={toggleFeature}
              className={`relative w-12 h-6 rounded-full transition-all ${featureOn ? 'bg-secondary' : 'bg-gray-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${featureOn ? 'left-7' : 'left-1'}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Produits importés', value: stats.totalImported, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Actifs sur le shop', value: stats.activeProducts, icon: Eye, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Commandes en cours', value: stats.pendingOrders, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Revenu dropship', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.color}`}/></div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {[
          ['search', '🔍 Rechercher produits'],
          ['imported', `📦 Importés (${importedProducts.length})`],
          ['orders', `🚚 Commandes (${dropshipOrders.length})`],
          ['messages', '💬 Instructions CJ'],
        ].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {/* ── TAB: SEARCH ── */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          
          {/* Search mode toggle */}
          <div className="flex items-center justify-between mb-4">
            {/* Text vs Image toggle */}
            <div className="flex gap-2 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setSearchMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${searchMode === 'text'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                  }`}>
                <Search className="w-4 h-4"/>
                Recherche texte
              </button>
              <button
                onClick={() => setSearchMode('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${searchMode === 'image'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                  }`}>
                <ImageIcon className="w-4 h-4"/>
                Recherche par image
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                  IA
                </span>
              </button>
            </div>

            {/* View mode toggle */}
            {searchResults.length > 0 && (
              <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all
                    ${viewMode === 'grid'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-500 hover:text-white'
                    }`}>
                  <LayoutGrid className="w-4 h-4"/>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all
                    ${viewMode === 'list'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-500 hover:text-white'
                    }`}>
                  <List className="w-4 h-4"/>
                </button>
              </div>
            )}
          </div>

          {/* Text search */}
          {searchMode === 'text' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-64 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Rechercher sur CJDropshipping..." className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/>
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none">
                  {CJ_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Prix min $" className="w-28 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Prix max $" className="w-28 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/>
                <button onClick={() => handleSearch()} disabled={searching} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50">{searching ? <Loader className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}Rechercher</button>
              </div>
            </div>
          )}

          {/* Image search */}
          {searchMode === 'image' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              {imageSearchPreview && (
                <div className="flex items-center gap-4 mb-5 p-3 bg-gray-800 rounded-xl">
                  <img src={imageSearchPreview} alt="Search image" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold text-sm">Recherche visuelle active</p>
                    <p className="text-gray-500 text-xs">Produits similaires à votre image</p>
                  </div>
                </div>
              )}
              
              <CJImageSearch
                onResults={(results, preview, method) => {
                  setSearchResults(results)
                  setImageSearchPreview(preview)
                  // Show method used
                  if (results.length > 0) {
                    console.log('Search method:', method)
                  }
                }}
                onSearching={(loading) => {
                  setSearching(loading)
                }}
              />
            </div>
          )}

          {/* Results */}
          {searchInfo?.was_translated && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-4 mb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-blue-400"/>
              </div>
              <div className="text-sm">
                <p className="text-blue-200 font-bold">Traduction automatique</p>
                <p className="text-blue-400/80 text-xs">
                  Votre recherche a été traduite en anglais pour CJ : 
                  <span className="text-white font-black ml-1 bg-blue-500/20 px-2 py-0.5 rounded">
                    "{searchInfo.translated}"
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">
                  <strong className="text-white">{searchResults.length}</strong> produits trouvés
                  {searchMode === 'image' && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">🔍 Similaires à votre image</span>
                  )}
                </p>
              </div>
              
              <div className={viewMode === 'grid'
                ? 'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                : 'space-y-3'
              }>
                {searchResults.map((product: any) => {
                  const pid = product.pid || product.productId
                  return (
                    <CJProductCard
                      key={pid}
                      product={product}
                      onImport={handleImport}
                      importing={importing === pid}
                      viewMode={viewMode}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {!searching && searchResults.length === 0 && (
            <div className="text-center py-20"><Globe className="w-16 h-16 text-gray-700 mx-auto mb-4"/><p className="text-gray-400 font-semibold text-lg mb-2">Recherchez des produits sur CJDropshipping</p><p className="text-gray-600 text-sm">Des milliers de produits disponibles pour votre shop</p></div>
          )}

          {hasMore && searchMode === 'text' && (
            <div className="text-center pt-4"><button onClick={() => { setPage(p => p + 1); handleSearch(false) }} disabled={searching} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50">Charger plus de produits</button></div>
          )}
        </div>
      )}

      {/* ── TAB: IMPORTED ── */}
      {activeTab === 'imported' && (
        <div className="space-y-4">
          {importedProducts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center"><Package className="w-16 h-16 text-gray-700 mx-auto mb-4"/><p className="text-gray-400 font-semibold text-lg mb-2">Aucun produit importé</p><p className="text-gray-600 text-sm mb-6">Recherchez et importez des produits CJDropshipping</p><button onClick={() => setActiveTab('search')} className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Rechercher des produits</button></div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-800">{['Produit', 'Coût CJ', 'Prix & Marge Live', 'Statut', 'Actions'].map(h => <th key={h} className="text-left px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {importedProducts.map(p => (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">{p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover"/>}</div><div className="min-w-0"><p className="text-white font-semibold text-sm line-clamp-1">{p.name}</p><p className="text-gray-500 text-xs">CJ: {p.cj_product_id?.substring(0, 12)}... <span className="text-gray-600 ml-2">{p.active_variants_count || p.variants?.length || 0}/{p.variants_count || p.variants?.length || 0} var.</span></p><p className="text-blue-400 text-xs">🚚 {p.shipping_time}</p><ProductStatusBadge product={p}/></div></div></td>
                      <td className="px-5 py-4"><span className="text-gray-400 font-bold">{formatPrice(p.cj_price)}</span></td>
                      <td className="px-5 py-4">
                        <PriceMarginEditor
                          product={p}
                          onSave={updatePrice}
                        />
                      </td>
                      <td className="px-5 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.is_active ? 'bg-secondary/20 text-secondary' : 'bg-gray-700 text-gray-500'}`}>{p.is_active ? '✅ Visible' : '⏸️ Masqué'}</span></td>
                      <td className="px-5 py-4"><div className="flex items-center gap-2"><button onClick={() => toggleProductActive(p.id, !p.is_active)} className={`p-2 rounded-xl transition-colors ${p.is_active ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'}`} title={p.is_active ? 'Masquer' : 'Activer'}>{p.is_active ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button><Link href={`/admin/dropshipping/${p.id}/variants`} className="p-2 bg-gray-800 hover:bg-primary/20 hover:text-primary text-gray-400 rounded-xl transition-colors" title="Gérer les variantes"><Layers className="w-4 h-4"/></Link><a href={`https://cjdropshipping.com/product/${p.cj_product_id}.html`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition-colors relative group" title="Voir sur CJ (peut être supprimé)"><ExternalLink className="w-4 h-4"/><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-700 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">Voir sur CJ<br/><span className="text-yellow-400">⚠️ Peut être supprimé</span></div></a><button onClick={() => deleteImportedProduct(p.id, p.name)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-colors" title="Supprimer ce produit"><Trash2 className="w-4 h-4"/></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ORDERS ── */}
      {activeTab === 'orders' && (
        <div>
          {dropshipOrders.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center"><Truck className="w-16 h-16 text-gray-700 mx-auto mb-4"/><p className="text-gray-400">Aucune commande dropship</p></div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-800">{['Commande', 'Client', 'Statut CJ', 'CJ Order #', 'Tracking', 'Date'].map(h => <th key={h} className="text-left px-5 py-3.5 text-xs font-black text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {dropshipOrders.map(o => (
                    <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-5 py-4"><span className="text-primary font-bold text-sm">{o.order_number}</span></td>
                      <td className="px-5 py-4"><p className="text-white text-sm">{o.shipping_name}</p><p className="text-gray-500 text-xs">{o.shipping_city}, {o.shipping_country}</p></td>
                      <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${o.status === 'shipped' ? 'bg-secondary/20 text-secondary' : o.status === 'failed' ? 'bg-red-500/20 text-red-400' : o.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{o.status === 'pending' ? '⏳ En attente' : o.status === 'submitted' ? '📤 Soumis' : o.status === 'processing' ? '📦 En traitement' : o.status === 'shipped' ? '🚚 Expédié' : o.status === 'delivered' ? '✅ Livré' : o.status === 'failed' ? '❌ Échoué' : o.status}</span></td>
                      <td className="px-5 py-4"><span className="text-gray-400 text-xs font-mono">{o.cj_order_number || o.cj_order_id || 'Pending'}</span></td>
                      <td className="px-5 py-4">{o.tracking_number ? <a href={o.tracking_url || `https://t.17track.net/en#nums=${o.tracking_number}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-mono flex items-center gap-1">{o.tracking_number.substring(0, 20)}<ExternalLink className="w-3 h-3"/></a> : <span className="text-gray-600 text-xs">En attente...</span>}</td>
                      <td className="px-5 py-4"><span className="text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('fr')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MESSAGES ── */}
      {activeTab === 'messages' && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
          <SupplierMessagePanel mode="full" />
        </div>
      )}

      <CJImportDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onImported={() => {
          loadInitialData()
          setActiveTab('imported')
        }}
      />
    </div>
  )
}

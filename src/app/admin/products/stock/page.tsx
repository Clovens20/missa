'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, RefreshCw, AlertCircle, CheckCircle, 
  XCircle, Search, Filter, ArrowUpRight, 
  Clock, TrendingDown, ExternalLink
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export default function StockMonitorPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('dropship_products')
      .select('*')
      .order('last_stock_sync', { ascending: false })
    
    setProducts(data || [])
    setLoading(false)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      // In a real app, CRON_SECRET would be needed
      // Here we assume the API handles it or we pass it if we have it
      const res = await fetch('/api/cron/sync-cj-stock?key=' + (process.env.NEXT_PUBLIC_CRON_SECRET || 'manual'), {
        method: 'GET'
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`✅ Synchronisation terminée: ${data.updated} produits mis à jour`)
        loadProducts()
      } else {
        throw new Error(data.error || 'Erreur sync')
      }
    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.cj_product_id?.toLowerCase().includes(search.toLowerCase())
    
    if (filter === 'low') return matchesSearch && p.stock_quantity > 0 && p.stock_quantity <= 10
    if (filter === 'out') return matchesSearch && p.stock_quantity === 0
    return matchesSearch
  })

  const stats = {
    total: products.length,
    low: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length,
    out: products.filter(p => p.stock_quantity === 0).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400"/>
            </div>
            Moniteur de Stock CJ
          </h1>
          <p className="text-gray-500 text-sm mt-1">Surveillez et synchronisez le stock de vos produits dropshipping</p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50 active:scale-95">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}/>
          {syncing ? 'Synchronisation...' : 'Sync maintenant'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Produits CJ', value: stats.total, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Stock Faible (<10)', value: stats.low, icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Rupture de Stock', value: stats.out, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.color}`}/></div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900 border border-gray-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou ID CJ..." 
            className="w-full pl-11 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'low', label: 'Stock Faible' },
            { id: 'out', label: 'Rupture' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === f.id ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                {['Produit', 'Stock CJ', 'Dernière Sync', 'Statut Shop', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"/></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Package className="w-12 h-12"/>
                      <p className="font-bold">Aucun produit trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {product.images?.[0]?.url && (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover"/>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-sm truncate">{product.name}</p>
                          <p className="text-gray-500 text-[10px] font-mono">CJ: {product.cj_product_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-1.5 font-black text-sm ${product.stock_quantity > 10 ? 'text-emerald-400' : product.stock_quantity > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                          {product.stock_quantity > 0 ? (
                            <CheckCircle className="w-3.5 h-3.5"/>
                          ) : (
                            <XCircle className="w-3.5 h-3.5"/>
                          )}
                          {product.stock_quantity}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {product.variants?.length || 0} variantes
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <Clock className="w-3.5 h-3.5 text-gray-600"/>
                        {product.last_stock_sync ? (
                          new Date(product.last_stock_sync).toLocaleString('fr-CA', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          })
                        ) : 'Jamais'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${product.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                        {product.is_active ? 'Actif' : 'Masqué'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/admin/dropshipping?id=${product.id}`}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors">
                          <ArrowUpRight className="w-4 h-4"/>
                        </Link>
                        <a 
                          href={`https://cjdropshipping.com/product/${product.cj_product_id}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4"/>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

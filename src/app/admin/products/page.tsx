'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Plus, Search, Filter, Edit, Trash2, 
  Package, FileSpreadsheet, Eye, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
      toast.success(current ? 'Produit désactivé' : 'Produit activé')
    }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white">📦 Produits</h1><p className="text-gray-500 text-sm mt-0.5">Gérez votre inventaire Missa Shop</p></div>
        <div className="flex gap-3">
          <Link href="/admin/products/import" className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"><FileSpreadsheet className="w-4 h-4"/>Import CSV</Link>
          <Link href="/admin/products/new" className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/25"><Plus className="w-4 h-4"/>Nouveau produit</Link>
        </div>
      </div>

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit par nom ou SKU..." className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:border-primary focus:outline-none transition-colors"/></div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-800 bg-gray-900">{['Produit', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actions'].map(h => (<th key={h} className="text-left px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead><tbody>{loading ? Array(5).fill(0).map((_, i) => (<tr key={i} className="border-b border-gray-800/50">{Array(6).fill(0).map((_, j) => (<td key={j} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"/></td>))}</tr>)) : filtered.length === 0 ? (<tr><td colSpan={6} className="text-center py-12 text-gray-500">Aucun produit trouvé</td></tr>) : filtered.map(product => (<tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">{product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover"/>}</div><div><p className="text-white font-bold text-sm truncate max-w-[200px]">{product.name}</p><p className="text-gray-500 text-xs font-mono">{product.sku || 'Pas de SKU'}</p></div></div></td><td className="px-6 py-4 text-sm text-gray-400">{product.categories?.name || 'Sans catégorie'}</td><td className="px-6 py-4 text-sm font-black text-white">{formatPrice(product.price)}</td><td className="px-6 py-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${product.stock_quantity > 5 ? 'bg-secondary/15 text-secondary' : 'bg-red-500/15 text-red-400'}`}>{product.stock_quantity} en stock</span></td><td className="px-6 py-4"><button onClick={() => toggleStatus(product.id, product.is_active)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${product.is_active ? 'bg-secondary/20 text-secondary' : 'bg-gray-700 text-gray-500'}`}>{product.is_active ? <><CheckCircle className="w-3 h-3"/>Actif</> : <><XCircle className="w-3 h-3"/>Inactif</>}</button></td><td className="px-6 py-4"><div className="flex items-center gap-2"><Link href={`/admin/products/edit/${product.id}`} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"><Edit className="w-4 h-4"/></Link><button onClick={async () => { if (confirm('Supprimer ce produit?')) { await supabase.from('products').delete().eq('id', product.id); loadProducts(); toast.success('Produit supprimé') } }} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button></div></td></tr>))}</tbody></table></div></div>
    </div>
  )
}

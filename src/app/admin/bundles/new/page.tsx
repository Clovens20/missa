'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Search, Plus, 
  Trash2, Save, Package
} from 'lucide-react'
import Link from 'next/link'
import { formatAdminPrice, slugify } from '@/lib/utils'
import { toast } from 'sonner'
import RichTextEditor from '@/components/admin/RichTextEditor'

export default function NewBundlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 15,
    stock_limit: '',
    is_featured: false,
    valid_until: '',
    is_active: true,
  })

  const originalPrice = selectedProducts.reduce((sum, p) => sum + (p.price * (p.qty || 1)), 0)
  const bundlePrice = form.discount_type === 'percentage'
    ? originalPrice * (1 - form.discount_value / 100)
    : originalPrice - form.discount_value
  const savings = originalPrice - bundlePrice

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('products').select('*').eq('is_active', true).ilike('name', `%${searchQuery}%`).limit(5)
      setSearchResults(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function addProduct(product: any) {
    if (selectedProducts.find(p => p.id === product.id)) { toast.error('Produit déjà dans le bundle'); return }
    setSelectedProducts(prev => [...prev, { ...product, qty: 1 }])
    setSearchQuery(''); setSearchResults([])
  }

  function removeProduct(id: string) { setSelectedProducts(prev => prev.filter(p => p.id !== id)) }
  function updateQty(id: string, qty: number) { setSelectedProducts(prev => prev.map(p => p.id === id ? { ...p, qty } : p)) }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nom du bundle requis'); return }
    if (selectedProducts.length < 2) { toast.error('Minimum 2 produits requis'); return }
    setSaving(true)
    try {
      const bundleData = {
        name: form.name,
        slug: slugify(form.name),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        products: selectedProducts.map(p => ({
          product_id: p.id,
          qty: p.qty,
          name: p.name,
          price: p.price,
          image: p.images?.[0]?.url || '',
          slug: p.slug,
        })),
        original_price: originalPrice,
        bundle_price: Math.max(0, bundlePrice),
        savings: savings,
        stock_limit: form.stock_limit ? parseInt(form.stock_limit) : null,
        is_featured: form.is_featured,
        is_active: form.is_active,
        valid_until: form.valid_until || null,
        image_url: selectedProducts[0]?.images?.[0]?.url || null,
      }
      const { error } = await supabase.from('bundles').insert(bundleData)
      if (error) throw error
      toast.success('✅ Bundle créé!')
      router.push('/admin/bundles')
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/bundles" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5"/>
        </Link>
        <h1 className="text-2xl font-black text-white">Créer un Bundle</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Informations du bundle</h2>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Nom du bundle *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder='Ex: "Le Look Complet"' className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
                <RichTextEditor 
                  value={form.description}
                  onChange={(html) => setForm(p => ({...p, description: html}))}
                  placeholder="Décrivez ce bundle..."
                  minHeight={150}
                  compact={true}
                />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-white">Configuration de la réduction</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Type</label>
                <select value={form.discount_type} onChange={e => setForm(p => ({...p, discount_type: e.target.value}))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary outline-none">
                  <option value="percentage">% Pourcentage</option>
                  <option value="fixed">$ Montant fixe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Valeur</label>
                <input type="number" value={form.discount_value} onChange={e => setForm(p => ({...p, discount_value: +e.target.value}))} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary outline-none"/>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-white mb-4">Produits du bundle (min. 2)</h2>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un produit..." className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary outline-none"/>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-10 mt-1 overflow-hidden">
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                        {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.name}</p>
                        <p className="text-primary text-xs font-bold">{formatAdminPrice(p.price)}</p>
                      </div>
                      <Plus className="w-4 h-4 text-primary flex-shrink-0"/>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {selectedProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                    {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-primary text-xs font-bold">{formatAdminPrice(p.price)}</p>
                  </div>
                  <button onClick={() => removeProduct(p.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>

          {selectedProducts.length >= 2 && (
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6">
              <h2 className="font-bold text-white mb-4">💰 Aperçu des prix</h2>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between"><span>Prix original</span><span className="line-through">{formatAdminPrice(originalPrice)}</span></div>
                <div className="flex justify-between text-red-400 font-bold"><span>Réduction</span><span>-{formatAdminPrice(savings)}</span></div>
                <div className="flex justify-between text-2xl font-black text-primary pt-2 border-t border-primary/20"><span>Prix bundle</span><span>{formatAdminPrice(Math.max(0, bundlePrice))}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Link href="/admin/bundles" className="px-6 py-3 border border-gray-700 rounded-xl text-gray-400 hover:text-white font-semibold text-sm transition-colors">Annuler</Link>
        <button onClick={handleSave} disabled={saving || selectedProducts.length < 2} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-8 py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/25 disabled:opacity-50">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
          Créer le bundle
        </button>
      </div>
    </div>
  )
}


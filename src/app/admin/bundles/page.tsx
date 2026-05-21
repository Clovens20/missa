'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Package, Plus, Pencil, 
  Trash2, Eye, EyeOff,
  Tag, ArrowRight, Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatAdminPrice } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export default function BundlesAdminPage() {
  const [bundles, setBundles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [featureOn, setFeatureOn] = useState(false)

  useEffect(() => {
    loadBundles()
    checkFeature()
  }, [])

  async function checkFeature() {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'feature_bundles')
      .single()
    setFeatureOn(data?.value === true || data?.value === 'true')
  }

  async function toggleFeature() {
    const newVal = !featureOn
    await supabase
      .from('site_settings')
      .update({ value: String(newVal) })
      .eq('key', 'feature_bundles')
    setFeatureOn(newVal)
    toast.success(newVal ? '✅ Bundles activés sur le shop!' : '⏸️ Bundles désactivés')
  }

  async function loadBundles() {
    const { data } = await supabase
      .from('bundles')
      .select('*')
      .order('created_at', { ascending: false })
    setBundles(data || [])
    setLoading(false)
  }

  async function toggleBundle(id: string, isActive: boolean) {
    await supabase.from('bundles').update({ is_active: isActive }).eq('id', id)
    setBundles(prev => prev.map(b => b.id === id ? { ...b, is_active: isActive } : b))
    toast.success(isActive ? 'Bundle activé' : 'Bundle désactivé')
  }

  async function deleteBundle(id: string) {
    if (!confirm('Supprimer ce bundle?')) return
    await supabase.from('bundles').delete().eq('id', id)
    setBundles(prev => prev.filter(b => b.id !== id))
    toast.success('Bundle supprimé')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary"/>
            </div>
            Bundles Produits
          </h1>
          <p className="text-gray-500 text-sm mt-1">Créez des ensembles avec réduction pour augmenter le panier moyen</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${featureOn ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-800 border-gray-700'}`}>
            <span className={`text-sm font-bold ${featureOn ? 'text-secondary' : 'text-gray-400'}`}>
              {featureOn ? '✅ Activé sur le shop' : '⏸️ Désactivé'}
            </span>
            <button
              onClick={toggleFeature}
              className={`relative w-12 h-6 rounded-full transition-all ${featureOn ? 'bg-secondary' : 'bg-gray-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${featureOn ? 'left-7' : 'left-1'}`}/>
            </button>
          </div>

          <Link href="/admin/bundles/new" className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4"/>
            Créer un bundle
          </Link>
        </div>
      </div>

      {!featureOn && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏸️</span>
          <p className="text-yellow-400 text-sm">
            <strong>Fonctionnalité désactivée.</strong> Les bundles ne sont pas visibles sur le shop. Activez le toggle pour les afficher.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse"/>)}
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-16 text-center">
          <Package className="w-16 h-16 text-gray-700 mx-auto mb-4"/>
          <h3 className="text-white font-bold text-xl mb-2">Aucun bundle créé</h3>
          <p className="text-gray-500 mb-6">Créez votre premier bundle pour augmenter votre panier moyen</p>
          <Link href="/admin/bundles/new" className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl transition-colors hover:bg-primary-dark">
            <Plus className="w-4 h-4"/>
            Créer le premier bundle
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map(bundle => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${bundle.is_active ? 'border-gray-700 hover:border-primary/40' : 'border-gray-800 opacity-60'}`}>
              {bundle.image_url && (
                <div className="h-40 overflow-hidden">
                  <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover"/>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-black text-white text-base line-clamp-1">{bundle.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${bundle.is_active ? 'bg-secondary/20 text-secondary' : 'bg-gray-700 text-gray-500'}`}>
                    {bundle.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-3">{bundle.products?.length || 0} produits inclus</p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl font-black text-primary">{formatAdminPrice(bundle.bundle_price || 0)}</span>
                  {bundle.original_price && <span className="text-sm text-gray-500 line-through">{formatAdminPrice(bundle.original_price)}</span>}
                  {bundle.discount_value && <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full">-{bundle.discount_value}{bundle.discount_type === 'percentage' ? '%' : '$'}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>🛒 {bundle.sold_count || 0} vendus</span>
                  {bundle.stock_limit && <span>📦 Stock: {bundle.stock_limit}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBundle(bundle.id, !bundle.is_active)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${bundle.is_active ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'}`}>
                    {bundle.is_active ? <><EyeOff className="w-3 h-3"/>Désactiver</> : <><Eye className="w-3 h-3"/>Activer</>}
                  </button>
                  <button onClick={() => deleteBundle(bundle.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}


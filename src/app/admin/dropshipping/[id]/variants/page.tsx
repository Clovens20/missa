'use client'
import { useState, useEffect } 
  from 'react'
import { useParams, useRouter } 
  from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Save, Check,
  X, Trash2, Eye, EyeOff,
  Package, RefreshCw,
  AlertCircle, Info,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import UrgencySettings from '@/components/admin/UrgencySettings'

export default function VariantManagerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = 
    useState<any>(null)
  const [variants, setVariants] = 
    useState<any[]>([])
  const [loading, setLoading] = 
    useState(true)
  const [saving, setSaving] = 
    useState(false)
  const [hasChanges, setHasChanges] = 
    useState(false)

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    const { data } = await supabase
      .from('dropship_products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) {
      setProduct(data)
      // Use all_variants if available,
      // otherwise use variants
      const allVars = 
        data.all_variants?.length > 0
          ? data.all_variants
          : data.variants || []
      
      // Mark which are active
      const activeIds = new Set(
        (data.active_variants || 
          data.variants || [])
          .map((v: any) => v.vid)
      )
      
      setVariants(allVars.map(
        (v: any) => ({
          ...v,
          isActive: activeIds.has(v.vid) 
            || activeIds.size === 0,
          // If no active list, 
          // all are active
        })
      ))
    }
    setLoading(false)
  }

  function toggleVariant(vid: string) {
    setVariants(prev => prev.map(v => 
      v.vid === vid 
        ? { ...v, isActive: !v.isActive }
        : v
    ))
    setHasChanges(true)
  }

  function toggleAllVariants(
    active: boolean
  ) {
    setVariants(prev => prev.map(v => ({
      ...v, isActive: active
    })))
    setHasChanges(true)
  }

  function deleteVariant(vid: string) {
    if (!confirm(
      'Supprimer définitivement cette variante?'
    )) return
    setVariants(prev => 
      prev.filter(v => v.vid !== vid)
    )
    setHasChanges(true)
  }

  async function saveChanges() {
    setSaving(true)
    try {
      const activeVariants = variants.filter(
        v => v.isActive
      )
      
      const { error } = await supabase
        .from('dropship_products')
        .update({
          all_variants: variants,
          active_variants: activeVariants,
          variants: activeVariants,
          // Update main variants 
          // to active only
          variants_count: variants.length,
          active_variants_count: 
            activeVariants.length,
          updated_at: 
            new Date().toISOString(),
        })
        .eq('id', id)
      
      if (error) throw error
      
      setHasChanges(false)
      toast.success(
        `✅ ${activeVariants.length} variantes actives sauvegardées!`
      )
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Group by color
  const byColor = variants.reduce(
    (acc: any, v) => {
      const key = v.color || 
        'Couleur unique'
      if (!acc[key]) acc[key] = []
      acc[key].push(v)
      return acc
    }, {}
  )

  const activeCount = variants.filter(
    v => v.isActive
  ).length

  if (loading) {
    return (
      <div className="flex items-center 
        justify-center h-64">
        <div className="w-8 h-8 
          border-2 border-primary/30 
          border-t-primary rounded-full 
          animate-spin"/>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">
          Produit non trouvé
        </p>
        <Link href="/admin/dropshipping"
          className="text-primary mt-2 block">
          ← Retour
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto 
      space-y-6">
      
      {/* Header */}
      <div className="flex items-center 
        justify-between flex-wrap gap-4">
        <div className="flex items-center 
          gap-4">
          <Link 
            href="/admin/dropshipping"
            className="p-2 bg-gray-800 
              hover:bg-gray-700 
              rounded-xl text-gray-400 
              hover:text-white 
              transition-colors">
            <ArrowLeft className="w-5 h-5"/>
          </Link>
          <div>
            <h1 className="text-xl 
              font-black text-white">
              Gérer les Variantes
            </h1>
            <p className="text-gray-500 
              text-sm line-clamp-1">
              {product.name}
            </p>
          </div>
        </div>

        {/* Save button */}
        {hasChanges && (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center 
              gap-2 bg-primary 
              hover:bg-primary-dark 
              text-white font-black 
              px-6 py-2.5 rounded-xl 
              text-sm transition-all 
              shadow-lg shadow-primary/25 
              disabled:opacity-50">
            {saving ? (
              <div className="w-4 h-4 
                border-2 border-white/30 
                border-t-white rounded-full 
                animate-spin"/>
            ) : (
              <Save className="w-4 h-4"/>
            )}
            Sauvegarder les changements
          </motion.button>
        )}
      </div>

      {/* Product preview */}
      <div className="bg-gray-900 
        border border-gray-800 
        rounded-2xl p-5 flex gap-4">
        {product.images?.[0]?.url && (
          <div className="w-20 h-20 
            rounded-xl overflow-hidden 
            bg-gray-800 flex-shrink-0">
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full 
                object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <p className="font-bold 
            text-white mb-1">
            {product.name}
          </p>
          <div className="flex flex-wrap 
            gap-3 text-sm">
            <span className="text-gray-400">
              Prix: {formatPrice(
                product.selling_price
              )}
            </span>
            <span className="text-primary">
              Coût CJ: {formatPrice(
                product.cj_price
              )}
            </span>
            <span className={`font-bold
              ${product.is_active
                ? 'text-secondary'
                : 'text-gray-500'}`}>
              {product.is_active 
                ? '✅ Visible sur shop' 
                : '⏸️ Masqué'}
            </span>
          </div>
        </div>
      </div>

      <UrgencySettings
        product={product}
        table="dropship_products"
        onUpdate={loadProduct}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 
        gap-4">
        {[
          { 
            label: 'Total variantes CJ', 
            value: variants.length,
            color: 'text-white'
          },
          { 
            label: 'Actives (visibles)', 
            value: activeCount,
            color: 'text-secondary'
          },
          { 
            label: 'Désactivées', 
            value: variants.length - 
              activeCount,
            color: 'text-red-400'
          },
        ].map((s, i) => (
          <div key={i}
            className="bg-gray-900 
              border border-gray-800 
              rounded-2xl p-4 text-center">
            <p className={`text-3xl 
              font-black ${s.color}`}>
              {s.value}
            </p>
            <p className="text-gray-500 
              text-xs mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Global actions */}
      <div className="flex gap-3 
        flex-wrap">
        <button
          onClick={() => 
            toggleAllVariants(true)}
          className="flex items-center 
            gap-2 bg-secondary/20 
            hover:bg-secondary/30 
            text-secondary font-bold 
            px-4 py-2.5 rounded-xl 
            text-sm transition-colors">
          <Check className="w-4 h-4"/>
          Activer tout
        </button>
        <button
          onClick={() => 
            toggleAllVariants(false)}
          className="flex items-center 
            gap-2 bg-red-500/10 
            hover:bg-red-500/20 
            text-red-400 font-bold 
            px-4 py-2.5 rounded-xl 
            text-sm transition-colors">
          <X className="w-4 h-4"/>
          Désactiver tout
        </button>
        <div className="ml-auto 
          flex items-center gap-2 
          text-xs text-gray-500 
          bg-gray-800 px-4 py-2.5 
          rounded-xl">
          <Info className="w-3.5 h-3.5"/>
          Cliquez sur une variante 
          pour l'activer/désactiver
        </div>
      </div>

      {/* Variants by color group */}
      {Object.entries(byColor).map(
        ([color, colorVariants]: any) => (
        <div key={color}
          className="bg-gray-900 
            border border-gray-800 
            rounded-2xl overflow-hidden">
          
          {/* Color header */}
          <div className="flex items-center 
            justify-between px-5 py-3.5 
            border-b border-gray-800 
            bg-gray-800/50">
            <div className="flex items-center 
              gap-3">
              {/* Color image */}
              {colorVariants[0]?.properties
                ?.find((p: any) => 
                  p.name?.toLowerCase()
                    .includes('color')
                )?.image && (
                <div className="w-8 h-8 
                  rounded-full overflow-hidden 
                  border-2 border-gray-600 
                  flex-shrink-0">
                  <img
                    src={colorVariants[0]
                      .properties.find(
                        (p: any) => 
                          p.name?.toLowerCase()
                            .includes('color')
                      )?.image}
                    alt={color}
                    className="w-full h-full 
                      object-cover"
                  />
                </div>
              )}
              <div>
                <span className="font-black 
                  text-white">
                  {color}
                </span>
                <span className="text-gray-500 
                  text-xs ml-3">
                  {colorVariants.filter(
                    (v: any) => v.isActive
                  ).length}/
                  {colorVariants.length} actives
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const vids = colorVariants
                    .map((v: any) => v.vid)
                  setVariants(prev => 
                    prev.map(v => 
                      vids.includes(v.vid)
                        ? { ...v, isActive: true }
                        : v
                    )
                  )
                  setHasChanges(true)
                }}
                className="text-xs 
                  text-secondary font-bold 
                  px-3 py-1.5 rounded-lg 
                  bg-secondary/10 
                  hover:bg-secondary/20 
                  transition-colors">
                Tout activer
              </button>
              <button
                onClick={() => {
                  const vids = colorVariants
                    .map((v: any) => v.vid)
                  setVariants(prev => 
                    prev.map(v => 
                      vids.includes(v.vid)
                        ? { ...v, isActive: false }
                        : v
                    )
                  )
                  setHasChanges(true)
                }}
                className="text-xs 
                  text-red-400 font-bold 
                  px-3 py-1.5 rounded-lg 
                  bg-red-500/10 
                  hover:bg-red-500/20 
                  transition-colors">
                Tout désactiver
              </button>
            </div>
          </div>

          {/* Variants list */}
          <div className="p-4 space-y-2">
            {colorVariants.map(
              (v: any) => (
              <motion.div
                key={v.vid}
                layout
                className={`flex items-center 
                  gap-4 p-4 rounded-xl 
                  border transition-all
                  ${v.isActive
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-800/30 border-gray-800 opacity-50'
                  }`}>
                
                {/* Toggle */}
                <button
                  onClick={() => 
                    toggleVariant(v.vid)}
                  className={`w-8 h-8 
                    rounded-xl border-2 
                    flex items-center 
                    justify-center 
                    transition-all 
                    flex-shrink-0
                    ${v.isActive
                      ? 'bg-secondary border-secondary'
                      : 'border-gray-600 hover:border-gray-400'
                    }`}>
                  {v.isActive && (
                    <Check className="w-4 h-4 
                      text-white"/>
                  )}
                </button>

                {/* Variant image */}
                <div className="w-14 h-14 
                  rounded-xl overflow-hidden 
                  bg-gray-700 flex-shrink-0 
                  border border-gray-600">
                  {v.image ? (
                    <img
                      src={v.image}
                      alt={v.size || 'variant'}
                      className="w-full h-full 
                        object-cover"
                    />
                  ) : (
                    <div className="w-full 
                      h-full flex items-center 
                      justify-center">
                      <Package className="w-6 h-6 
                        text-gray-600"/>
                    </div>
                  )}
                </div>

                {/* Variant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center 
                    gap-2 flex-wrap mb-1">
                    {v.size && (
                      <span className="bg-gray-700 
                        text-white text-xs 
                        font-bold px-2.5 py-1 
                        rounded-lg">
                        {v.size}
                      </span>
                    )}
                    {v.style && (
                      <span className="bg-gray-700 
                        text-white text-xs 
                        font-bold px-2.5 py-1 
                        rounded-lg">
                        {v.style}
                      </span>
                    )}
                    {v.material && (
                      <span className="bg-gray-700 
                        text-gray-300 text-xs 
                        px-2.5 py-1 rounded-lg">
                        {v.material}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center 
                    gap-3 text-xs">
                    <span className="text-gray-500 
                      font-mono">
                      {v.sku}
                    </span>
                    <span className={`font-bold
                      ${v.stock === 0
                        ? 'text-red-400'
                        : v.stock <= 10
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                      }`}>
                      {v.stock === 0 
                        ? '❌ Rupture' 
                        : v.stock >= 999 
                          ? '♾️ En stock' 
                          : `📦 ${v.stock} en stock`}
                    </span>
                    <span className="text-primary">
                      CJ: {formatPrice(
                        v.cjPrice || v.price || 0
                      )}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center 
                  gap-2 flex-shrink-0">
                  <span className={`text-xs 
                    font-bold px-2.5 py-1 
                    rounded-full
                    ${v.isActive
                      ? 'bg-secondary/20 text-secondary'
                      : 'bg-gray-700 text-gray-500'
                    }`}>
                    {v.isActive 
                      ? '✅ Active' 
                      : '⏸️ Inactive'}
                  </span>
                  
                  {/* Delete variant */}
                  <button
                    onClick={() => 
                      deleteVariant(v.vid)}
                    className="p-2 
                      text-gray-600 
                      hover:text-red-400 
                      hover:bg-red-500/10 
                      rounded-lg 
                      transition-colors"
                    title="Supprimer 
                      définitivement">
                    <Trash2 
                      className="w-4 h-4"/>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Warning if few variants */}
      {activeCount === 0 && (
        <div className="bg-red-500/10 
          border border-red-500/30 
          rounded-2xl p-4 
          flex items-center gap-3">
          <AlertCircle className="w-5 h-5 
            text-red-400 flex-shrink-0"/>
          <p className="text-red-300 
            text-sm">
            <strong>Attention!</strong>
            {' '}Aucune variante active. 
            Le produit ne pourra pas 
            être commandé sur le shop.
          </p>
        </div>
      )}

      {/* Bottom save */}
      {hasChanges && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky bottom-4 
            flex justify-center">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center 
              gap-3 bg-primary 
              hover:bg-primary-dark 
              text-white font-black 
              px-10 py-4 rounded-2xl 
              text-base transition-all 
              shadow-2xl shadow-primary/40 
              disabled:opacity-50">
            {saving ? (
              <div className="w-5 h-5 
                border-2 border-white/30 
                border-t-white rounded-full 
                animate-spin"/>
            ) : (
              <Save className="w-5 h-5"/>
            )}
            Sauvegarder — {activeCount} 
            variante(s) active(s)
          </button>
        </motion.div>
      )}
    </div>
  )
}

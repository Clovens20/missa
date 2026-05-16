'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Package, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatPrice, getSafeImageUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

function BundleCard({ bundle }: { bundle: any }) {
  const { addItem } = useCart()

  async function handleAddBundle() {
    if (!bundle.products) return
    
    for (const p of bundle.products) {
      addItem({
        id: p.product_id,
        name: p.name,
        price: p.price,
        images: [{ url: p.image, alt: p.name, is_primary: true }],
        slug: p.slug,
      } as any, p.qty || 1)
    }
    
    toast.success(`🎁 ${bundle.name} ajouté au panier!`)
    try {
      await supabase.from('bundles').update({ sold_count: (bundle.sold_count || 0) + 1 }).eq('id', bundle.id)
    } catch(e) {}
  }

  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl border-2 border-primary/20 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        <div className="grid grid-cols-3 gap-1 h-full p-2">
          {bundle.products?.slice(0, 3).map((p: any, i: number) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-gray-200">
              {p.image ? (
                <Image src={getSafeImageUrl(p.image)} alt={p.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
          ))}
        </div>
        <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-sm px-3 py-1 rounded-full shadow-lg">
          -{bundle.discount_value}{bundle.discount_type === 'percentage' ? '%' : '$'}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
          <Package className="w-3 h-3"/> BUNDLE
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-black text-gray-900 text-base mb-1 truncate">{bundle.name}</h3>
        <p className="text-gray-500 text-xs mb-3 line-clamp-1">{bundle.products?.map((p: any) => p.name).join(' + ')}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-black text-primary">{formatPrice(bundle.bundle_price)}</span>
          <span className="text-sm text-gray-400 line-through">{formatPrice(bundle.original_price)}</span>
        </div>
        <div className="bg-secondary/10 rounded-xl p-2 text-center text-secondary font-bold text-xs mb-4">
          💰 Économisez {formatPrice(bundle.savings)}!
        </div>
        <button onClick={handleAddBundle} className="w-full bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm active:scale-95">
          <Package className="w-4 h-4"/> Ajouter le pack <ArrowRight className="w-4 h-4"/>
        </button>
      </div>
    </motion.div>
  )
}

export default BundleCard

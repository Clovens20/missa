'use client'
import { Truck, Tag, RotateCcw, Zap } from 'lucide-react'

const promos = [
  { icon: Truck, text: '🚚 Livraison GRATUITE dès 50$' },
  { icon: Tag, text: '🏷️ Jusqu\'à -60% sur les promos' },
  { icon: RotateCcw, text: '↩️ Retours gratuits 30 jours' },
  { icon: Zap, text: '⚡ Nouveaux produits chaque semaine' },
]

export default function PromoBar() {
  return (
    <div className="bg-secondary py-2.5 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none"/>
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none"/>

      <div className="flex animate-scroll whitespace-nowrap">
        {[...promos, ...promos, ...promos].map((promo, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-white font-semibold text-sm px-8">
            {promo.text}
            <span className="text-white/30 ml-4">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

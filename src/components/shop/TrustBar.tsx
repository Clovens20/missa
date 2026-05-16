'use client'
import { Shield, Truck, RotateCcw, Star, CreditCard, Headphones } from 'lucide-react'

const items = [
  { icon: Shield, label: 'Paiement Sécurisé' },
  { icon: Truck, label: 'Livraison Express' },
  { icon: RotateCcw, label: 'Retours 30j' },
  { icon: Star, label: '4.8/5 ⭐ (3000+ avis)' },
  { icon: CreditCard, label: 'Visa · MC · PayPal' },
  { icon: Headphones, label: 'Support 24/7' },
]

export default function TrustBar() {
  return (
    <section className="bg-gray-50 border-b border-gray-100 py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0 px-2">
              <item.icon className="w-4 h-4 text-primary flex-shrink-0"/>
              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{item.label}</span>
              {i < items.length - 1 && <span className="text-gray-300 ml-2 text-lg">·</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

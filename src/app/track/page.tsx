'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Package, Truck,
  CheckCircle, Clock, MapPin,
  ArrowRight, AlertCircle,
  RefreshCw, ShoppingBag,
  Home, Phone
} from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export default function TrackPage() {
  const [query, setQuery] = useState('')
  const [trackingInput, setTrackingInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')

  async function trackOrder() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/track?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()

      if (data.error || !data.order) {
        setError(
          'Commande introuvable. ' +
          'Vérifiez votre numéro ou email.'
        )
      } else {
        setOrder(data.order)
      }
    } catch {
      setError(
        'Erreur de connexion. ' +
        'Réessayez plus tard.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Order status steps
  const STATUS_STEPS = [
    { 
      key: 'confirmed', 
      label: 'Confirmée',
      desc: 'Commande reçue et confirmée',
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-400',
    },
    { 
      key: 'processing', 
      label: 'En préparation',
      desc: 'Votre commande est préparée',
      icon: Package,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400',
    },
    { 
      key: 'shipped', 
      label: 'Expédiée',
      desc: 'En route vers vous',
      icon: Truck,
      color: 'text-primary',
      bg: 'bg-primary',
    },
    { 
      key: 'delivered', 
      label: 'Livrée',
      desc: 'Commande livrée!',
      icon: CheckCircle,
      color: 'text-secondary',
      bg: 'bg-secondary',
    },
  ]

  function getStepIndex(status: string) {
    const map: Record<string, number> = {
      'pending': 0,
      'confirmed': 0,
      'processing': 1,
      'preparing': 1,
      'shipped': 2,
      'in_transit': 2,
      'out_for_delivery': 2,
      'delivered': 3,
      'completed': 3,
    }
    return map[status?.toLowerCase()] ?? 0
  }

  const currentStep = order ? getStepIndex(order.status) : -1

  return (
    <div className="min-h-screen bg-gray-950">
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white"/>
            </div>
            <span className="font-black text-white text-lg">Missa Shop</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <Home className="w-4 h-4"/>
            Retour au shop
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        
        {/* Title */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Truck className="w-8 h-8 text-primary"/>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Suivre ma commande</h1>
          <p className="text-gray-400">Entrez votre numéro de commande ou email pour voir le statut en temps réel</p>
        </div>

        {/* Search box */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-300">Numéro de commande ou Email</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && trackOrder()}
                placeholder="MS-2025-XXXX ou votre@email.com"
                className="flex-1 px-4 py-3.5 bg-gray-800 border border-gray-700 rounded-2xl text-white text-sm focus:border-primary focus:outline-none placeholder:text-gray-600"
              />
              <button
                onClick={trackOrder}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-3.5 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-primary/25">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5"/>}
                {loading ? '' : 'Suivre'}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-600">💡 Trouvez votre numéro dans l'email de confirmation reçu lors de votre achat.</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"/>
              <div className="flex-1">
                <p className="text-red-400 font-bold text-sm">
                  Commande introuvable. Vérifiez votre numéro ou email.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  💡 Vous avez un numéro de suivi? Suivez directement sur: 17track.net
                </p>
                
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-gray-300 mb-2">
                    📦 Suivre avec le numéro de colis directement:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: YT2412345..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                    />
                    <a
                      href={`https://t.17track.net/en#nums=${trackingInput}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all flex items-center"
                    >
                      Suivre →
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order result */}
        <AnimatePresence>
          {order && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              
              {/* Order header */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Commande</p>
                    <p className="text-white font-black text-xl">{order.order_number}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(order.created_at).toLocaleDateString('fr-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-2xl font-black text-white">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="relative">
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-700 z-0"/>
                  <div 
                    className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all duration-700"
                    style={{ width: currentStep >= 0 ? `${(currentStep / 3) * 100}%` : '0%' }}
                  />
                  
                  <div className="relative z-10 flex justify-between">
                    {STATUS_STEPS.map((step, i) => {
                      const isDone = i <= currentStep
                      const isCurrent = i === currentStep
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                          <motion.div
                            animate={{ scale: isCurrent ? [1, 1.15, 1] : 1 }}
                            transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                              ${isDone ? `${step.bg} border-transparent` : 'bg-gray-800 border-gray-700'}`}>
                            <step.icon className={`w-5 h-5 ${isDone ? 'text-white' : 'text-gray-600'}`} />
                          </motion.div>
                          <div className="text-center">
                            <p className={`text-xs font-bold ${isDone ? 'text-white' : 'text-gray-600'}`}>{step.label}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Tracking number */}
              {order.tracking_number && (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary"/>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Numéro de suivi</p>
                      <p className="text-white font-black font-mono">{order.tracking_number}</p>
                    </div>
                  </div>
                  <a
                    href={`https://t.17track.net/en#nums=${order.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-4 rounded-2xl transition-all shadow-lg shadow-primary/30"
                  >
                    📦 Suivre ma commande →
                  </a>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Vous serez redirigé vers 17track.net — compatible avec tous nos transporteurs
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 space-y-4">
                <h3 className="font-black text-white">Articles commandés</h3>
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                    {item.image ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.name || item.product_name || "Produit"} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-icon');
                          }}
                        />
                        <style dangerouslySetInnerHTML={{__html: `
                          .fallback-icon::after {
                            content: '📦';
                            font-size: 24px;
                          }
                        `}} />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center text-2xl">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm line-clamp-2">{item.name || item.product_name}</p>
                      {(item.size || item.color) && (
                        <p className="text-gray-500 text-xs mt-0.5">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-600">Qté: {item.quantity}</p>
                        <p className="text-primary font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery address */}
              {order.shipping_address && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-400"/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Adresse de livraison</p>
                    <p className="text-white font-semibold text-sm">{order.shipping_address.name || order.customer_name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {[
                        order.shipping_address.address,
                        order.shipping_address.city,
                        order.shipping_address.province,
                        order.shipping_address.country,
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Help */}
              <div className="text-center py-4 border-t border-gray-800">
                <p className="text-gray-500 text-sm mb-3">Un problème avec votre commande?</p>
                <div className="flex gap-3 justify-center">
                  <a href="mailto:contact@www.missashopp.com" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">📧 Email</a>
                  <a href="https://wa.me/15141234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">💬 WhatsApp</a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, getSafeImageUrl } from '@/lib/utils'

// Threshold fallback removed, now using getSetting

export default function CartDrawer() {
  const { 
    items, total, isOpen, 
    toggleCart, removeItem, 
    updateQty, clearCart 
  } = useCart()
  const { getSetting } = useSettings()
  const { currency, rate, formatLocalPrice } = useCurrency()

  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        '/api/checkout/create-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(i => ({
              product_id: i.product.id,
              name: i.product.name,
              price: i.product.price,
              quantity: i.quantity,
              image: i.product.images?.[0]?.url || null,
              variant: i.variant || null,
              is_dropship: i.product.is_dropship || false,
              variant_id: i.variant?.id || null
            })),
            currency,
            rate
          }),
        }
      )

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      window.location.href = data.url

    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const FREE_SHIPPING_THRESHOLD = getSetting('free_shipping_threshold', 100)

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary"/>
                <h2 className="font-bold text-lg">Mon Panier</h2>
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <button onClick={toggleCart}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Free shipping bar */}
            <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
              {remaining > 0 ? (
                <>
                  <p className="text-xs text-orange-700 mb-1.5">
                    🚚 Plus que <strong>{formatLocalPrice(remaining)}</strong> pour la livraison gratuite!
                  </p>
                  <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-secondary font-bold">
                  ✅ Livraison gratuite appliquée!
                </p>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4"/>
                  <p className="text-gray-500 font-medium">Votre panier est vide</p>
                  <button
                    onClick={toggleCart}
                    className="mt-4 text-primary font-semibold hover:underline">
                    Continuer mes achats →
                  </button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100 group">
                      <Link href={`/product/${item.product.slug}`} onClick={toggleCart}>
                        <Image
                          src={getSafeImageUrl(item.product.images)}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product.slug}`} onClick={toggleCart} className="font-semibold text-sm text-gray-800 line-clamp-2 mb-1 hover:text-primary transition-colors">
                        {item.product.name}
                      </Link>
                      <p className="text-primary font-bold text-sm">{formatLocalPrice(item.product.price)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors">
                            <Minus className="w-3 h-3"/>
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors">
                            <Plus className="w-3 h-3"/>
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between font-black text-xl">
                  <span>Total</span>
                  <span className="text-primary">{formatLocalPrice(total)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isLoading || items.length === 0}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base active:scale-95 shadow-lg shadow-orange-500/20">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      Redirection...
                    </>
                  ) : (
                    <>
                      🔒 Payer maintenant
                      <span className="text-sm opacity-80">
                        (Stripe)
                      </span>
                    </>
                  )}
                </button>
                <button
                  onClick={toggleCart}
                  className="block w-full text-center text-gray-500 hover:text-primary text-sm font-medium transition-colors">
                  Continuer mes achats
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

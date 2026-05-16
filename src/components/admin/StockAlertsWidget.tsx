'use client'
import { useState, useEffect } 
  from 'react'
import { motion } from 'framer-motion'
import {
  Package, AlertTriangle,
  XCircle, ArrowRight,
  RefreshCw, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function StockAlertsWidget() {
  const [alerts, setAlerts] = 
    useState<any[]>([])
  const [loading, setLoading] = 
    useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  async function loadAlerts() {
    setLoading(true)
    
    // Get low/out of stock products
    const { data } = await supabase
      .from('products')
      .select(`
        id, name, 
        stock_quantity,
        low_stock_threshold,
        images
      `)
      .eq('is_active', true)
      .lte(
        'stock_quantity',
        10
        // Show products with 10 or less
      )
      .order('stock_quantity', 
        { ascending: true })
      .limit(8)

    setAlerts(data || [])
    setLoading(false)
  }

  const outOfStockCount = alerts.filter(
    a => a.stock_quantity <= 0
  ).length

  const lowStockCount = alerts.filter(
    a => a.stock_quantity > 0 && 
    a.stock_quantity <= 
      (a.low_stock_threshold || 5)
  ).length

  if (loading) return (
    <div className="bg-gray-900 
      border border-gray-800 
      rounded-2xl p-5 
      animate-pulse h-48"/>
  )

  if (alerts.length === 0) return (
    <div className="bg-gray-900 
      border border-gray-800 
      rounded-2xl p-5 
      flex items-center gap-3">
      <CheckCircle className="w-8 h-8 
        text-secondary flex-shrink-0"/>
      <div>
        <p className="font-bold text-white">
          Tous les stocks sont OK!
        </p>
        <p className="text-gray-500 text-xs">
          Aucun produit en rupture 
          ou stock bas
        </p>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-900 
      border border-gray-800 
      rounded-2xl overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center 
        justify-between px-5 py-4 
        border-b border-gray-800">
        <h3 className="font-black text-white 
          flex items-center gap-2">
          <Package className="w-5 h-5 
            text-primary"/>
          Alertes Stock
          {(outOfStockCount + 
            lowStockCount) > 0 && (
            <span className="bg-red-500 
              text-white text-[10px] 
              font-black px-2 py-0.5 
              rounded-full">
              {outOfStockCount + 
                lowStockCount}
            </span>
          )}
        </h3>
        <div className="flex gap-3 
          items-center">
          {outOfStockCount > 0 && (
            <span className="text-xs 
              font-bold text-red-400 
              flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5"/>
              {outOfStockCount} rupture(s)
            </span>
          )}
          {lowStockCount > 0 && (
            <span className="text-xs 
              font-bold text-yellow-400 
              flex items-center gap-1">
              <AlertTriangle 
                className="w-3.5 h-3.5"/>
              {lowStockCount} bas
            </span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="divide-y 
        divide-gray-800">
        {alerts.map((product, i) => {
          const isOut = 
            product.stock_quantity <= 0
          const threshold = 
            product.low_stock_threshold || 5
          const isLow = 
            !isOut && 
            product.stock_quantity <= threshold

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center 
                gap-3 px-5 py-3 
                hover:bg-gray-800/50 
                transition-colors">
              
              {/* Product image */}
              <div className="w-10 h-10 
                rounded-xl overflow-hidden 
                bg-gray-800 flex-shrink-0">
                {product.images?.[0]?.url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-full 
                      object-cover"
                  />
                ) : (
                  <div className="w-full 
                    h-full flex items-center 
                    justify-center">
                    <Package 
                      className="w-4 h-4 
                        text-gray-600"/>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white 
                  font-semibold text-sm 
                  truncate">
                  {product.name}
                </p>
                <p className={`text-xs 
                  font-bold
                  ${isOut
                    ? 'text-red-400'
                    : 'text-yellow-400'
                  }`}>
                  {isOut
                    ? '❌ Rupture de stock'
                    : `⚠️ ${product.stock_quantity} restant(s)`
                  }
                </p>
              </div>

              {/* Stock badge */}
              <div className="flex items-center 
                gap-3 flex-shrink-0">
                <div className={`
                  w-10 h-10 rounded-xl 
                  flex items-center 
                  justify-center font-black 
                  text-sm
                  ${isOut
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                  {product.stock_quantity}
                </div>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="p-2 bg-gray-800 
                    hover:bg-gray-700 
                    text-gray-400 
                    hover:text-white 
                    rounded-xl 
                    transition-colors">
                  <ArrowRight 
                    className="w-4 h-4"/>
                </Link>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 
        border-t border-gray-800 
        flex items-center 
        justify-between">
        <button
          onClick={loadAlerts}
          className="text-xs text-gray-500 
            hover:text-white flex items-center 
            gap-1 transition-colors">
          <RefreshCw className="w-3 h-3"/>
          Actualiser
        </button>
        <Link
          href="/admin/inventaire"
          className="text-xs text-primary 
            font-bold hover:underline 
            flex items-center gap-1">
          Voir l'inventaire complet
          <ArrowRight className="w-3 h-3"/>
        </Link>
      </div>
    </div>
  )
}

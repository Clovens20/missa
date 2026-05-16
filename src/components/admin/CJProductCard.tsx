'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Star, TrendingUp,
  Eye, Award, Zap, Loader
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import SupplierInfoCard from 
  './SupplierInfoCard'

interface CJProductCardProps {
  product: any
  onImport: (product: any) => void
  importing: boolean
  viewMode?: 'grid' | 'list'
}

export default function CJProductCard({
  product,
  onImport,
  importing,
  viewMode = 'grid',
}: CJProductCardProps) {
  const [showSupplier, setShowSupplier] = 
    useState(false)

  const pid = product.pid || 
    product.productId
  const price = parseFloat(
    product.sellPrice || 
    product.productPrice || 0
  )
  const suggestedPrice = 
    Math.ceil(price * 2.5 * 2) / 2
  const profit = suggestedPrice - price
  const supplier = product.supplierInfo

  const mainImage = 
    product.productImageSet?.[0] || 
    product.productImage

  // ── LIST VIEW ──
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gray-900 border 
          border-gray-700 rounded-2xl 
          overflow-hidden 
          hover:border-gray-600 
          transition-all">
        
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="w-24 h-24 
            rounded-xl overflow-hidden 
            bg-gray-800 flex-shrink-0">
            {mainImage && (
              <img
                src={mainImage}
                alt={product.productNameEn}
                className="w-full h-full 
                  object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white 
              font-semibold text-sm 
              line-clamp-2 mb-2">
              {product.productNameEn || 
                product.productName}
            </p>
            
            <div className="flex items-center 
              gap-3 mb-2">
              <span className="text-primary 
                font-black">
                CJ: {formatPrice(price)}
              </span>
              <span className="text-gray-500 
                text-xs">→</span>
              <span className="text-secondary 
                font-bold text-sm">
                Vendre: ~{formatPrice(
                  suggestedPrice
                )}
              </span>
              <span className="text-xs 
                bg-secondary/20 
                text-secondary 
                px-2 py-0.5 rounded-full 
                font-bold">
                +{formatPrice(profit)}
              </span>
            </div>

            {/* Supplier inline */}
            {supplier && (
              <div className="flex items-center 
                gap-3 text-xs text-gray-500">
                <span className="flex 
                  items-center gap-1">
                  <Star className="w-3 h-3 
                    text-amber-400 
                    fill-amber-400"/>
                  {parseFloat(
                    supplier.productScore
                      ?.toString() || '0'
                  ).toFixed(1)}
                </span>
                <span className="flex 
                  items-center gap-1">
                  <TrendingUp 
                    className="w-3 h-3"/>
                  {supplier.productSales || 0}
                  {' '}vendus
                </span>
                {supplier.shippingFromUS && (
                  <span className="flex 
                    items-center gap-1 
                    text-blue-400">
                    <Zap className="w-3 h-3"/>
                    USA stock
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col 
            gap-2 flex-shrink-0">
            <button
              onClick={() => onImport(product)}
              disabled={importing}
              className="flex items-center 
                gap-1.5 bg-primary 
                hover:bg-primary-dark 
                text-white font-bold 
                px-4 py-2 rounded-xl 
                text-sm transition-all 
                disabled:opacity-50">
              {importing 
                ? <Loader 
                    className="w-3.5 h-3.5 
                      animate-spin"/> 
                : <Plus 
                    className="w-3.5 h-3.5"/>}
              Importer
            </button>
            <button
              onClick={() => 
                setShowSupplier(!showSupplier)}
              className="flex items-center 
                gap-1.5 bg-gray-800 
                hover:bg-gray-700 
                text-gray-400 
                hover:text-white 
                font-semibold px-3 py-1.5 
                rounded-xl text-xs 
                transition-colors">
              <Eye className="w-3.5 h-3.5"/>
              Fournisseur
            </button>
          </div>
        </div>

        {/* Supplier details expandable */}
        {showSupplier && supplier && (
          <div className="px-4 pb-4 
            border-t border-gray-800 pt-3">
            <SupplierInfoCard
              supplier={supplier}
              productPrice={price}
              defaultExpanded={true}
            />
          </div>
        )}
      </motion.div>
    )
  }

  // ── GRID VIEW (default) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border 
        border-gray-700 rounded-2xl 
        overflow-hidden 
        hover:border-primary/40 
        hover:shadow-lg 
        hover:shadow-primary/5 
        transition-all group 
        flex flex-col">
      
      {/* Image */}
      <div className="relative 
        aspect-square bg-gray-800 
        overflow-hidden">
        {mainImage && (
          <img
            src={mainImage}
            alt={product.productNameEn || 
              product.productName}
            className="w-full h-full 
              object-cover 
              group-hover:scale-105 
              transition-transform 
              duration-300"
          />
        )}
        
        {/* Top badges */}
        <div className="absolute top-2 
          left-2 flex flex-col gap-1">
          <span className="bg-blue-600 
            text-white text-[9px] 
            font-black px-1.5 py-0.5 
            rounded-md">
            CJ
          </span>
          {supplier?.shippingFromUS && (
            <span className="bg-green-600 
              text-white text-[9px] 
              font-black px-1.5 py-0.5 
              rounded-md flex items-center 
              gap-0.5">
              <Zap className="w-2.5 h-2.5"/>
              USA
            </span>
          )}
        </div>

        {/* Supplier score badge */}
        {supplier && (
          <div className="absolute 
            bottom-2 right-2 
            bg-black/70 backdrop-blur-sm 
            rounded-lg px-2 py-1 
            flex items-center gap-1">
            <Star className="w-3 h-3 
              text-amber-400 fill-amber-400"/>
            <span className="text-white 
              text-[10px] font-bold">
              {parseFloat(
                supplier.productScore
                  ?.toString() || '0'
              ).toFixed(1)}
            </span>
          </div>
        )}

        {/* Sales badge */}
        {supplier && 
          supplier.productSales > 0 && (
          <div className="absolute 
            bottom-2 left-2 
            bg-black/70 backdrop-blur-sm 
            rounded-lg px-2 py-1 
            flex items-center gap-1">
            <TrendingUp className="w-3 h-3 
              text-secondary"/>
            <span className="text-white 
              text-[10px] font-bold">
              {supplier.productSales >= 1000 
                ? `${(
                    supplier.productSales / 1000
                  ).toFixed(1)}k` 
                : supplier.productSales}
              {' '}vendus
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col 
        flex-1 space-y-2">
        
        {/* Name */}
        <p className="text-white font-semibold 
          text-xs line-clamp-2 leading-snug 
          min-h-[2.5rem]">
          {product.productNameEn || 
            product.productName}
        </p>

        {/* Pricing */}
        <div className="flex items-center 
          justify-between">
          <div>
            <p className="text-[10px] 
              text-gray-500">Coût CJ:</p>
            <p className="text-primary 
              font-black text-sm">
              {formatPrice(price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] 
              text-gray-500">Vendre ~</p>
            <p className="text-secondary 
              font-black text-sm">
              {formatPrice(suggestedPrice)}
            </p>
          </div>
        </div>

        {/* Profit bar */}
        <div className="bg-gray-800 
          rounded-lg px-2.5 py-1.5 
          flex items-center 
          justify-between">
          <span className="text-[10px] 
            text-gray-500">
            Profit estimé:
          </span>
          <span className="text-secondary 
            font-black text-xs">
            +{formatPrice(profit)}
          </span>
        </div>

        {/* Supplier preview */}
        {supplier && (
          <SupplierInfoCard
            supplier={supplier}
            productPrice={price}
            defaultExpanded={false}
            className="mt-auto"
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={() => onImport(product)}
            disabled={importing}
            className="flex-1 flex items-center 
              justify-center gap-1.5 
              bg-primary hover:bg-primary-dark 
              text-white font-black py-2 
              rounded-xl text-xs 
              transition-all 
              disabled:opacity-50 
              active:scale-95">
            {importing ? (
              <Loader className="w-3.5 h-3.5 
                animate-spin"/>
            ) : (
              <Plus className="w-3.5 h-3.5"/>
            )}
            {importing 
              ? 'Import...' 
              : 'Importer'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

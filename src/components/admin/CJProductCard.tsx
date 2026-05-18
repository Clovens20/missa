'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Star, TrendingUp,
  Eye, Award, Zap, Loader, Package,
  X, ChevronLeft, ChevronRight, Video
} from 'lucide-react'
import { formatPrice, getSafeImageUrl } from '@/lib/utils'
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
  const [showGallery, setShowGallery] = useState(false)
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  async function openGallery(e: React.MouseEvent) {
    e.stopPropagation()
    setShowGallery(true)
    setLoadingGallery(true)
    try {
      const res = await fetch(`/api/cj/media?pid=${pid}`)
      const data = await res.json()
      
      const items = []
      if (data.video) {
        items.push({ url: data.video, isVideo: true })
      }
      
      if (data.images && data.images.length > 0) {
        items.push(...data.images.map((img: any) => ({ ...img, isVideo: false })))
      } else {
        items.push({ url: mainImage, isVideo: false })
      }
      
      setGalleryImages(items)
      setActiveImageIndex(0)
    } catch (err) {
      setGalleryImages([{ url: mainImage, isVideo: false }])
    } finally {
      setLoadingGallery(false)
    }
  }

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
  const status = product.productStatus || ''
  const isEprolo = product.supplier === 'eprolo'
  const supplierName = isEprolo ? 'Eprolo' : 'CJ'

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ONSALE':
        return {
          label: '✅ Disponible',
          class: 'bg-green-500/20 text-green-400'
        }
      case 'REMOVED':
        return {
          label: '❌ Retiré',
          class: 'bg-red-500/20 text-red-400'
        }
      case 'SOLDOUT':
        return {
          label: '⚠️ Épuisé',
          class: 'bg-orange-500/20 text-orange-400'
        }
      default:
        return {
          label: '✅ Disponible',
          class: 'bg-green-500/20 text-green-400'
        }
    }
  }

  const badge = getStatusBadge(status)

  const mainImage = 
    product.productImage || 
    product.image ||
    product.productImageEn ||
    product.imageURL ||
    product.productImageSet?.[0]

  const displayStock = product.total_stock || parseInt(product.productStock || '0')
  const hasStockInfo = displayStock > 0 || product.in_stock === true

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
          <div 
            onClick={openGallery}
            className="w-24 h-24 
              rounded-xl overflow-hidden 
              bg-gray-800 flex-shrink-0
              cursor-zoom-in relative group/img"
            title="Aperçu des photos">
            {mainImage && (
              <img
                src={getSafeImageUrl(mainImage)}
                alt={product.productNameEn}
                className="w-full h-full 
                  object-cover group-hover/img:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <Eye className="w-5 h-5 text-white drop-shadow" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white 
              font-semibold text-sm 
              line-clamp-2 mb-2">
              {product.productNameEn || 
                product.productName}
            </p>

            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${badge.class}`}>
              {badge.label}
            </div>
            
            <div className="flex items-center 
              gap-3 mb-2">
              <span className="text-primary 
                font-black">
                {supplierName}: {formatPrice(price)}
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
      <div 
        onClick={openGallery}
        className="relative 
          aspect-square bg-gray-800 
          overflow-hidden cursor-zoom-in group/img"
        title="Aperçu des photos">
        {mainImage && (
          <img
            src={getSafeImageUrl(mainImage)}
            alt={product.productNameEn || 
              product.productName}
            className="w-full h-full 
              object-cover 
              group-hover:scale-105 
              transition-transform 
              duration-300"
          />
        )}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="bg-gray-950/90 backdrop-blur-md border border-gray-850 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-white font-extrabold text-[11px] shadow-2xl scale-90 group-hover/img:scale-100 transition-transform duration-200">
            <Eye className="w-4 h-4 text-primary" />
            Voir les photos
          </div>
        </div>
        
        {/* Top badges */}
        <div className="absolute top-2 
          left-2 flex flex-col gap-1">
          <span className={`text-white text-[9px] font-black px-1.5 py-0.5 rounded-md ${isEprolo ? 'bg-green-600' : 'bg-blue-600'}`}>
            {supplierName}
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

        {/* Stock badge */}
        <div className={`
          absolute top-2 left-10 z-10
          flex items-center gap-1
          text-[10px] font-black
          px-2 py-1 rounded-full shadow-lg
          ${hasStockInfo
            ? 'bg-emerald-500/90 text-white'
            : 'bg-blue-500/90 text-white'
          }`}>
          <Package className="w-3 h-3"/>
          {displayStock > 0 
            ? (displayStock > 100 ? '100+ en stock' : `${displayStock} en stock`)
            : 'Disponible'
          }
        </div>

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

        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.class}`}>
          {badge.label}
        </div>

        {/* Pricing */}
        <div className="flex items-center 
          justify-between">
          <div>
            <p className="text-[10px] 
              text-gray-500">Coût {supplierName}:</p>
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

      {/* ── HIGH-FIDELITY PRODUCT MEDIA LIGHTBOX MODAL ── */}
      {showGallery && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGallery(false)
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          {/* Close button */}
          <button 
            onClick={() => setShowGallery(false)}
            className="absolute top-6 right-6 p-3 bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-all border border-gray-850 z-[70] hover:scale-105"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-stretch h-[80vh] bg-gray-950/40 border border-gray-850 rounded-3xl p-6 overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Left Column: Media display */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-950/60 rounded-2xl border border-gray-900 overflow-hidden min-h-[40vh] lg:min-h-0">
              {loadingGallery ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-gray-400 text-xs font-semibold">Chargement de la galerie haute résolution...</p>
                </div>
              ) : (
                <>
                  {/* Main view */}
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {galleryImages[activeImageIndex]?.url ? (
                      galleryImages[activeImageIndex].isVideo ? (
                        <video 
                          key={activeImageIndex}
                          src={galleryImages[activeImageIndex].url}
                          controls
                          autoPlay
                          className="max-w-full max-h-[50vh] lg:max-h-[60vh] rounded-xl shadow-2xl bg-black"
                        />
                      ) : (
                        <motion.img 
                          key={activeImageIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={getSafeImageUrl(galleryImages[activeImageIndex].url)} 
                          alt={product.productNameEn} 
                          className="max-w-full max-h-[50vh] lg:max-h-[60vh] object-contain rounded-xl shadow-2xl"
                        />
                      )
                    ) : (
                      <p className="text-gray-500">Aucune image disponible</p>
                    )}
                  </div>

                  {/* Navigation arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImageIndex(prev => prev === 0 ? galleryImages.length - 1 : prev - 1)
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full transition-all border border-gray-800 hover:scale-105"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImageIndex(prev => prev === galleryImages.length - 1 ? 0 : prev + 1)
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full transition-all border border-gray-800 hover:scale-105"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Media Count Badge */}
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-gray-800 rounded-xl text-white text-xs font-bold">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Product details + Thumbnails list + Quick Import */}
            <div className="w-full lg:w-96 flex flex-col gap-5 overflow-y-auto pr-1">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  Aperçu {isEprolo ? 'Eprolo' : 'CJDropshipping'}
                </span>
                <h3 className="text-white font-black text-lg mt-3 line-clamp-3 leading-snug">
                  {product.productNameEn || product.productName}
                </h3>
                <p className="text-gray-500 text-xs mt-1.5 font-mono">ID {supplierName}: {pid}</p>
              </div>

              {/* Pricing Info */}
              <div className="bg-gray-900/60 border border-gray-850 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Prix CJ :</span>
                  <span className="text-white font-black text-base">{formatPrice(price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">Prix de vente suggéré :</span>
                  <span className="text-secondary font-black text-base">{formatPrice(suggestedPrice)}</span>
                </div>
                <div className="h-px bg-gray-800" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-semibold">Marge bénéficiaire :</span>
                  <span className="text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg font-black text-sm">
                    +{formatPrice(profit)}
                  </span>
                </div>
              </div>

              {/* Thumbnails grid */}
              {!loadingGallery && galleryImages.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-gray-400">Galerie de photos ({galleryImages.length}) :</p>
                  <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative ${
                          activeImageIndex === i 
                            ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-gray-900 scale-95' 
                            : 'border-gray-800 hover:border-gray-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={getSafeImageUrl(img.isVideo ? mainImage : img.url)} alt="" className="w-full h-full object-cover" />
                        {img.isVideo && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Video className="w-3.5 h-3.5 text-white" />
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Action */}
              <div className="mt-auto pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowGallery(false)
                    onImport(product)
                  }}
                  disabled={importing}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-2xl text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {importing ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Importer sur Missa Shop
                </button>
                
                <button
                  onClick={() => setShowGallery(false)}
                  className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-300 py-2 transition-colors"
                >
                  Fermer l'aperçu
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </motion.div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Heart, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import { getColorHex } from '@/lib/colors'

interface Variant {
  id: string
  name: string
  color?: string
  colorHex?: string
  size?: string
  price: number
  stock: number
  image?: string
}

interface ProductQuickViewProps {
  product: {
    id: string
    name: string
    price: number
    images: { url: string }[] | string[]
    description?: string
    variants?: any[]
  } | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productId: string, variantId: string, quantity: number) => void
}

// Component starts...
export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductQuickViewProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedImage(0)
      setSelectedColor(null)
      setSelectedSize(null)
      setQuantity(1)
      setAddedToCart(false)
    }
  }, [product?.id])

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!product) return null

  // Normalization for images
  const rawImages = product.images || []
  const images = rawImages.map(img => typeof img === 'string' ? img : img.url)

  // Normalization for variants
  const rawVariants = product.variants || []
  const normalizedVariants: Variant[] = rawVariants.map((v: any) => ({
    id: v.id || v.vid || Math.random().toString(),
    name: v.name || v.sku || '',
    color: v.color || v.properties?.find((p: any) => p.name?.toLowerCase().includes('color'))?.value || null,
    size: v.size || v.properties?.find((p: any) => p.name?.toLowerCase().includes('size'))?.value || null,
    price: v.price || v.cjPrice || product.price,
    stock: v.stock || 0,
    image: v.image || v.variantImage || null
  }))

  // Extract unique colors and sizes
  const colors = normalizedVariants.length > 0
    ? Array.from(new Map(normalizedVariants.filter(v => v.color).map(v => [v.color, v])).values())
    : []

  const sizes = normalizedVariants.length > 0
    ? Array.from(new Set(normalizedVariants.filter(v => v.size && (!selectedColor || v.color === selectedColor)).map(v => v.size)))
    : []

  // Get selected variant
  const selectedVariant = normalizedVariants.find(v =>
    (!selectedColor || v.color === selectedColor) &&
    (!selectedSize || v.size === selectedSize)
  )

  // Current price
  const currentPrice = selectedVariant?.price || product.price

  // Handle add to cart
  const handleAddToCart = () => {
    if (normalizedVariants.length > 0 && !selectedVariant) return
    
    const variantId = selectedVariant?.id || 'default'
    onAddToCart(product.id, variantId, quantity)
    
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Image navigation
  const prevImage = () => setSelectedImage(i => i > 0 ? i - 1 : images.length - 1)
  const nextImage = () => setSelectedImage(i => i < images.length - 1 ? i + 1 : 0)

  const canAddToCart = normalizedVariants.length === 0 || 
    ((!colors.length || selectedColor) && (!sizes.length || selectedSize))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-all backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* LEFT — Images */}
                <div className="relative bg-[#1a1a1a] p-4">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                    {images[selectedImage] && (
                      <Image
                        src={images[selectedImage]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    )}

                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full p-1.5 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full p-1.5 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Wishlist btn */}
                    <button
                      onClick={() => setIsWishlisted(w => !w)}
                      className="absolute top-3 right-3 bg-black/60 rounded-full p-2 transition-all hover:scale-110"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary scale-105' : 'border-white/10 hover:border-white/30'}`}
                        >
                          <Image src={img} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT — Details */}
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <h2 className="text-white font-black text-xl leading-tight mb-1">{product.name}</h2>
                    <p className="text-3xl font-black text-primary">
                      {formatPrice(currentPrice)}
                      <span className="text-sm font-normal text-gray-500 ml-1">HT</span>
                    </p>
                  </div>

                  {/* Color selector */}
                  {colors.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Couleur {selectedColor && <span className="text-white ml-2 normal-case font-normal">— {selectedColor}</span>}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {colors.map(v => (
                          <div key={v.color} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedColor(c => c === v.color ? null : v.color!)
                                setSelectedSize(null)
                                if (v.image) {
                                  const idx = images.indexOf(v.image)
                                  if (idx !== -1) setSelectedImage(idx)
                                }
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === v.color ? 'border-primary scale-110' : 'border-white/20'}`}
                              style={{
                                background: 
                                  v.colorHex || 
                                  getColorHex(v.color || '') ||
                                  '#888',
                                border: v.color?.toLowerCase()
                                  .includes('blanc') || 
                                  v.color?.toLowerCase()
                                  .includes('white') || 
                                  v.color?.toLowerCase()
                                  .includes('creme') ||
                                  v.color?.toLowerCase()
                                  .includes('ivoire')
                                    ? '2px solid #d4d4d4' 
                                    : undefined
                              }}
                            />
                            <span className="text-[9px] text-gray-500 text-center max-w-[40px] leading-tight truncate">
                              {v.color}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size selector */}
                  {sizes.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Taille</p>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(s => s === size ? null : size!)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all hover:scale-105 ${selectedSize === size ? 'bg-primary border-primary text-white' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/50'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Quantité</p>
                    <div className="flex items-center gap-3 w-fit">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center">−</button>
                      <span className="text-white font-black text-lg w-8 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center">+</button>
                    </div>
                  </div>

                  {/* Add to cart button */}
                  <div className="mt-auto space-y-3 pt-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={!canAddToCart}
                      className={`w-full py-4 rounded-2xl font-black text-base transition-all duration-300 flex items-center justify-center gap-2 ${addedToCart ? 'bg-secondary text-white scale-95' : canAddToCart ? 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] active:scale-95' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {addedToCart ? '✅ Ajouté au panier!' : !canAddToCart ? 'Choisir les options' : 'Ajouter au panier'}
                    </button>

                    {!canAddToCart && (
                      <p className="text-center text-xs text-gray-500">
                        {!selectedColor && colors.length > 0 ? '👆 Choisir une couleur' : '👆 Choisir une taille'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

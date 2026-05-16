'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShoppingCart, Plus,
  Minus, Check, ChevronRight,
  AlertCircle, Heart,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const COLOR_HEX: Record<string, string> = {
  'Rouge': '#EF4444', 'Red': '#EF4444',
  'Bleu': '#3B82F6', 'Blue': '#3B82F6',
  'Vert': '#22C55E', 'Green': '#22C55E',
  'Noir': '#1a1a1a', 'Black': '#1a1a1a',
  'Blanc': '#f0f0f0', 'White': '#f0f0f0',
  'Rose': '#EC4899', 'Pink': '#EC4899',
  'Jaune': '#EAB308', 'Yellow': '#EAB308',
  'Violet': '#A855F7', 'Purple': '#A855F7',
  'Orange': '#F97316',
  'Gris': '#6B7280', 'Gray': '#6B7280',
  'Beige': '#D2B48C',
  'Marine': '#1E3A5F',
  'Bordeaux': '#800020',
  'Marron': '#92400E',
  'Turquoise': '#06B6D4',
  'Corail': '#FF6B6B',
}

interface VariantPickerProps {
  product: any
  isOpen: boolean
  onClose: () => void
  onAddToCart: (selection: {
    color?: string
    size?: string
    quantity: number
    productId: string
    productName: string
    price: number
    image?: string
  }) => void
}

export default function VariantPicker({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: VariantPickerProps) {

  const colors: string[] =
    product?.colors ||
    product?.available_colors ||
    product?.variants
      ?.filter((v: any) => v.type === 'color' || v.color)
      .map((v: any) => v.color || v.value) ||
    []

  const sizes: string[] =
    product?.sizes ||
    product?.available_sizes ||
    product?.variants
      ?.filter((v: any) => v.type === 'size' || v.size)
      .map((v: any) => v.size || v.value) ||
    []

  // Deduplicate
  const uniqueColors = [...new Set(colors)]
  const uniqueSizes = [...new Set(sizes)]

  const variantImages: Record<
    string, any[]
  > = product?.variant_images || {}

  const [selectedColor, setSelectedColor] =
    useState<string>(uniqueColors[0] || '')
  const [selectedSize, setSelectedSize] =
    useState<string>(uniqueSizes[0] || '')
  const [quantity, setQuantity] =
    useState(1)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  // Find current variant
  const currentVariant = (product?.variants || []).find((v: any) => {
    const colorMatch = (v.color || '') === (selectedColor || '')
    const sizeMatch = (v.size || '') === (selectedSize || '')
    return colorMatch && sizeMatch
  })

  const isOutOfStock = currentVariant ? currentVariant.stock <= 0 : false
  const maxStock = currentVariant ? currentVariant.stock : (product?.stock_quantity || 99)

  // Helper for size status
  function getSizeStatus(size: string, color: string) {
    const v = (product?.variants || []).find((v: any) =>
      (v.color || '') === (color || '') &&
      (v.size || '') === (size || '')
    )
    if (!v) return 'not-exists'
    return v.stock > 0 ? 'in-stock' : 'out-of-stock'
  }

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(uniqueColors[0] || '')
      setSelectedSize(uniqueSizes[0] || '')
      setQuantity(1)
      setError('')
      setAdded(false)
    }
  }, [isOpen])

  // Clear error when selection made
  useEffect(() => {
    if (error) setError('')
  }, [selectedColor, selectedSize])

  // Current image based on color
  const currentImage = (() => {
    if (
      selectedColor &&
      variantImages[selectedColor]?.length > 0
    ) {
      const img = variantImages[selectedColor][0]
      return typeof img === 'string'
        ? img : img?.url
    }
    const imgs = product?.images || []
    const first = imgs[0]
    return typeof first === 'string'
      ? first : first?.url
  })()

  function handleAddToCart() {
    if (isOutOfStock) {
      setError('Cette variante est en rupture de stock')
      return
    }

    if (quantity > maxStock) {
      setError(`Seulement ${maxStock} articles disponibles`)
      return
    }

    onAddToCart({
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      quantity,
      productId: product.id,
      productName: product.name,
      price: product.price,
      image: currentImage,
    })

    // Show success state
    setAdded(true)
    setTimeout(() => {
      onClose()
      setAdded(false)
    }, 1200)
  }

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
            className="fixed inset-0
              bg-black/50 z-[100]
              backdrop-blur-sm"
          />

          {/* Drawer — slides from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0
              left-0 right-0 z-[101]
              bg-white rounded-t-3xl
              shadow-2xl
              max-h-[90vh]
              overflow-y-auto
              md:left-auto md:right-4
              md:bottom-4 md:w-96
              md:rounded-3xl
              md:max-h-[85vh]">

            {/* Handle bar (mobile) */}
            <div className="flex justify-center
              pt-3 pb-1 md:hidden">
              <div className="w-10 h-1
                bg-gray-200 rounded-full"/>
            </div>

            {/* Header */}
            <div className="flex items-center
              justify-between
              px-5 py-4
              border-b border-gray-100">
              <h3 className="font-black
                text-gray-900 text-base">
                Choisir les options
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8
                  bg-gray-100
                  hover:bg-gray-200
                  rounded-full flex items-center
                  justify-center
                  transition-colors">
                <X className="w-4 h-4
                  text-gray-500"/>
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Product preview */}
              <div className="flex items-center
                gap-4 bg-gray-50
                rounded-2xl p-3">
                {currentImage && (
                  <div className="w-20 h-20
                    rounded-xl overflow-hidden
                    bg-gray-100 flex-shrink-0
                    border border-gray-200">
                    <motion.img
                      key={currentImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={currentImage}
                      alt={product?.name}
                      className="w-full h-full
                        object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold
                    text-gray-900 text-sm
                    line-clamp-2 leading-snug">
                    {product?.name}
                  </p>
                  <div className="flex items-center
                    gap-2 mt-1.5">
                    <span className="text-xl
                      font-black text-primary">
                      {formatPrice(product?.price)}
                    </span>
                    {product?.compare_price >
                      product?.price && (
                      <span className="text-sm
                        text-gray-400
                        line-through">
                        {formatPrice(
                          product?.compare_price
                        )}
                      </span>
                    )}
                  </div>
                    {selectedColor && (
                      <p className="text-xs
                        text-gray-500 mt-1">
                        {selectedColor}
                        {selectedSize &&
                          ` · Taille ${selectedSize}`
                        }
                      </p>
                    )}
                    {selectedColor && selectedSize && (
                      <div className="mt-1.5">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">
                            Rupture de stock
                          </span>
                        ) : currentVariant ? (
                          <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">
                            {currentVariant.stock} en stock
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

              {/* ── COLOR PICKER ── */}
              {uniqueColors.length > 0 && (
                <div>
                  <div className="flex items-center
                    justify-between mb-3">
                    <p className="text-sm
                      font-black text-gray-900">
                      Couleur
                      {selectedColor && (
                        <span className="text-primary
                          ml-2 font-black">
                          {selectedColor}
                        </span>
                      )}
                    </p>
                    {!selectedColor && (
                      <span className="text-[10px]
                        text-orange-500 font-bold
                        bg-orange-50 px-2 py-1
                        rounded-full">
                        Requis
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap
                    gap-2.5">
                    {uniqueColors.map(color => {
                      const hex =
                        COLOR_HEX[color] || '#ccc'
                      const isSelected =
                        selectedColor === color
                      const isLight = [
                        'Blanc', 'White',
                        'Beige', 'Jaune', 'Yellow',
                      ].includes(color)
                      const hasImg =
                        (variantImages[color]
                          ?.length || 0) > 0

                      return (
                        <motion.button
                          key={color}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            setSelectedColor(color)}
                          className={`
                            relative flex flex-col
                            items-center gap-1.5`}>

                          {/* Color circle */}
                          <div
                            className={`
                              w-11 h-11
                              rounded-full
                              border-2 transition-all
                              flex items-center
                              justify-center
                              shadow-sm
                              ${isSelected
                                ? 'border-gray-900 scale-110 shadow-md ring-2 ring-gray-900 ring-offset-2'
                                : isLight
                                  ? 'border-gray-300 hover:border-gray-500'
                                  : 'border-transparent hover:border-gray-400'
                              }`}
                            style={{
                              background: hex
                            }}>
                            {isSelected && (
                              <Check
                                className={`w-5 h-5
                                  font-black
                                  ${isLight
                                    ? 'text-gray-800'
                                    : 'text-white'
                                  }`}
                              />
                            )}
                          </div>

                          {/* Label */}
                          <span className={`
                            text-[10px] font-bold
                            ${isSelected
                              ? 'text-gray-900'
                              : 'text-gray-500'
                            }`}>
                            {color}
                          </span>

                          {/* Has photos dot */}
                          {hasImg && (
                            <div className="absolute
                              top-0 right-0
                              w-2.5 h-2.5
                              bg-primary
                              rounded-full
                              border border-white"/>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── SIZE PICKER ── */}
              {uniqueSizes.length > 0 && (
                <div>
                  <div className="flex items-center
                    justify-between mb-3">
                    <p className="text-sm
                      font-black text-gray-900">
                      Taille
                      {selectedSize && (
                        <span className="text-primary
                          ml-2">
                          {selectedSize}
                        </span>
                      )}
                    </p>
                    <div className="flex
                      items-center gap-3">
                      {!selectedSize && (
                        <span className="text-[10px]
                          text-orange-500 font-bold
                          bg-orange-50 px-2 py-1
                          rounded-full">
                          Requis
                        </span>
                      )}
                      <button
                        className="text-[10px]
                          text-primary font-bold
                          hover:underline">
                        Guide tailles →
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap
                    gap-2">
                    {uniqueSizes.map(size => {
                      const isSelected =
                        selectedSize === size
                      const status = getSizeStatus(size, selectedColor)
                      const isDisabled = status === 'not-exists'
                      const isLowStock = status === 'out-of-stock'

                      return (
                        <motion.button
                          key={size}
                          whileTap={{ scale: 0.95 }}
                          disabled={isDisabled}
                          onClick={() =>
                            setSelectedSize(size)}
                          className={`
                            min-w-[52px] h-12
                            px-3 rounded-2xl
                            border-2 font-black
                            text-sm transition-all
                            relative
                            ${isSelected
                              ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                              : isDisabled
                                ? 'border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400'
                            }
                            ${isLowStock ? 'opacity-60' : ''}
                          `}>
                          <span className={isLowStock ? 'line-through opacity-50' : ''}>
                            {size}
                          </span>
                          {isLowStock && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── QUANTITY ── */}
              <div>
                <p className="text-sm
                  font-black text-gray-900 mb-3">
                  Quantité
                </p>
                <div className="flex items-center
                  gap-4">
                  <div className="flex items-center
                    border-2 border-gray-200
                    rounded-2xl overflow-hidden">
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.max(1, quantity - 1)
                        )}
                      disabled={quantity <= 1}
                      className="w-12 h-12
                        flex items-center
                        justify-center
                        hover:bg-gray-50
                        disabled:opacity-40
                        transition-colors
                        text-gray-700">
                      <Minus className="w-4 h-4"/>
                    </button>

                    <span className="w-12 text-center
                      font-black text-gray-900
                      text-lg">
                      {quantity}
                    </span>

                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            maxStock, quantity + 1
                          )
                        )}
                      disabled={
                        quantity >= maxStock
                      }
                      className="w-12 h-12
                        flex items-center
                        justify-center
                        hover:bg-gray-50
                        disabled:opacity-40
                        transition-colors
                        text-gray-700">
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Stock info */}
                  {maxStock <= 10 &&
                    maxStock > 0 && (
                    <p className="text-xs
                      text-orange-500 font-bold">
                      🔥 Plus que {maxStock}
                      {' '}en stock!
                    </p>
                  )}
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{
                      opacity: 0, y: -8
                    }}
                    animate={{
                      opacity: 1, y: 0
                    }}
                    exit={{
                      opacity: 0, y: -8
                    }}
                    className="flex items-center
                      gap-2 bg-red-50
                      border border-red-200
                      text-red-600 text-sm
                      font-bold px-4 py-3
                      rounded-2xl">
                    <AlertCircle
                      className="w-4 h-4
                        flex-shrink-0"/>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── ADD TO CART BUTTON ── */}
              <div className="flex gap-3
                pb-2">

                {/* Wishlist */}
                <button
                  className="w-14 h-14
                    border-2 border-gray-200
                    hover:border-red-300
                    hover:text-red-400
                    rounded-2xl flex items-center
                    justify-center text-gray-400
                    transition-colors
                    flex-shrink-0">
                  <Heart className="w-5 h-5"/>
                </button>

                {/* Add to cart */}
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex-1 flex items-center
                    justify-center gap-2.5
                    font-black text-base
                    py-4 rounded-2xl
                    transition-all
                    shadow-lg
                    ${added
                      ? 'bg-secondary shadow-secondary/30 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20 text-white'
                    }`}>
                  {added ? (
                    <>
                      <Check className="w-5 h-5"/>
                      Ajouté au panier!
                    </>
                  ) : (
                    <>
                      <ShoppingCart
                        className="w-5 h-5"/>
                      Ajouter au panier
                      {quantity > 1 && (
                        <span className="bg-white/20
                          px-2 py-0.5
                          rounded-full text-sm">
                          ×{quantity}
                        </span>
                      )}
                    </>
                  )}
                </motion.button>
              </div>

              {/* Total price if qty > 1 */}
              {quantity > 1 && (
                <p className="text-center
                  text-sm text-gray-500
                  -mt-3">
                  Total:{' '}
                  <span className="font-black
                    text-gray-900">
                    {formatPrice(
                      product?.price * quantity
                    )}
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

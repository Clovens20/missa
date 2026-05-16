'use client'
import { useState, useEffect }
  from 'react'
import { motion, AnimatePresence }
  from 'framer-motion'
import { Check, ChevronLeft,
  ChevronRight } from 'lucide-react'

const COLOR_HEX_MAP: Record<
  string, string
> = {
  'Rouge': '#EF4444', 'Red': '#EF4444',
  'Bleu': '#3B82F6', 'Blue': '#3B82F6',
  'Vert': '#22C55E', 'Green': '#22C55E',
  'Noir': '#111111', 'Black': '#111111',
  'Blanc': '#F9FAFB', 'White': '#F9FAFB',
  'Rose': '#EC4899', 'Pink': '#EC4899',
  'Jaune': '#EAB308', 'Yellow': '#EAB308',
  'Violet': '#A855F7', 'Purple': '#A855F7',
  'Orange': '#F97316',
  'Gris': '#6B7280', 'Gray': '#6B7280',
  'Beige': '#D2B48C',
  'Marine': '#1E3A5F',
  'Bordeaux': '#800020',
}

interface ProductVariantSelectorProps {
  product: any
  onVariantChange: (variant: {
    color?: string
    size?: string
    images: string[]
  }) => void
}

export default function
ProductVariantSelector({
  product,
  onVariantChange,
}: ProductVariantSelectorProps) {

  const colors: string[] = [
    ...new Set(
      [
        ...(product.colors || []),
        ...(product.available_colors || []),
        ...(product.variants || [])
          .map((v: any) => v.color || (v.type === 'color' ? v.value : null))
      ].filter(Boolean)
    )
  ]

  const sizes: string[] = [
    ...new Set(
      [
        ...(product.sizes || []),
        ...(product.available_sizes || []),
        ...(product.variants || [])
          .map((v: any) => v.size || (v.type === 'size' ? v.value : null))
      ].filter(Boolean)
    )
  ]

  const variantImages: Record<
    string, any[]
  > = product.variant_images || {}

  const [selectedColor, setSelectedColor] =
    useState<string>(colors[0] || '')

  const [selectedSize, setSelectedSize] =
    useState<string>(sizes[0] || '')

  const [currentImgIdx, setCurrentImgIdx] =
    useState(0)

  // Find variant for current selection
  const currentVariant = (product.variants || []).find((v: any) => {
    const colorMatch = (v.color || '') === (selectedColor || '')
    const sizeMatch = (v.size || '') === (selectedSize || '')
    return colorMatch && sizeMatch
  })

  const isOutOfStock = currentVariant ? currentVariant.stock <= 0 : false

  // Helper to check if a size exists/is-in-stock for a color
  function getSizeStatus(size: string, color: string) {
    const v = (product.variants || []).find((v: any) =>
      (v.color || '') === (color || '') &&
      (v.size || '') === (size || '')
    )
    if (!v) return 'not-exists'
    return v.stock > 0 ? 'in-stock' : 'out-of-stock'
  }

  // Current images for selected color
  const currentImages = (() => {
    if (selectedColor &&
      variantImages[selectedColor]
        ?.length > 0) {
      return variantImages[selectedColor]
        .map((img: any) =>
          typeof img === 'string'
            ? img : img.url
        )
    }
    return (product.images || [])
      .map((img: any) =>
        typeof img === 'string'
          ? img : img.url
      )
  })()

  // Notify parent when variant changes
  useEffect(() => {
    onVariantChange({
      color: selectedColor,
      size: selectedSize,
      images: currentImages,
    })
    setCurrentImgIdx(0)
  }, [selectedColor, selectedSize])

  return (
    <div className="space-y-6">

      {/* ── IMAGE GALLERY ── */}
      <div className="flex gap-4">

        {/* Thumbnails */}
        {currentImages.length > 1 && (
          <div className="flex flex-col
            gap-2 w-16 flex-shrink-0">
            {currentImages
              .slice(0, 5)
              .map((img: string, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setCurrentImgIdx(i)}
                className={`w-16 h-16
                  rounded-xl overflow-hidden
                  border-2 transition-all
                  ${currentImgIdx === i
                    ? 'border-primary shadow-md'
                    : 'border-gray-200 hover:border-gray-400'
                  }`}>
                <img
                  src={img}
                  alt=""
                  className="w-full h-full
                    object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="flex-1 relative
          aspect-square rounded-3xl
          overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait">
            <motion.img
              key={
                currentImages[currentImgIdx]
              }
              src={
                currentImages[currentImgIdx]
                || '/placeholder-product.jpg'
              }
              alt={product.name}
              className="w-full h-full
                object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          {/* Prev/Next arrows */}
          {currentImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCurrentImgIdx(
                    prev => prev === 0
                      ? currentImages.length - 1
                      : prev - 1
                  )}
                className="absolute left-3
                  top-1/2 -translate-y-1/2
                  w-9 h-9 bg-white/90
                  rounded-full shadow-lg
                  flex items-center
                  justify-center
                  hover:bg-white
                  transition-colors">
                <ChevronLeft
                  className="w-5 h-5"/>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentImgIdx(
                    prev =>
                      (prev + 1) %
                      currentImages.length
                  )}
                className="absolute right-3
                  top-1/2 -translate-y-1/2
                  w-9 h-9 bg-white/90
                  rounded-full shadow-lg
                  flex items-center
                  justify-center
                  hover:bg-white
                  transition-colors">
                <ChevronRight
                  className="w-5 h-5"/>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── COLOR SELECTOR ── */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-center
            justify-between mb-3">
            <p className="text-sm
              font-black text-gray-900">
              Couleur:
              <span className="text-primary
                ml-2 font-black">
                {selectedColor}
              </span>
            </p>
            {variantImages[selectedColor]
              ?.length > 0 && (
              <span className="text-[10px]
                text-secondary font-bold
                bg-secondary/10
                px-2 py-1 rounded-full">
                📸 {
                  variantImages[selectedColor]
                    .length
                } photo(s)
              </span>
            )}
          </div>

          <div className="flex gap-3
            flex-wrap">
            {colors.map(color => {
              const hex =
                COLOR_HEX_MAP[color] ||
                '#888'
              const isSelected =
                selectedColor === color
              const hasOwnImages =
                (variantImages[color]
                  ?.length || 0) > 0
              const isLight = [
                'Blanc', 'White',
                'Beige', 'Jaune',
              ].includes(color)

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setSelectedColor(color)}
                  title={color}
                  className={`
                    relative flex flex-col
                    items-center gap-1.5
                    transition-all`}>

                  {/* Color circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full
                      border-2 transition-all
                      ${isSelected
                        ? 'border-primary scale-110 shadow-lg'
                        : isLight
                          ? 'border-gray-300 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    style={{
                      background: hex
                    }}>
                    {isSelected && (
                      <div className="w-full
                        h-full rounded-full
                        flex items-center
                        justify-center">
                        <Check
                          className={`w-5 h-5
                            font-black
                            ${isLight
                              ? 'text-gray-800'
                              : 'text-white'
                            }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Color name */}
                  <span className={`text-[10px]
                    font-bold transition-colors
                    ${isSelected
                      ? 'text-primary'
                      : 'text-gray-500'
                    }`}>
                    {color}
                  </span>

                  {/* Has images dot */}
                  {hasOwnImages && (
                    <div className="absolute
                      -top-0.5 -right-0.5
                      w-3 h-3 bg-secondary
                      rounded-full border-2
                      border-white"/>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SIZE SELECTOR ── */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center
            justify-between mb-3">
            <p className="text-sm
              font-black text-gray-900">
              Taille:
              {selectedSize && (
                <span className="text-primary
                  ml-2">
                  {selectedSize}
                </span>
              )}
            </p>
            <a href="#size-guide"
              className="text-xs
                text-primary
                hover:underline font-bold">
              Guide des tailles →
            </a>
          </div>

          {/* Stock status for current combination */}
          {selectedColor && selectedSize && (
            <div className="mb-3">
              {isOutOfStock ? (
                <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-full uppercase">
                  ❌ Rupture de stock
                </span>
              ) : currentVariant ? (
                <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-1 rounded-full uppercase">
                  ✅ En stock ({currentVariant.stock})
                </span>
              ) : null}
            </div>
          )}

          <div className="flex gap-2
            flex-wrap">
            {sizes.map(size => {
              const isSelected =
                selectedSize === size
              const status = getSizeStatus(size, selectedColor)
              const isDisabled = status === 'not-exists'
              const isLowStock = status === 'out-of-stock'

              return (
                <button
                  key={size}
                  type="button"
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
                      ? 'border-primary bg-primary/10 text-primary shadow-md'
                      : isDisabled
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                        : 'border-gray-200 text-gray-600 hover:border-primary/50 hover:text-primary'
                    }
                    ${isLowStock ? 'text-gray-400' : ''}
                  `}>
                  <span className={isLowStock ? 'line-through opacity-50' : ''}>
                    {size}
                  </span>
                  {isLowStock && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

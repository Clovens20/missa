'use client'
import { useState, useEffect }
  from 'react'
import { motion, AnimatePresence }
  from 'framer-motion'
import { Check, ChevronLeft,
  ChevronRight, Film } from 'lucide-react'
import { getColorHex } from '@/lib/colors'


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
    let imgs: string[] = (product.images || []).map((img: any) => typeof img === 'string' ? img : img.url)
    
    const safeSelectedColor = (selectedColor || '').toLowerCase().trim()
    let matchedImgUrl: string | null = null;

    if (safeSelectedColor) {
      const matchKey = Object.keys(variantImages).find(k => k.toLowerCase().trim() === safeSelectedColor)
      if (matchKey && variantImages[matchKey]?.length > 0) {
        matchedImgUrl = typeof variantImages[matchKey][0] === 'string' ? variantImages[matchKey][0] : variantImages[matchKey][0].url
      }
    }

    if (!matchedImgUrl) {
      const variantWithImage = (product.variants || []).find((v: any) => 
        (v.color || '').toLowerCase().trim() === safeSelectedColor && 
        (v.image || v.image_url || v.variantImage)
      )
      if (variantWithImage) {
        matchedImgUrl = variantWithImage.image || variantWithImage.image_url || variantWithImage.variantImage
      }
    }

    if (!matchedImgUrl && safeSelectedColor) {
      const fuzzyMatch = (product.images || []).find((img: any) => {
        const url = (typeof img === 'string' ? img : img.url).toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        return url.includes(safeSelectedColor) || alt.includes(safeSelectedColor);
      });
      if (fuzzyMatch) {
        matchedImgUrl = typeof fuzzyMatch === 'string' ? fuzzyMatch : fuzzyMatch.url;
      }
    }

    // If a variant image was found but it's not in the main gallery, add it
    if (matchedImgUrl && !imgs.includes(matchedImgUrl)) {
      imgs = [matchedImgUrl, ...imgs]
    }

    return imgs.length > 0 ? imgs : ['/placeholder-product.jpg']
  })()

  // Notify parent when variant changes
  useEffect(() => {
    onVariantChange({
      color: selectedColor,
      size: selectedSize,
      images: currentImages,
    })
    
    // Auto-select the image index for this color
    const safeSelectedColor = (selectedColor || '').toLowerCase().trim()
    let matchedImgUrl: string | null = null;

    if (safeSelectedColor) {
      const matchKey = Object.keys(variantImages).find(k => k.toLowerCase().trim() === safeSelectedColor)
      if (matchKey && variantImages[matchKey]?.length > 0) {
        matchedImgUrl = typeof variantImages[matchKey][0] === 'string' ? variantImages[matchKey][0] : variantImages[matchKey][0].url
      }
    }

    if (!matchedImgUrl) {
      const variantWithImage = (product.variants || []).find((v: any) => 
        (v.color || '').toLowerCase().trim() === safeSelectedColor && 
        (v.image || v.image_url || v.variantImage)
      )
      if (variantWithImage) matchedImgUrl = variantWithImage.image || variantWithImage.image_url || variantWithImage.variantImage
    }

    if (!matchedImgUrl && safeSelectedColor) {
      const fuzzyMatch = (product.images || []).find((img: any) => {
        const url = (typeof img === 'string' ? img : img.url).toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        return url.includes(safeSelectedColor) || alt.includes(safeSelectedColor);
      });
      if (fuzzyMatch) matchedImgUrl = typeof fuzzyMatch === 'string' ? fuzzyMatch : fuzzyMatch.url;
    }

    if (matchedImgUrl) {
      const idx = currentImages.indexOf(matchedImgUrl)
      if (idx !== -1) setCurrentImgIdx(idx)
    }
  }, [selectedColor, selectedSize])

  // Unified media items (images + video if available)
  const mediaItems = (() => {
    const items: { type: 'image' | 'video'; url: string }[] = [];
    currentImages.forEach((img: string) => {
      items.push({ type: 'image', url: img });
    });
    if (product.video_url) {
      items.push({ type: 'video', url: product.video_url });
    }
    return items;
  })();

  return (
    <div className="space-y-6">

      {/* ── IMAGE GALLERY ── */}
      <div className="flex flex-col-reverse md:flex-row gap-4">

        {/* Thumbnails */}
        {mediaItems.length > 1 && (
          <div className="flex flex-row md:flex-col
            gap-2 w-full md:w-16 flex-shrink-0 md:max-h-[500px] overflow-x-auto md:overflow-x-hidden md:overflow-y-auto pb-2 md:pb-0 md:pr-1 scrollbar-thin scrollbar-thumb-gray-300">
            {mediaItems.map((item, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setCurrentImgIdx(i)}
                className={`w-16 h-16 flex-shrink-0
                  rounded-xl overflow-hidden
                  border-2 transition-all relative
                  ${currentImgIdx === i
                    ? 'border-primary shadow-md'
                    : 'border-gray-200 hover:border-gray-400'
                  }`}>
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full
                      object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-primary gap-0.5">
                    <Film className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary">Vidéo</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main image / video */}
        <div className="flex-1 relative
          aspect-square rounded-3xl
          overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait">
            {mediaItems[currentImgIdx]?.type === 'image' ? (
              <motion.img
                key={
                  mediaItems[currentImgIdx]?.url
                }
                src={
                  mediaItems[currentImgIdx]?.url
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
            ) : (
              <motion.div
                key="video-player"
                className="w-full h-full bg-black relative flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <video
                  src={mediaItems[currentImgIdx]?.url}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prev/Next arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCurrentImgIdx(
                    prev => prev === 0
                      ? mediaItems.length - 1
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
                      mediaItems.length
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
              const hex = getColorHex(color)
              const isSelected =
                selectedColor === color
              const hasOwnImages =
                (variantImages[color]
                  ?.length || 0) > 0
              const isLight = [
                'Blanc', 'White', 'blanc casse', 'creme', 'ivoire',
                'Beige', 'Jaune', 'light yellow', 'champagne',
              ].includes(color) || hex === '#f5f5f5' || hex === '#ffffff'


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

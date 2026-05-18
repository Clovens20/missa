'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Plus,
  Heart, Star, Eye,
  Package,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import VariantPicker from './VariantPicker'
import { useCart } from '@/contexts/CartContext'
import { toast } from 'sonner'
import ProductQuickView from './ProductQuickView'

const COLOR_HEX: Record<string, string> = {
  'Rouge': '#EF4444', 'Red': '#EF4444',
  'Bleu': '#3B82F6', 'Blue': '#3B82F6',
  'Vert': '#22C55E', 'Green': '#22C55E',
  'Noir': '#1a1a1a', 'Black': '#1a1a1a',
  'Blanc': '#f5f5f5', 'White': '#f5f5f5',
  'Rose': '#EC4899', 'Pink': '#EC4899',
  'Jaune': '#EAB308', 'Yellow': '#EAB308',
  'Violet': '#A855F7', 'Purple': '#A855F7',
  'Orange': '#F97316',
  'Gris': '#6B7280', 'Gray': '#6B7280',
  'Beige': '#D2B48C',
  'Marine': '#1E3A5F',
  'Bordeaux': '#800020',
  'Marron': '#92400E',
}

import { Product } from '@/types'

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product
  index?: number
}) {
  const { addItem } = useCart()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  
  // Colors & sizes
  const colors: string[] =
    product.colors ||
    product.available_colors ||
    product.variants
      ?.filter((v: any) => v.type === 'color')
      .map((v: any) => v.value) ||
    []

  const sizes: string[] =
    product.sizes ||
    product.available_sizes ||
    product.variants
      ?.filter((v: any) => v.type === 'size')
      .map((v: any) => v.value) ||
    []

  const hasVariants = colors.length > 0 || sizes.length > 0

  const variantImages: Record<
    string, any[]
  > = product.variant_images || {}

  const [selectedColor, setSelectedColor] =
    useState<string>(colors[0] || '')

  const [hovered, setHovered] =
    useState(false)

  const [wishlist, setWishlist] =
    useState(false)

  // Get images for selected color
  const images = (() => {
    if (
      selectedColor &&
      variantImages[selectedColor]?.length > 0
    ) {
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

  const mainImage = images[0] || null
  const hoverImage = images[1] || null

  // Discount calculation
  const hasDiscount =
    product.compare_price &&
    product.compare_price > product.price
  const discountPct = hasDiscount && product.compare_price
    ? Math.round(
        (1 - product.price /
          product.compare_price) * 100
      )
    : 0

  const inStock =
    (product.stock_quantity || 0) > 0
  const isLowStock =
    product.stock_quantity > 0 &&
    product.stock_quantity <= 5

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (hasVariants) {
      setPickerOpen(true)
    } else {
      addItem(product, 1)
      toast.success('✅ Ajouté au panier!')
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: Math.min(index, 8) * 0.05,
          ease: 'easeOut',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group bg-white rounded-2xl
          overflow-hidden
          border border-gray-100
          hover:border-primary/30
          hover:shadow-2xl
          hover:shadow-black/8
          transition-all duration-300
          flex flex-col relative">

        {/* ── IMAGE ZONE ── */}
        <Link
          href={`/product/${product.slug}`}
          className="block relative overflow-hidden bg-gray-50 w-full"
          style={{ aspectRatio: '1/1' }}>

          {/* Main image */}
          {mainImage ? (
            <>
              <img
                src={mainImage}
                alt={product.name}
                className={`
                  absolute inset-0
                  w-full h-full object-cover object-center bg-gray-100
                  transition-all duration-500
                  ${hovered && hoverImage
                    ? 'opacity-0 scale-105'
                    : 'opacity-100 scale-100'
                  }`}
                style={{ objectFit: 'cover' }}
                loading={index < 4 ? "eager" : "lazy"}
              />
              {/* Hover image */}
              {hoverImage && (
                <img
                  src={hoverImage}
                  alt={product.name}
                  className={`
                    absolute inset-0
                    w-full h-full object-cover object-center bg-gray-100
                    transition-all duration-500
                    ${hovered
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                    }`}
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
              )}
            </>
          ) : (
            // No image placeholder
            <div className="absolute inset-0
              flex flex-col items-center
              justify-center bg-gray-100
              text-gray-300">
              <Package className="w-12 h-12
                mb-2"/>
              <p className="text-xs">
                Aucune image
              </p>
            </div>
          )}

          {/* ── BADGES top-left ── */}
          <div className="absolute top-3
            left-3 flex flex-col gap-1.5
            z-10">

            {hasDiscount && (
              <span className="bg-red-500
                text-white text-xs
                font-black px-2.5 py-1
                rounded-full shadow-sm">
                -{discountPct}%
              </span>
            )}

            {product.is_new && (
              <span className="bg-primary
                text-white text-xs
                font-black px-2.5 py-1
                rounded-full shadow-sm">
                ✨ Nouveau
              </span>
            )}

            {isLowStock && (
              <span className="bg-orange-500
                text-white text-[10px]
                font-black px-2 py-0.5
                rounded-full shadow-sm">
                🔥 {product.stock_quantity}
                {' '}restants
              </span>
            )}

            {!inStock && (
              <span className="bg-gray-500
                text-white text-xs
                font-black px-2.5 py-1
                rounded-full shadow-sm">
                Épuisé
              </span>
            )}
          </div>

          {/* ── ACTIONS top-right ── */}
          <div className="absolute top-3
            right-3 z-10 flex flex-col gap-2">

            {/* Quick Add Button */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`
                w-9 h-9 rounded-full
                shadow-md flex items-center
                justify-center transition-all
                bg-primary text-white hover:bg-primary-dark
                disabled:bg-gray-400
                opacity-0 group-hover:opacity-100
                translate-x-2
                group-hover:translate-x-0
                duration-300`}
              title="Ajouter au panier"
            >
              <Plus className="w-5 h-5"/>
            </button>

            {/* Wishlist */}
            <button
              onClick={e => {
                e.preventDefault()
                setWishlist(!wishlist)
              }}
              className={`
                w-9 h-9 rounded-full
                shadow-md flex items-center
                justify-center transition-all
                ${wishlist
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-500 hover:text-red-500'
                }
                opacity-0 group-hover:opacity-100
                translate-x-2
                group-hover:translate-x-0
                duration-300 delay-75`}>
              <Heart className={`w-4 h-4
                ${wishlist
                  ? 'fill-white' : ''}`}/>
            </button>

            {/* Quick view */}
            <button
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                setQuickViewOpen(true)
              }}
              className="w-9 h-9 rounded-full
                bg-white/90 shadow-md
                flex items-center justify-center
                text-gray-500 hover:text-primary
                transition-all
                opacity-0 group-hover:opacity-100
                translate-x-2
                group-hover:translate-x-0
                duration-300 delay-150">
              <Eye className="w-4 h-4"/>
            </button>
          </div>

          {/* ── ADD TO CART overlay ── */}
          <div className="absolute bottom-0
            left-0 right-0 z-10
            translate-y-full
            group-hover:translate-y-0
            transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full flex items-center
                justify-center gap-2
                bg-gray-900/95
                hover:bg-primary
                disabled:bg-gray-400
                text-white font-black
                py-3.5 text-sm
                transition-colors duration-200">
              <ShoppingCart className="w-4 h-4"/>
              {!inStock
                ? 'Épuisé'
                : hasVariants
                  ? 'Choisir les options'
                  : 'Ajouter au panier'
              }
            </button>
          </div>

          {/* Image dots */}
          {images.length > 1 && (
            <div className="absolute
              bottom-12 left-1/2
              -translate-x-1/2
              flex gap-1 z-10">
              {images.slice(0, 4).map(
                (_: any, i: number) => (
                <div key={i}
                  className={`
                    rounded-full
                    bg-white/80
                    transition-all
                    ${i === 0
                      ? 'w-4 h-1.5'
                      : 'w-1.5 h-1.5'
                    }`}
                />
              ))}
            </div>
          )}
        </Link>

        {/* ── PRODUCT INFO ── */}
        <div className="p-4 flex flex-col
          gap-3 flex-1">

          {/* Category */}
          {product.category_id && (
            <p className="text-[10px]
              text-gray-400 font-bold
              uppercase tracking-wider">
              {product.category?.name || 'Collection'}
            </p>
          )}

          {/* Product name */}
          <Link
            href={`/product/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {( (product.review_count || 0) > 0 || (product.review_avg || 0) > 0) && (
            <div className="flex items-center
              gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s}
                    className={`w-3.5 h-3.5
                      ${s <= Math.round(
                        product.review_avg || 0
                      )
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs
                text-gray-400">
                {product.review_avg?.toFixed(1)}
                <span className="text-gray-300">
                  {' '}({product.review_count || 0})
                </span>
              </span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1"/>

          {/* Color swatches */}
          {colors.length > 0 && (
            <div className="flex items-center
              gap-1.5 flex-wrap">
              {colors.slice(0, 6).map(color => {
                const hex =
                  COLOR_HEX[color] || '#ccc'
                const isSelected =
                  selectedColor === color
                const isLight = [
                  'Blanc', 'White',
                  'Beige', 'Jaune',
                ].includes(color)

                return (
                  <button
                    key={color}
                    onClick={e => {
                      e.preventDefault()
                      setSelectedColor(color)
                    }}
                    title={color}
                    className={`
                      w-5 h-5 rounded-full
                      border transition-all
                      hover:scale-110
                      ${isSelected
                        ? 'border-gray-900 scale-125 shadow-md'
                        : isLight
                          ? 'border-gray-300'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    style={{ background: hex }}
                  />
                )
              })}

              {colors.length > 6 && (
                <span className="text-[10px]
                  text-gray-400 font-semibold">
                  +{colors.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Sizes preview */}
          {sizes.length > 0 && (
            <div className="flex gap-1
              flex-wrap">
              {sizes.slice(0, 5).map(size => (
                <span key={size}
                  className="text-[10px]
                    text-gray-500
                    border border-gray-200
                    px-1.5 py-0.5
                    rounded-md font-semibold">
                  {size}
                </span>
              ))}
              {sizes.length > 5 && (
                <span className="text-[10px]
                  text-gray-400">
                  +{sizes.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center
            justify-between pt-1
            border-t border-gray-50">

            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-black text-primary mt-1">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm
                  text-gray-400
                  line-through">
                  {formatPrice(
                    product.compare_price || 0
                  )}
                </span>
              )}
            </div>

            {/* Sold count */}
            {(product.sold_count || 0) > 10 && (
              <span className="text-[10px]
                text-gray-400">
                {product.sold_count}+ vendus
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Variant Picker Modal */}
      <VariantPicker
        product={product}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAddToCart={(selection) => {
          addItem({
            ...product,
            price: selection.price,
          }, selection.quantity, {
            color: selection.color,
            size: selection.size,
            image: selection.image || mainImage,
          } as any)
          toast.success(`✅ ${product.name} ajouté!`)
        }}
      />
      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        onAddToCart={(pid, vid, qty) => {
          // Standard selection format for CartContext
          const selectedVariant = product.variants?.find((v: any) => (v.id || v.vid) === vid) as any
          addItem({
            ...product,
            price: selectedVariant?.price || product.price,
          }, qty, {
            color: selectedVariant?.color || null,
            size: selectedVariant?.size || null,
            image: selectedVariant?.image || selectedVariant?.image_url || mainImage,
          } as any)
          toast.success(`✅ ${product.name} ajouté!`)
        }}
      />
    </>
  )
}

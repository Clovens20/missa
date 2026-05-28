'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Heart, Share2, Star, Shield, Truck, RotateCcw, ChevronRight, Minus, Plus, Check, AlertCircle, Zap } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { formatPrice, calculateDiscount } from '@/lib/utils'
import type { Product, Review, ProductVariant } from '@/types'
import { toast } from 'sonner'
import { useCountry } from '@/contexts/CountryContext'
import { isProductAvailable } from '@/lib/geo-detect'
import { 
  UrgencyBlock,
  RecentPurchasePopup,
} from '@/components/shop/UrgencyBadges'
import ProductReviews from '@/components/shop/ProductReviews'
import MiniStarRating from '@/components/shop/MiniStarRating'
import ShareProduct from '@/components/shop/ShareProduct'
import { trackAddToCart } from '@/components/shop/PixelsInjector'
import ProductVariantSelector from '@/components/shop/ProductVariantSelector'
import EmailCaptureModal from '@/components/EmailCaptureModal'

interface Props {
  product: Product & { 
    category?: { name: string, slug: string }
  }
  reviews: Review[]
  volumeDiscounts?: { d2: number, d3: number, d4: number, d5: number }
}

export default function ProductDetailClient({
  product,
  reviews,
  volumeDiscounts
}: Props) {
  const { addItem, setGuestEmail } = useCart()
  const { toggle, isInWishlist } = useWishlist()
  const { country: visitorCountry } = useCountry()
  
  const [mainImg, setMainImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants?.[0] || null)
  const [activeTab, setActiveTab] = useState<'desc'|'specs'|'reviews'>('desc')
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [capturedEmail, setCapturedEmail] = useState('')
  const [pendingAction, setPendingAction] = useState<'buy' | 'cart' | null>(null)
  const router = useRouter()

  const d = volumeDiscounts || { d2: 15, d3: 20, d4: 25, d5: 35 }
  const VOLUME_DISCOUNTS = [
    { qty: 1, discount: 0, label: '1 article' },
    { qty: 2, discount: d.d2, label: `2 articles (-${d.d2}%)` },
    { qty: 3, discount: d.d3, label: `3 articles (-${d.d3}%)` },
    { qty: 4, discount: d.d4, label: `4 articles (-${d.d4}%)` },
    { qty: 5, discount: d.d5, label: `5 articles (-${d.d5}%)` },
  ]

  const inWishlist = isInWishlist(product.id)
  const discount = product.compare_price ? calculateDiscount(product.price, product.compare_price) : 0
  const isAvailable = isProductAvailable(product, visitorCountry)

  const colors: string[] = [
    ...new Set(
      [
        ...(product.colors || []),
        ...(product.available_colors || []),
        ...(product.variants || [])
          .map((v: ProductVariant | any) => v.color || (v.type === 'color' ? (v as any).value : null))
      ].filter(Boolean)
    )
  ]

  const sizes: string[] = [
    ...new Set(
      [
        ...(product.sizes || []),
        ...(product.available_sizes || []),
        ...(product.variants || [])
          .map((v: ProductVariant | any) => v.size || (v.type === 'size' ? (v as any).value : null))
      ].filter(Boolean)
    )
  ]

  const currentDiscount = VOLUME_DISCOUNTS.find(d => d.qty === quantity)?.discount ?? VOLUME_DISCOUNTS[VOLUME_DISCOUNTS.length - 1].discount
  const unitPrice = product.price * (1 - currentDiscount / 100)

  function handleAddToCart() {
    // Validate variants
    if (colors.length > 0 && !selectedVariant?.color) {
      setCartError('Veuillez choisir une couleur')
      return
    }
    if (sizes.length > 0 && !selectedVariant?.size) {
      setCartError('Veuillez choisir une taille')
      return
    }

    setCartError('')
    
    if (!capturedEmail) {
      setPendingAction('cart')
      setShowEmailModal(true)
    } else {
      executeAddToCart()
    }
  }

  function executeAddToCart() {
    setAdding(true)
    const productToAdd = { ...product, price: unitPrice }
    addItem(productToAdd, quantity, selectedVariant || undefined)
    trackAddToCart(productToAdd, quantity)
    setTimeout(() => setAdding(false), 2000)
  }

  function handleBuyNow() {
    if (colors.length > 0 && !selectedVariant?.color) {
      setCartError('Veuillez choisir une couleur')
      return
    }
    if (sizes.length > 0 && !selectedVariant?.size) {
      setCartError('Veuillez choisir une taille')
      return
    }
    setCartError('')
    
    if (!capturedEmail) {
      setPendingAction('buy')
      setShowEmailModal(true)
    } else {
      executeBuyNow()
    }
  }

  function executeBuyNow() {
    const productToAdd = { ...product, price: unitPrice }
    addItem(productToAdd, quantity, selectedVariant || undefined)
    trackAddToCart(productToAdd, quantity)
    router.push('/checkout')
  }

  function handleEmailSubmit(email: string) {
    setCapturedEmail(email)
    setGuestEmail(email)
    setShowEmailModal(false)
    
    if (pendingAction === 'buy') {
      executeBuyNow()
    } else if (pendingAction === 'cart') {
      executeAddToCart()
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Lien copié! 🔗')
  }

  const avgRating = typeof product.review_avg === 'number' && product.review_avg > 0
    ? product.review_avg 
    : (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

  const totalReviewCount = typeof product.review_count === 'number' && product.review_count > 0
    ? product.review_count
    : reviews.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <ChevronRight className="w-4 h-4"/>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-primary">
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4"/>
          </>
        )}
        <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 mb-16">
          {/* 🎯 SÉLECTEUR DE VARIANTES (Images + Couleurs + Tailles) */}
          <ProductVariantSelector
            product={product}
            onVariantChange={(variant) => {
              // Map back to the full variant object if possible
              const fullVariant = product.variants?.find(v => {
                const colorMatch = (v.color || '') === (variant.color || '')
                const sizeMatch = (v.size || '') === (variant.size || '')
                return colorMatch && sizeMatch
              }) || {
                color: variant.color,
                size: variant.size,
                images: variant.images
              }
              setSelectedVariant(fullVariant as any)
            }}
          />

          <div className="space-y-6">
            {/* Product Header Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {product.is_new && <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase">Nouveau</span>}
                {discount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full">-{discount}%</span>}
                {product.stock_quantity > 0 && product.stock_quantity <= 5 && <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full">🔥 {product.stock_quantity} restants</span>}
              </div>

              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_: any, i: number) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-current' : 'text-gray-200 fill-current'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({totalReviewCount} avis)</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <span className="text-sm text-gray-500 font-medium">{product.sold_count || 0} vendus</span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-primary">
                  {formatPrice(unitPrice)}
                </span>
                {currentDiscount > 0 ? (
                  <span className="text-xl text-gray-400 line-through decoration-red-500/30">
                    {formatPrice(product.price)}
                  </span>
                ) : (
                  product.compare_price && product.compare_price > product.price && (
                    <span className="text-xl text-gray-400 line-through decoration-red-500/30">
                      {formatPrice(product.compare_price)}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {cartError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-3 font-bold text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {cartError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quantity + Add to cart */}
            <div className="space-y-4">
              {!isAvailable && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 text-center space-y-2">
                  <div className="text-3xl">🚚</div>
                  <p className="text-orange-400 font-black">Non disponible dans votre région</p>
                  <p className="text-gray-500 text-sm">
                    Ce produit est disponible uniquement au {product.available_countries?.includes('CA') ? 'Canada' : ''} {product.available_countries?.includes('US') ? 'et aux États-Unis' : ''}.
                  </p>
                  <Link href="/catalog" className="text-primary font-bold text-xs hover:underline inline-block mt-2">
                    💡 Découvrez nos produits disponibles dans votre région →
                  </Link>
                </div>
              )}

              {/* Volume Discounts */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <p className="font-bold text-gray-900 text-sm">Offres de volume 🔥</p>
                <div className="flex flex-col gap-2">
                  {VOLUME_DISCOUNTS.map(offer => {
                    const isSelected = quantity === offer.qty
                    return (
                      <button
                        key={offer.qty}
                        onClick={() => setQuantity(offer.qty)}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-gray-300'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                          </div>
                          <span className={`font-bold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                            {offer.label}
                          </span>
                        </div>
                        <span className="font-black text-gray-900">
                          {formatPrice((product.price * (1 - offer.discount / 100)) * offer.qty)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"><Minus className="w-4 h-4"/></button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(5, q+1))} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4"/></button>
                  </div>
                  <motion.button 
                    onClick={handleAddToCart} 
                    disabled={adding || product.stock_quantity === 0 || !isAvailable} 
                    whileTap={{ scale: 0.97 }} 
                    className={`w-full md:flex-1 py-4 md:py-3 rounded-2xl md:rounded-xl font-black text-base flex items-center justify-center gap-3 transition-all sticky md:relative bottom-20 md:bottom-auto z-40 md:z-auto shadow-xl shadow-primary/30 md:shadow-lg md:shadow-primary/30 ${
                      (product.stock_quantity === 0 || !isAvailable) 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : adding ? 'bg-secondary text-white' : 'bg-primary hover:bg-primary-dark text-white'
                    }`}
                  >
                    {adding ? <Check className="w-5 h-5"/> : <ShoppingCart className="w-5 h-5"/>}
                    {product.stock_quantity === 0 ? 'Rupture de stock' : !isAvailable ? 'Région non desservie' : adding ? 'Ajouté au panier!' : 'Ajouter au panier'}
                  </motion.button>
                  <ShareProduct
                    productName={product.name}
                    productSlug={product.slug}
                    productImage={product.images?.[0]?.url}
                    productPrice={product.price}
                  />
                </div>

                {/* 1-Click Buy Button */}
                <motion.button
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0 || !isAvailable}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                    (product.stock_quantity === 0 || !isAvailable)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20 border-2 border-gray-900'
                  }`}
                >
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400"/> Achat Rapide (Apple Pay, PayPal...)
                </motion.button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              {[ { Icon: Truck, label: 'Livraison rapide', color: 'text-primary', bg: 'bg-primary/10' }, { Icon: Shield, label: 'Paiement sécurisé', color: 'text-secondary', bg: 'bg-secondary/10' }, { Icon: RotateCcw, label: 'Retours faciles', color: 'text-primary', bg: 'bg-primary/10' } ].map((item: any, i: number) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}><item.Icon className={`w-5 h-5 ${item.color}`}/></div>
                  <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* TABS */}
      <div className="mb-16">
        <div className="flex border-b border-gray-200 mb-8">
          {([ ['desc', '📋 Description'], ['specs', '📐 Spécifications'], ['reviews', `⭐ Avis (${totalReviewCount})`] ] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-4 font-bold text-sm border-b-2 -mb-px transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{label}</button>
          ))}
        </div>
        {activeTab === 'desc' && (
          <div 
            className="prose prose-gray max-w-none text-gray-700 leading-relaxed
              prose-headings:text-gray-900 prose-headings:font-black
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-strong:text-gray-900 prose-strong:font-bold
              prose-ul:list-disc prose-ul:pl-5
              prose-li:text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description || product.short_description || 'Description non disponible.' }}
          />
        )}
        {activeTab === 'specs' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[ ['SKU', product.sku || 'N/A'], ['Catégorie', product.category?.name || 'N/A'], ['Stock', `${product.stock_quantity} unités`], ['Tags', product.tags?.join(', ') || 'N/A'], ['Poids', product.weight ? `${product.weight} kg` : 'N/A'], ['Vendu', `${product.sold_count} fois`] ].map(([key, val]) => (
              <div key={key} className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{key}</p><p className="font-bold text-gray-800 text-sm">{val}</p></div>
            ))}
          </div>
        )}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                <p>Aucun avis pour ce produit</p>
                <p className="text-sm mt-1 mb-4">Soyez le premier à laisser un avis!</p>
                <button onClick={() => {
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  setTimeout(() => window.dispatchEvent(new CustomEvent('open-review-form')), 300);
                }} className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-colors inline-flex items-center gap-2">
                  <Star className="w-4 h-4"/> Écrire un avis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="font-bold text-gray-900">{review.customer_name}</p><div className="flex mt-1">{[...Array(5)].map((_: any, i: number) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}/>))}</div></div>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('fr')}</span>
                    </div>
                    {review.title && <p className="font-semibold text-gray-800 mb-1">{review.title}</p>}
                    {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
                <button onClick={() => {
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  setTimeout(() => window.dispatchEvent(new CustomEvent('open-review-form')), 300);
                }} className="bg-gray-100 text-gray-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors inline-flex items-center gap-2">
                  Voir tous les avis et laisser le vôtre
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <RecentPurchasePopup
        productName={product.name}
        productImage={product.images?.[0]?.url}
      />

      <div id="reviews" className="mt-12 pt-12 border-t border-gray-100">
        <ProductReviews
          productId={product.id}
          productName={product.name}
          reviewCount={product.review_count || 0}
          reviewAvg={product.review_avg || 0}
          reviewBreakdown={product.review_breakdown || {}}
        />
      </div>

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailSubmit}
        productName={product.name}
      />
    </div>
  )
}

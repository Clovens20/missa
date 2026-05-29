'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Image as ImageIcon,
  Plus, Trash2, Package, Tag,
  DollarSign, Hash, Layers, AlertTriangle, X, Globe, Building2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import { useRef } from 'react'
import ProductVariantsManager from '@/components/admin/ProductVariantsManager'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { ProductImage } from '@/types'
import { generateFakeReviewsForProduct } from '@/lib/fake-reviews'

interface ProductFormData {
  name: string
  slug: string
  description: string
  short_description: string
  price: string
  compare_price: string
  sku: string
  category_id: string
  subcategory_id: string
  wholesale_moq: string
  stock_quantity: string
  weight: string
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  is_on_sale: boolean
  tags: string[]
  cost_price: number
  initial_stock: number
  low_stock_threshold: number
  colors: string[]
  sizes: string[]
  variant_images: Record<string, ProductImage[]>
  images: ProductImage[]
  availability_type: string
  available_countries: string[]
  sold_count: number
  ali_url: string
  shipping_fee: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    sku: '',
    category_id: '',
    subcategory_id: '',
    wholesale_moq: '10',
    stock_quantity: '0',
    weight: '',
    is_active: true,
    is_featured: false,
    is_new: true,
    is_on_sale: false,
    tags: [] as string[],
    cost_price: 0,
    initial_stock: 0,
    low_stock_threshold: 5,
    colors: [] as string[],
    sizes: [] as string[],
    variant_images: {} as Record<string, ProductImage[]>,
    images: [] as ProductImage[],
    availability_type: 'worldwide',
    available_countries: ['*'],
    sold_count: Math.floor(Math.random() * 150) + 20,
    ali_url: '',
    shipping_fee: '0'
  })

  const [imageUrl, setImageUrl] = useState('')
  const [additionalImages, setAdditionalImages] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [defaultVariantStock, setDefaultVariantStock] = useState<number>(0)

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    }
    loadCategories()
  }, [])

  function handleNameChange(name: string) {
    const newSlug = slugify(name)
    setFormData(prev => {
      let newSku = prev.sku
      if (!newSku && newSlug) {
        const initials = newSlug.split('-').map(w => w[0]).join('').substring(0, 3).toUpperCase()
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        newSku = `MS-${initials}-${randomNum}`
      }
      return { ...prev, name, slug: newSlug, sku: newSku }
    })
  }

  function generateCombinations() {
    if (formData.colors.length === 0 && formData.sizes.length === 0) {
      toast.error('Ajoutez d\'abord des couleurs ou tailles')
      return
    }

    const newVariants: any[] = []
    const baseSku = formData.sku || 'PROD'
    const colors = formData.colors.length > 0 ? formData.colors : ['']
    const sizes = formData.sizes.length > 0 ? formData.sizes : ['']

    colors.forEach(c => {
      sizes.forEach(s => {
        const exists = variants.find(v => (v.color || '') === c && (v.size || '') === s)
        if (exists) {
          newVariants.push(exists)
        } else {
          const sizePart = s.toUpperCase().replace(/\s+/g, '')
          const colorPart = c.toUpperCase().replace(/\s+/g, '')
          let gen = baseSku
          if (sizePart) gen += `-${sizePart}`
          if (colorPart) gen += `-${colorPart}`

          newVariants.push({
            id: Math.random().toString(),
            size: s,
            color: c,
            stock: defaultVariantStock,
            sku: gen,
            price: formData.price
          })
        }
      })
    })

    setVariants(newVariants)
    toast.success(`${newVariants.length} variantes prêtes !`)
  }

  function addVariant() {
    setVariants([...variants, {
      id: Date.now().toString(),
      size: '',
      color: '',
      stock: 0,
      sku: formData.sku || '',
      price: formData.price
    }])
  }

  function removeVariant(id: string) {
    setVariants(variants.filter(v => v.id !== id))
  }

  function updateVariant(id: string, field: string, value: any) {
    setVariants(variants.map(v => {
      if (v.id === id) {
        const updated = { ...v, [field]: value }

        // Auto-generate SKU if size or color changes
        if (field === 'size' || field === 'color') {
          const baseSku = formData.sku || 'PROD'
          const sizePart = (updated.size || '').toUpperCase().replace(/\s+/g, '')
          const colorPart = (updated.color || '').toUpperCase().replace(/\s+/g, '')

          let generatedSku = baseSku
          if (sizePart) generatedSku += `-${sizePart}`
          if (colorPart) generatedSku += `-${colorPart}`

          updated.sku = generatedSku
        }

        return updated
      }
      return v
    }))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const text = await res.text()
        if (text.includes('Request Entity') || res.status === 413) throw new Error('Image trop volumineuse (Max 4.5MB)')
        throw new Error("Erreur d'upload")
      }

      const data = await res.json()
      if (data.url) {
        setImageUrl(data.url)
        toast.success('Image uploadée !')
      } else {
        throw new Error(data.error || "Erreur d'upload")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  function addTag() {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] })
      setCurrentTag('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.price) { toast.error('Nom et prix obligatoires'); return }
    setLoading(true)

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        wholesale_moq: parseInt(formData.wholesale_moq) || 10,
        subcategory_id: formData.subcategory_id || null,
        stock_quantity: variants.length > 0
          ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : parseInt(formData.stock_quantity),
        low_stock_threshold: formData.low_stock_threshold,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: formData.images || [],
        variants: variants.map(({ id, ...rest }) => ({
          ...rest,
          images: formData.variant_images?.[rest.color] || []
        })),
        colors: formData.colors,
        sizes: formData.sizes,
        variant_images: formData.variant_images,
        availability_type: formData.availability_type,
        available_countries: formData.available_countries,
        sold_count: formData.sold_count,
        shipping_fee: formData.shipping_fee ? parseFloat(formData.shipping_fee) : 0,
        rating: 5, // Temporary, will update below
        review_count: 0, // Temporary
        review_avg: 5, // Temporary
        updated_at: new Date().toISOString()
      }

      const { data: inserted, error } = await supabase.from('products').insert(productData).select().single()
      if (error) throw error

      if (formData.ali_url && formData.ali_url.trim() !== '') {
        // Fetch from AliExpress
        const res = await fetch('/api/scrape-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aliUrl: formData.ali_url, productName: formData.name })
        })
        const data = await res.json()
        
        if (data.success && data.reviews.length > 0) {
          const reviewsToInsert = data.reviews.map((r: any) => ({
            product_id: inserted.id,
            customer_name: r.reviewer_name + (r.reviewer_country ? ` (${r.reviewer_country})` : ''),
            rating: r.rating,
            title: r.comment.length > 30 ? r.comment.substring(0, 30) + '...' : r.comment,
            body: r.comment,
            is_verified: r.is_verified,
            status: 'approved',
            created_at: new Date(r.review_date).toISOString()
          }))
          await supabase.from('product_reviews').insert(reviewsToInsert)

          const avg = reviewsToInsert.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsToInsert.length
          await supabase.from('products').update({
            rating: avg,
            review_avg: avg,
            review_count: reviewsToInsert.length
          }).eq('id', inserted.id)
        }
      } else {
        // Generate fallback fake text reviews
        const contextStr = `${formData.name} ${formData.tags.join(' ')}`;
        const fakeReviewsData = generateFakeReviewsForProduct('DUMMY', contextStr, formData.name);

        const reviewsToInsert = fakeReviewsData.reviews.map((r: any) => ({
          product_id: inserted.id,
          customer_name: r.customer_name,
          rating: r.rating,
          title: r.title,
          body: r.body,
          is_verified: r.is_verified,
          status: 'approved'
        }));

        await supabase.from('product_reviews').insert(reviewsToInsert);

        // Update the product with accurate review numbers
        await supabase.from('products').update({
          rating: fakeReviewsData.reviewAvg,
          review_avg: fakeReviewsData.reviewAvg,
          review_count: fakeReviewsData.reviewCount
        }).eq('id', inserted.id);
      }

      toast.success('🚀 Produit créé avec succès!')
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Ajouter un produit</h1>
            <p className="text-gray-500 text-sm mt-0.5">Créez une nouvelle fiche produit premium</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Enregistrer le produit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche - Infos Principales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-primary" />Informations générales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Nom du produit</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: T-Shirt Premium Missa"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-gray-400 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">SKU (Référence)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="MS-001"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Nombre vendus (Factice / Réel)</label>
                  <input
                    type="number"
                    value={formData.sold_count}
                    onChange={(e) => setFormData({ ...formData, sold_count: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Poids (g)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Ex: 500"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-orange-400 uppercase mb-2 flex items-center gap-1">⭐ Lien AliExpress (Pour Importer les Avis)</label>
                <input
                  type="text"
                  value={formData.ali_url}
                  onChange={(e) => setFormData({ ...formData, ali_url: e.target.value })}
                  placeholder="https://fr.aliexpress.com/item/12345.html (Optionnel)"
                  className="w-full bg-gray-900 border border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                />
                <p className="text-[10px] text-gray-500 mt-1">Collez le lien ici. Les avis seront importés automatiquement après l'enregistrement !</p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Description</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Décrivez votre produit en détail..."
                  minHeight={250}
                />
              </div>
            </div>
          </div>

          {/* 🎯 GESTION DES VARIANTES & IMAGES (PRO) */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-secondary" />
              Variantes & Photos
            </h2>
            <ProductVariantsManager
              productName={formData.name || 'Produit'}
              productId={undefined}
              initialColors={formData.colors}
              initialSizes={formData.sizes}
              initialVariantImages={formData.variant_images}
              initialGeneralImages={formData.images || []}
              onChange={({ colors, sizes, variantImages, generalImages }) => {
                setFormData(prev => {
                  const newFormData = {
                    ...prev,
                    colors,
                    sizes,
                    variant_images: variantImages,
                    images: generalImages
                  }

                  // Sync the legacy variants array for stock management
                  // If we have combinations, we need to ensure the variants array has them
                  const newVariants = [...variants]

                  // Simple logic: if a color/size is removed, remove variants
                  const filteredVariants = newVariants.filter(v =>
                    (colors.length === 0 || colors.includes(v.color)) &&
                    (sizes.length === 0 || sizes.includes(v.size))
                  )

                  // If no variants exist but we have colors/sizes, maybe add some?
                  // For now, let's keep the manual variant list below for stock/sku
                  setVariants(filteredVariants)

                  return newFormData
                })
              }}
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-orange-500" />
                Stock par variante
              </h2>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={defaultVariantStock}
                  onChange={(e) => setDefaultVariantStock(parseInt(e.target.value) || 0)}
                  placeholder="Qté/variante"
                  className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                />
                <button onClick={generateCombinations} className="text-xs font-black bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg border border-primary/20 transition-all flex items-center gap-1">
                  🪄 Générer combinaisons
                </button>
                <button onClick={addVariant} className="text-xs font-black bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />Ajouter
                </button>
              </div>
            </div>

            {variants.length > 0 ? (
              <div className="space-y-3">
                {variants.map((v) => (
                  <div key={v.id} className="flex items-end gap-3 bg-gray-950 p-4 rounded-2xl border border-gray-800">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Taille</label>
                      <select
                        value={v.size}
                        onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                        className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 ring-primary"
                      >
                        <option value="">Taille...</option>
                        {formData.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Couleur</label>
                      <select
                        value={v.color}
                        onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                        className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 ring-primary"
                      >
                        <option value="">Couleur...</option>
                        {formData.colors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Stock</label>
                      <input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value))} className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 ring-primary" />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">SKU</label>
                      <input
                        type="text"
                        value={v.sku || ''}
                        onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-primary focus:ring-1 ring-primary"
                      />
                    </div>
                    <button onClick={() => removeVariant(v.id)} className="p-2.5 text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm italic">Configurez les couleurs et tailles ci-dessus, puis ajoutez le stock pour chaque combinaison ici.</p>
            )}
          </div>
        </div>

        {/* Colonne Droite - Médias, Prix, Organisation */}
        <div className="space-y-6">
          {/* Prix */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" />Tarification</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Prix de vente (US$ - Base)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" step="0.01" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-2.5 text-white font-black outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Prix barré (US$ - Base)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" step="0.01" value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-2.5 text-gray-400 line-through outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800 mt-4">
              <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400"/>
                Frais de livraison spécifiques (US$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input 
                  type="number" step="0.01" min="0" value={formData.shipping_fee} 
                  onChange={e => setFormData({...formData, shipping_fee: e.target.value})}
                  className="w-full md:w-1/3 bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-2.5 text-white outline-none focus:border-purple-400"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Laissez à 0 pour utiliser les frais standards. S'additionne au coût de livraison total.</p>
            </div>

            <div className="pt-4 border-t border-gray-800 mt-4">
              <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400"/>
                Quantité Minimum Wholesale (MOQ)
              </label>
              <input 
                type="number" min="1" value={formData.wholesale_moq} 
                onChange={e => setFormData({...formData, wholesale_moq: e.target.value})}
                className="w-full md:w-1/3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-400"
              />
              <p className="text-[10px] text-gray-500 mt-1">Qté min. requise pour les achats B2B / Vente en gros.</p>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox" id="onSale" checked={formData.is_on_sale}
                onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="onSale" className="text-sm font-bold text-gray-300 cursor-pointer">En promotion</label>
            </div>

            {/* Prix d'achat & Rentabilité */}
            <div className="pt-4 border-t border-gray-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Prix d'achat */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <span className="text-red-400">💸</span>
                    Prix d'achat (coût)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.cost_price || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        cost_price: parseFloat(e.target.value) || 0,
                      }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-white outline-none focus:border-red-400"
                    />
                  </div>
                </div>

                {/* Stock initial */}
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <span>📦</span>
                    Stock initial
                  </label>
                  <input
                    type="number"
                    value={formData.initial_stock || ''}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0
                      setFormData(prev => ({
                        ...prev,
                        initial_stock: val,
                        // Synchroniser avec la quantité totale lors de la création
                        stock_quantity: val.toString()
                      }))
                    }}
                    placeholder="0"
                    min="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Live profit preview */}
              {((formData.cost_price || 0) > 0 || (parseFloat(formData.price) || 0) > 0) && (
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Aperçu rentabilité</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: 'Marge/u',
                        value: `$${((parseFloat(formData.price) || 0) - (formData.cost_price || 0)).toFixed(2)}`,
                        color: (parseFloat(formData.price) || 0) > (formData.cost_price || 0) ? 'text-secondary' : 'text-red-400',
                      },
                      {
                        label: 'Marge %',
                        value: (formData.cost_price || 0) > 0 ? `${Math.round(((parseFloat(formData.price) - formData.cost_price) / formData.cost_price) * 100)}%` : '—',
                        color: 'text-primary',
                      },
                      {
                        label: 'Investi',
                        value: `$${((formData.cost_price || 0) * (formData.initial_stock || 0)).toFixed(2)}`,
                        color: 'text-gray-300',
                      },
                    ].map((stat, i) => (
                      <div key={i} className="text-center bg-gray-900 rounded-xl p-2 border border-gray-800">
                        <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  {(formData.initial_stock || 0) > 0 && (formData.cost_price || 0) > 0 && (
                    <p className="text-[10px] text-gray-500 text-center">
                      💡 Seuil de rentabilité: <strong className="text-white">{Math.ceil(((formData.cost_price || 0) * (formData.initial_stock || 0)) / ((parseFloat(formData.price) || 1) - (formData.cost_price || 0)))} unités</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Inventaire */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-orange-500" />
                Stock
              </h2>
              {variants.length > 0 && (
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                  SOMME DES VARIANTES
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Quantité totale</label>
                <div className="relative">
                  <input
                    type="number"
                    value={variants.length > 0 ? variants.reduce((sum, v) => sum + (v.stock || 0), 0) : formData.stock_quantity}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData(prev => ({
                        ...prev,
                        stock_quantity: val,
                        initial_stock: parseInt(val) || 0
                      }))
                    }}
                    readOnly={variants.length > 0}
                    className={`w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none ${variants.length > 0 ? 'opacity-60 cursor-not-allowed bg-gray-950' : 'focus:border-orange-500'}`}
                  />
                  {variants.length > 0 && <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                Seuil d'alerte stock bas
              </label>
              <input
                type="number"
                value={formData.low_stock_threshold}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  low_stock_threshold: parseInt(e.target.value) || 0,
                }))}
                min="1"
                max="100"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Email d'alerte envoyé quand le stock descend en dessous de ce nombre
              </p>
            </div>
          </div>


          {/* Organisation */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Disponibilité géographique
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: 'worldwide',
                  icon: '🌍',
                  label: 'Mondial',
                  desc: 'Disponible partout',
                  color: 'border-blue-500/50',
                  activeColor: 'bg-blue-500/10 border-blue-500'
                },
                {
                  value: 'restricted',
                  icon: '🇨🇦',
                  label: 'Canada + USA',
                  desc: 'Stock local seulement',
                  color: 'border-orange-500/50',
                  activeColor: 'bg-orange-500/10 border-orange-500'
                }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    availability_type: opt.value,
                    available_countries: opt.value === 'worldwide' ? ['*'] : ['CA', 'US']
                  })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.availability_type === opt.value
                      ? opt.activeColor
                      : 'border-gray-800 hover:border-gray-700'
                    }`}
                >
                  <p className="text-2xl mb-2">{opt.icon}</p>
                  <p className="text-white font-black text-sm">{opt.label}</p>
                  <p className="text-gray-500 text-[10px] mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
            {formData.availability_type === 'restricted' && (
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-2">
                {formData.available_countries.map(c => (
                  <span key={c} className="bg-orange-500/10 text-orange-400 text-[10px] font-black px-2 py-1 rounded-lg border border-orange-500/20">
                    {c === 'CA' ? '🇨🇦 Canada' : c === 'US' ? '🇺🇸 USA' : c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-secondary" />Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Catégorie Principale</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.filter(c => !c.parent_id).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              
              {formData.category_id && categories.filter(c => c.parent_id === formData.category_id).length > 0 && (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Sous-catégorie (Optionnel)</label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary"
                  >
                    <option value="">Sélectionner une sous-catégorie</option>
                    {categories.filter(c => c.parent_id === formData.category_id).map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Étiquettes (Tags)</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {formData.tags.map(tag => (
                    <span key={tag} className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded flex items-center gap-1">
                      {tag}
                      <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}><Trash2 className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Ajouter tag..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none"
                  />
                  <button onClick={(e) => { e.preventDefault(); addTag() }} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-xl border border-gray-700 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

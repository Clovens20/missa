'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Save, Image as ImageIcon, 
  Plus, Trash2, Package, Tag, 
  DollarSign, Hash, Layers, X, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'
import { useRef } from 'react'
import ProductVariantsManager from '@/components/admin/ProductVariantsManager'
import RichTextEditor from '@/components/admin/RichTextEditor'
import UrgencySettings from '@/components/admin/UrgencySettings'
import { ProductImage } from '@/types'

interface ProductFormData {
  name: string
  slug: string
  description: string
  short_description: string
  price: string
  compare_price: string
  sku: string
  category_id: string
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
}

export default function EditProductPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [product, setProduct] = useState<any>(null)

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    sku: '',
    category_id: '',
    stock_quantity: '0',
    weight: '',
    is_active: true,
    is_featured: false,
    is_new: false,
    is_on_sale: false,
    tags: [] as string[],
    cost_price: 0,
    initial_stock: 0,
    low_stock_threshold: 5,
    colors: [] as string[],
    sizes: [] as string[],
    variant_images: {} as Record<string, ProductImage[]>,
    images: [] as ProductImage[]
  })

  const [imageUrl, setImageUrl] = useState('')
  const [additionalImages, setAdditionalImages] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const [catRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*').eq('id', id).single()
    ])

    setCategories(catRes.data || [])
    
    if (prodRes.data) {
      const p = prodRes.data
      setProduct(p)
      setFormData({
        name: p.name || '',
        slug: p.slug || '',
        description: p.description || '',
        short_description: p.short_description || '',
        price: p.price?.toString() || '',
        compare_price: p.compare_price?.toString() || '',
        sku: p.sku || '',
        category_id: p.category_id || '',
        stock_quantity: p.stock_quantity?.toString() || '0',
        weight: p.weight?.toString() || '',
        is_active: p.is_active ?? true,
        is_featured: p.is_featured ?? false,
        is_new: p.is_new ?? false,
        is_on_sale: p.is_on_sale ?? false,
        tags: p.tags || [],
        cost_price: p.cost_price || 0,
        initial_stock: p.initial_stock || 0,
        low_stock_threshold: p.low_stock_threshold || 5,
        colors: p.colors || [],
        sizes: p.sizes || [],
        variant_images: p.variant_images || {},
        images: p.images || []
      })
      setImageUrl(p.images?.[0]?.url || '')
      setAdditionalImages(p.images?.slice(1) || [])
      
      // Load variants and auto-fill SKUs if missing
      const baseSku = p.sku || 'PROD'
      const loadedVariants = (p.variants || []).map((v: any, index: number) => {
        const variant = { ...v, id: index.toString() }
        if (!variant.sku) {
          const sizePart = (variant.size || '').toUpperCase().replace(/\s+/g, '')
          const colorPart = (variant.color || '').toUpperCase().replace(/\s+/g, '')
          let gen = baseSku
          if (sizePart) gen += `-${sizePart}`
          if (colorPart) gen += `-${colorPart}`
          variant.sku = gen
        }
        return variant
      })
      setVariants(loadedVariants)
    }
    setLoading(false)
  }

  function regenerateAllSkus() {
    const baseSku = formData.sku || 'PROD'
    setVariants(variants.map(v => {
      const sizePart = (v.size || '').toUpperCase().replace(/\s+/g, '')
      const colorPart = (v.color || '').toUpperCase().replace(/\s+/g, '')
      let gen = baseSku
      if (sizePart) gen += `-${sizePart}`
      if (colorPart) gen += `-${colorPart}`
      return { ...v, sku: gen }
    }))
    toast.success('🪄 SKUs régénérés!')
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({ ...prev, name, slug: slugify(name) }))
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

  function removeVariant(vId: string) {
    setVariants(variants.filter(v => v.id !== vId))
  }

  function updateVariant(vId: string, field: string, value: any) {
    setVariants(variants.map(v => {
      if (v.id === vId) {
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
    setSaving(true)

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock_quantity: variants.length > 0 
          ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : parseInt(formData.stock_quantity),
        low_stock_threshold: formData.low_stock_threshold,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: formData.images || [],
        variants: variants.map(({ id: _, ...rest }) => ({
          ...rest,
          images: formData.variant_images?.[rest.color] || rest.images || []
        })),
        colors: formData.colors,
        sizes: formData.sizes,
        variant_images: formData.variant_images,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('products').update(productData).eq('id', id)
      if (error) throw error

      toast.success('🚀 Produit mis à jour!')
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5"/>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Modifier le produit</h1>
            <p className="text-gray-500 text-sm mt-0.5">{formData.name}</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-5 h-5"/>}
          Enregistrer les modifications
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-primary"/>Informations générales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Nom du produit</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
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
                    onChange={(e) => {
                      const newSku = e.target.value
                      setFormData({ ...formData, sku: newSku })
                      
                      // Auto-update all variants
                      setVariants(prev => prev.map(v => {
                        const sizePart = (v.size || '').toUpperCase().replace(/\s+/g, '')
                        const colorPart = (v.color || '').toUpperCase().replace(/\s+/g, '')
                        let gen = newSku || 'PROD'
                        if (sizePart) gen += `-${sizePart}`
                        if (colorPart) gen += `-${colorPart}`
                        return { ...v, sku: gen }
                      }))
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Description</label>
                <RichTextEditor 
                  value={formData.description}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  minHeight={250}
                />
              </div>
            </div>
          </div>

          <UrgencySettings
            product={product}
            table="products"
            onUpdate={loadData}
          />

          {/* 🎯 GESTION DES VARIANTES & IMAGES (PRO) */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-secondary"/>
              Variantes & Photos
            </h2>
            <ProductVariantsManager
              productName={formData.name || 'Produit'}
              productId={id as string}
              initialColors={formData.colors}
              initialSizes={formData.sizes}
              initialVariantImages={formData.variant_images}
              initialGeneralImages={formData.images || []}
              onChange={({ colors, sizes, variantImages, generalImages }) => {
                setFormData(prev => ({
                  ...prev,
                  colors,
                  sizes,
                  variant_images: variantImages,
                  images: generalImages
                }))
                
                // Sync the legacy variants array
                setVariants(prev => prev.filter(v => 
                  (colors.length === 0 || colors.includes(v.color)) &&
                  (sizes.length === 0 || sizes.includes(v.size))
                ))
              }}
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-orange-500"/>
                Stock par variante
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={regenerateAllSkus}
                  className="text-[10px] font-black bg-gray-900 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all flex items-center gap-1"
                >
                  🪄 Régénérer SKUs
                </button>
                <button onClick={addVariant} className="text-xs font-black bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3"/>Ajouter stock variant
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
                      <input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value))} className="w-full bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 ring-primary"/>
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
                    <button onClick={() => removeVariant(v.id)} className="p-2.5 text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm italic">Aucune variante ajoutée.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500"/>Tarification</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Prix</label>
                <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-black"/>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Prix barré</label>
                <input type="number" step="0.01" value={formData.compare_price} onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-400 line-through"/>
              </div>
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
                        // Synchroniser pour faciliter la correction
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

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-orange-500"/>
                Stock & Poids
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
                        initial_stock: parseInt(val) || 0 // Sync with initial stock for flexibility
                      }))
                    }}
                    readOnly={variants.length > 0}
                    className={`w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none ${variants.length > 0 ? 'opacity-60 cursor-not-allowed bg-gray-950' : 'focus:border-orange-500'}`}
                  />
                  {variants.length > 0 && <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"/>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Poids (kg)</label>
                <input 
                  type="number" step="0.001" value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400"/>
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


          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-secondary"/>Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Catégorie</label>
                <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white">
                  <option value="">Choisir...</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {formData.tags.map(tag => (
                    <span key={tag} className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded flex items-center gap-1">{tag}
                      <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}><Trash2 className="w-2.5 h-2.5"/></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Tag..." className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white"/>
                  <button onClick={(e) => { e.preventDefault(); addTag() }} className="bg-gray-800 text-white p-2 rounded-xl border border-gray-700"><Plus className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

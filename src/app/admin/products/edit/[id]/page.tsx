'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Save, Image as ImageIcon, 
  Plus, Trash2, Package, Tag, 
  DollarSign, Hash, Layers, X, AlertTriangle,
  Search, RefreshCw, Globe, Video, Upload, CheckCircle,
  Star, ArrowUp, Building2
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
    subcategory_id: '',
    wholesale_moq: '10',
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
    images: [] as ProductImage[],
    availability_type: 'worldwide',
    available_countries: ['*'],
    sold_count: 0
  })

  const [imageUrl, setImageUrl] = useState('')
  const [additionalImages, setAdditionalImages] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [defaultVariantStock, setDefaultVariantStock] = useState<number>(0)
  const [aiVideoGenerating, setAiVideoGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiPreset, setAiPreset] = useState('rotate')
  const [aiError, setAiError] = useState('')
  
  // Switch Supplier states
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [searchingSupplier, setSearchingSupplier] = useState<string | null>(null)
  const [supplierResults, setSupplierResults] = useState<any[]>([])
  const [switching, setSwitching] = useState(false)

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
        subcategory_id: p.subcategory_id || '',
        wholesale_moq: p.wholesale_moq?.toString() || '10',
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
        images: p.images || [],
        availability_type: p.availability_type || 'worldwide',
        available_countries: p.available_countries || ['*'],
        sold_count: p.sold_count || 0
      })
      setImageUrl(p.images?.[0]?.url || '')
      setAdditionalImages(p.images?.slice(1) || [])
      // Load video_urls array, fall back to legacy video_url
      const vurls: string[] = p.video_urls?.filter(Boolean) || []
      if (vurls.length === 0 && p.video_url) vurls.push(p.video_url)
      setVideoUrls(vurls)
      
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
      
      if (!res.ok) {
        const text = await res.text()
        if (text.includes('Request Entity') || res.status === 413) throw new Error('Fichier trop volumineux (Max 4.5MB)')
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

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingVideo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      
      if (!res.ok) {
        const text = await res.text()
        if (text.includes('Request Entity') || res.status === 413) throw new Error('Fichier trop volumineux (Max 4.5MB)')
        throw new Error("Erreur d'upload vidéo")
      }

      const data = await res.json()
      if (data.url) {
        setVideoUrls(prev => [...prev, data.url])
        toast.success('🎬 Vidéo ajoutée !')
      } else {
        throw new Error(data.error || "Erreur d'upload vidéo")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploadingVideo(false)
      if (videoFileRef.current) videoFileRef.current.value = ''
    }
  }

  async function generateAiVideo() {
    const referenceImage = imageUrl || product?.images?.[0]?.url || formData.images?.[0]?.url
    if (!referenceImage) {
      toast.error('Ajoutez d\'abord une image produit comme référence')
      return
    }
    setAiVideoGenerating(true)
    setAiError('')
    try {
      const res = await fetch('/api/admin/ai-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: referenceImage,
          productName: formData.name || 'produit',
          preset: aiPreset,
          duration: '5',
          aspectRatio: '1:1',
        }),
      })
      const data = await res.json()
      if (data.videoUrl) {
        setVideoUrls(prev => [...prev, data.videoUrl])
        setShowAiPanel(false)
        toast.success('🎬 Vidéo IA ajoutée !')
      } else {
        throw new Error(data.error || 'Erreur de génération')
      }
    } catch (err: any) {
      setAiError(err.message)
      toast.error(err.message)
    } finally {
      setAiVideoGenerating(false)
    }
  }

  function addTag() {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] })
      setCurrentTag('')
    }
  }

  async function searchOnSupplier(
    supplierKey: string,
    productName: string
  ) {
    setSearchingSupplier(supplierKey)
    setShowSwitchModal(true)
    setSupplierResults([])

    try {
      // For CJ we can use our existing search API
      const endpoint = supplierKey === 'cj' 
        ? `/api/cj/search?q=${encodeURIComponent(productName)}&page=1`
        : `/api/admin/${supplierKey}/search?q=${encodeURIComponent(productName)}&page=1`
      
      const res = await fetch(endpoint)
      const data = await res.json()

      const products = data.list || data.products || []
      setSupplierResults(products.slice(0, 5))
    } catch (err) {
      toast.error('Erreur de recherche fournisseur')
    } finally {
      setSearchingSupplier(null)
    }
  }

  async function switchSupplier(
    newProduct: any,
    supplierKey: string
  ) {
    setSwitching(true)
    
    try {
      const res = await fetch(
        `/api/admin/products/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            supplier: supplierKey,
            supplier_product_id:
              newProduct.id ||
              newProduct.cj_id ||
              newProduct.pid ||
              newProduct.productId,
            stock_quantity:
              newProduct.total_stock ||
              newProduct.stock || 
              newProduct.productStock || 99,
            cost_price:
              newProduct.price ||
              newProduct.cost_price ||
              newProduct.sellPrice ||
              newProduct.productPrice,
            is_active: true,
            last_stock_sync:
              new Date().toISOString(),
          }),
        }
      )

      if (res.ok) {
        toast.success(
          '✅ Fournisseur changé!',
          {
            description:
              `Produit réactivé via ${supplierKey.toUpperCase()}`,
          }
        )
        setShowSwitchModal(false)
        loadData() // Refresh product data
      } else {
        const err = await res.json()
        throw new Error(err.error || 'Erreur switch')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSwitching(false)
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
        wholesale_moq: parseInt(formData.wholesale_moq) || 10,
        subcategory_id: formData.subcategory_id || null,
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
        availability_type: formData.availability_type,
        available_countries: formData.available_countries,
        sold_count: formData.sold_count,
        video_urls: videoUrls.filter(Boolean),
        video_url: videoUrls[0] || null,
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
      {/* ── SWITCH SUPPLIER MODAL ── */}
      <AnimatePresence>
        {showSwitchModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Changer de fournisseur</h3>
                  <p className="text-gray-500 text-sm">Recherche sur {searchingSupplier?.toUpperCase()}</p>
                </div>
                <button onClick={() => setShowSwitchModal(false)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-gray-500"/>
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {searchingSupplier && supplierResults.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"/>
                    <p className="text-gray-400 font-bold">Recherche des meilleurs matchs...</p>
                  </div>
                )}

                {!searchingSupplier && supplierResults.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 italic">Aucun résultat trouvé pour "{formData.name}"</p>
                  </div>
                )}

                {supplierResults.map((res: any, idx: number) => (
                  <div key={idx} className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/50 transition-all">
                    <div className="w-20 h-20 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={res.productImage || res.image || res.url || res.product_image} 
                        alt={res.productNameEn || res.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm line-clamp-1">{res.productNameEn || res.name || res.productName}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Prix: <span className="text-secondary">${res.sellPrice || res.price || res.cost_price}</span>
                        {' '}· Stock: <span className="text-primary">{res.productStock || res.stock || res.total_stock || '99+'}</span>
                      </p>
                      <button 
                        onClick={() => switchSupplier(res, searchingSupplier || 'cj')}
                        disabled={switching}
                        className="mt-3 w-full bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-black py-2 rounded-lg border border-primary/20 transition-all flex items-center justify-center gap-2"
                      >
                        {switching ? <RefreshCw className="w-3 h-3 animate-spin"/> : 'Utiliser ce produit'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* ── SWITCH SUPPLIER FEATURE ── */}
      {(parseInt(formData.stock_quantity) === 0 || variants.reduce((sum, v) => sum + (v.stock || 0), 0) === 0) &&
        product?.supplier && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-3xl p-6 space-y-4 shadow-xl shadow-orange-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-orange-400"/>
            </div>
            <div>
              <p className="text-orange-400 font-black text-lg">Stock épuisé chez {product.supplier.toUpperCase()}</p>
              <p className="text-gray-400 text-sm">Ce produit est masqué sur le shop. Changez de fournisseur pour le réactiver.</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Trouver sur un autre fournisseur :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'cj', label: 'CJ Dropshipping', icon: '🔵', color: 'border-blue-500/30 hover:border-blue-500 text-blue-400' },
                { key: 'hypersku', label: 'HyperSKU', icon: '🟣', color: 'border-purple-500/30 hover:border-purple-500 text-purple-400' },
                { key: 'eprolo', label: 'Eprolo', icon: '🟢', color: 'border-green-500/30 hover:border-green-500 text-green-400' },
              ]
              .filter(s => s.key !== product.supplier)
              .map(supplier => (
                <button
                  key={supplier.key}
                  onClick={() => searchOnSupplier(supplier.key, formData.name)}
                  className={`flex items-center gap-3 bg-gray-950 border ${supplier.color} rounded-2xl p-4 text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98] group`}
                >
                  <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{supplier.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-400 font-bold group-hover:text-white transition-colors">{supplier.label}</p>
                    <p className="text-[9px] opacity-50">Search API</p>
                  </div>
                  <Search className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity"/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  value={defaultVariantStock} 
                  onChange={(e) => setDefaultVariantStock(parseInt(e.target.value) || 0)}
                  placeholder="Qté/variante" 
                  className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                />
                <button 
                  onClick={regenerateAllSkus}
                  className="text-[10px] font-black bg-gray-900 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all flex items-center gap-1"
                >
                  🪄 Régénérer SKUs
                </button>
                <button onClick={generateCombinations} className="text-xs font-black bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg border border-primary/20 transition-all flex items-center gap-1">
                  🪄 Générer combinaisons
                </button>
                <button onClick={addVariant} className="text-xs font-black bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3"/>Ajouter
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
            
            <p className="text-[11px] text-gray-400 mt-4">Entrez le prix en dollars canadiens (CAD)</p>

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
                  {variants.length > 0 && <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"/>}
                </div>
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
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400"/>
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
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    formData.availability_type === opt.value 
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

          {/* ── VIDEO PRODUIT ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400"/>
              Vidéo produit
            </h2>

            {/* ── VIDEO LIST ── */}
            {videoUrls.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Vidéos ({videoUrls.length})
                </p>
                {videoUrls.map((url, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden bg-black border border-gray-700 group">
                    <video src={url} controls className="w-full max-h-44 object-contain" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 ? (
                          <span className="flex items-center gap-1 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md border border-primary/20">
                            <Star className="w-3 h-3 fill-current text-yellow-300 animate-pulse" />
                            ⭐ Vidéo Principale
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...videoUrls];
                              const [selected] = updated.splice(idx, 1);
                              updated.unshift(selected);
                              setVideoUrls(updated);
                              toast.success('⭐ Vidéo définie comme principale ! Enregistrez pour sauvegarder.');
                            }}
                            className="flex items-center gap-1 bg-black/80 hover:bg-primary text-white hover:text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-gray-700 hover:border-primary transition-all shadow-sm"
                          >
                            <ArrowUp className="w-3 h-3 text-yellow-400" />
                            Définir comme principale
                          </button>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setVideoUrls(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors shadow-md"
                        title="Supprimer cette vidéo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone */}
            <input
              ref={videoFileRef}
              type="file"
              accept="video/mp4,video/webm,video/mov,video/avi,video/quicktime"
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload-input"
            />

            {/* Two action buttons: upload from PC or generate with AI */}
            <div className="grid grid-cols-2 gap-3">
              <label
                htmlFor="video-upload-input"
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all ${
                  uploadingVideo
                    ? 'border-purple-500/60 bg-purple-500/5'
                    : 'border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/5'
                }`}
              >
                {uploadingVideo ? (
                  <>
                    <div className="w-7 h-7 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"/>
                    <p className="text-purple-300 text-xs font-bold text-center">Upload...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-purple-400" />
                    <p className="text-white font-bold text-xs text-center">+ Ajouter une vidéo</p>
                    <p className="text-gray-500 text-[10px] text-center">MP4, MOV · Max 200 Mo</p>
                  </>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-fuchsia-700/50 hover:border-fuchsia-500 hover:bg-fuchsia-500/5 rounded-2xl p-5 transition-all cursor-pointer"
              >
                <span className="text-2xl">✨</span>
                <p className="text-white font-bold text-xs text-center">+ Générer avec l'IA</p>
                <p className="text-gray-500 text-[10px] text-center">Depuis l'image produit</p>
              </button>
            </div>

            {/* AI Generation Panel */}
            {showAiPanel && (
              <div className="bg-fuchsia-950/30 border border-fuchsia-700/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <div>
                    <p className="text-white font-black text-sm">Génération vidéo IA</p>
                    <p className="text-gray-400 text-xs">Utilise l'image principale du produit comme référence</p>
                  </div>
                </div>

                {/* Reference image preview */}
                {(imageUrl || product?.images?.[0]?.url) && (
                  <div className="flex items-center gap-3 bg-gray-900/60 rounded-xl p-3">
                    <img
                      src={imageUrl || product?.images?.[0]?.url}
                      alt="Référence"
                      className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                    />
                    <div>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wide">Image de référence</p>
                      <p className="text-white text-xs font-bold">{formData.name || 'Produit'}</p>
                    </div>
                  </div>
                )}

                {/* Motion preset selector */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Type de mouvement</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'rotate',    emoji: '🔄', label: 'Rotation 360°' },
                      { id: 'zoom',      emoji: '🔍', label: 'Zoom cinématique' },
                      { id: 'lifestyle', emoji: '🌟', label: 'Lifestyle usage' },
                      { id: 'float',     emoji: '✨', label: 'Flottement premium' },
                      { id: 'reveal',    emoji: '🎬', label: 'Révélation lumière' },
                      { id: 'hands',     emoji: '🤲', label: 'Mains & détail' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAiPreset(p.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          aiPreset === p.id
                            ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white'
                            : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span>{p.emoji}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {aiError && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    ❌ {aiError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={generateAiVideo}
                  disabled={aiVideoGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-3 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {aiVideoGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Génération en cours... (30–60 sec)
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Générer et ajouter la vidéo IA
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-600 text-center">
                  Propulsé par Kling AI v1.6 via FAL.AI · Génération en ~60 sec
                </p>
              </div>
            )}

            {/* Paste URL to add */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Coller un lien vidéo (mp4) et appuyer sur +"
                id="paste-video-url"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('paste-video-url') as HTMLInputElement
                  const val = input?.value?.trim()
                  if (val) { setVideoUrls(prev => [...prev, val]); input.value = '' }
                }}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-secondary"/>Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Catégorie Principale</label>
                <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white">
                  <option value="">Choisir...</option>
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

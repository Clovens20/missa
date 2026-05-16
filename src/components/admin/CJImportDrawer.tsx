'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import { 
  X, ChevronLeft, ChevronRight,
  Check, Trash2, Plus, Tag,
  DollarSign, Package, Image,
  Video, VideoOff, RefreshCw,
  Save, AlertCircle, Globe,
  Loader, Info, Edit3, TrendingUp, CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import SupplierMessagePanel from './SupplierMessagePanel'

interface CJImportDrawerProps {
  product: any | null
  onClose: () => void
  onImported: () => void
}

interface MediaItem {
  url: string
  type: 'main' | 'gallery' | 'variant'
  alt: string
  selected: boolean
}

export default function CJImportDrawer({
  product,
  onClose,
  onImported,
}: CJImportDrawerProps) {
  
  // Media state
  const [mediaLoading, setMediaLoading] = 
    useState(false)
  const [allImages, setAllImages] = 
    useState<MediaItem[]>([])
  const [video, setVideo] = 
    useState<string | null>(null)
  const [includeVideo, setIncludeVideo] = 
    useState(false)
  const [previewImg, setPreviewImg] = 
    useState<string | null>(null)

  // Product form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    sellingPrice: '',
    comparePrice: '',
    categoryId: '',
    tags: [] as string[],
    newTag: '',
  })

  // Categories
  const [categories, setCategories] = 
    useState<any[]>([])
  
  // Variants
  const [variants, setVariants] = 
    useState<any[]>([])
  const [activeTab, setActiveTab] = 
    useState<'images' | 'details' | 
      'variants' | 'pricing'>('images')
  
  const [importing, setImporting] = 
    useState(false)
  
  const [showMessagePanel, 
    setShowMessagePanel] = 
    useState(false)
  const [importedProductId, 
    setImportedProductId] = 
    useState<string>('')

  useEffect(() => {
    if (product) {
      loadProductMedia()
      loadCategories()
      prefillForm()
    }
  }, [product])

  async function loadProductMedia() {
    if (!product) return
    setMediaLoading(true)
    
    try {
      const pid = product.pid || 
        product.productId
      const res = await fetch(
        `/api/cj/media?pid=${pid}`
      )
      const data = await res.json()
      
      if (data.error) throw new Error(
        data.error
      )
      
      setAllImages(data.images || [])
      setVideo(data.video || null)
      
      // Set first image as preview
      if (data.images?.length > 0) {
        setPreviewImg(data.images[0].url)
      }

      // Pre-fill variants from detail
      if (data.variants?.length > 0) {
        setVariants(
          data.variants.map((v: any) => ({
            ...v,
            selected: true
          }))
        )
      }
      
    } catch (err: any) {
      toast.error(
        'Erreur chargement média: ' + 
        err.message
      )
    } finally {
      setMediaLoading(false)
    }
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    setCategories(data || [])
  }

  function prefillForm() {
    if (!product) return
    
    const cjPrice = parseFloat(
      product.sellPrice || 
      product.productPrice || 0
    )
    const suggestedPrice = 
      Math.ceil(cjPrice * 2.5 * 2) / 2
    
    setForm({
      name: product.productNameEn || 
        product.productName || '',
      description: 
        product.productDescription || 
        product.description || '',
      shortDescription: '',
      sellingPrice: 
        suggestedPrice.toFixed(2),
      comparePrice: 
        (suggestedPrice * 1.25)
          .toFixed(2),
      categoryId: '',
      tags: [
        product.categoryName
      ].filter(Boolean),
      newTag: '',
    })
  }

  function toggleImage(index: number) {
    setAllImages(prev => prev.map(
      (img, i) => i === index 
        ? { ...img, selected: !img.selected }
        : img
    ))
  }

  function selectAllImages() {
    setAllImages(prev => 
      prev.map(img => ({ 
        ...img, selected: true 
      }))
    )
  }

  function deselectAllImages() {
    setAllImages(prev => 
      prev.map((img, i) => ({ 
        ...img, 
        // Always keep at least first one
        selected: i === 0 
      }))
    )
  }

  function moveImageUp(index: number) {
    if (index === 0) return
    setAllImages(prev => {
      const arr = [...prev]
      ;[arr[index - 1], arr[index]] = 
        [arr[index], arr[index - 1]]
      return arr
    })
  }

  function moveImageDown(index: number) {
    if (index === allImages.length - 1) 
      return
    setAllImages(prev => {
      const arr = [...prev]
      ;[arr[index + 1], arr[index]] = 
        [arr[index], arr[index + 1]]
      return arr
    })
  }

  function addTag() {
    if (!form.newTag.trim()) return
    if (form.tags.includes(
      form.newTag.trim()
    )) return
    setForm(p => ({
      ...p,
      tags: [...p.tags, p.newTag.trim()],
      newTag: '',
    }))
  }

  function removeTag(tag: string) {
    setForm(p => ({
      ...p,
      tags: p.tags.filter(t => t !== tag),
    }))
  }

  const selectedImages = allImages.filter(
    img => img.selected
  )
  const cjPrice = parseFloat(
    product?.sellPrice || 
    product?.productPrice || 0
  )
  const profit = parseFloat(
    form.sellingPrice || '0'
  ) - cjPrice

  async function handleImport() {
    if (!product) return
    
    if (!form.name.trim()) {
      toast.error('Le nom est requis')
      setActiveTab('details')
      return
    }
    if (!form.sellingPrice || 
      parseFloat(form.sellingPrice) <= 0) {
      toast.error('Le prix de vente est requis')
      setActiveTab('pricing')
      return
    }
    if (selectedImages.length === 0) {
      toast.error('Sélectionnez au moins 1 image')
      setActiveTab('images')
      return
    }

    setImporting(true)
    try {
      const pid = product.pid || 
        product.productId
      
      const res = await fetch(
        '/api/cj/import',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 
              'application/json' 
          },
          body: JSON.stringify({
            pid,
            sellingPrice: parseFloat(
              form.sellingPrice
            ),
            comparePrice: parseFloat(
              form.comparePrice || 
              form.sellingPrice
            ),
            categoryId: 
              form.categoryId || undefined,
            customName: form.name,
            customDescription: 
              form.description,
            selectedImages: 
              selectedImages.map(
                img => img.url
              ),
            includeVideo,
            tags: form.tags,
            variants: variants.filter(
              v => v.selected
            ),
          }),
        }
      )

      const data = await res.json()

      if (data.error) {
        if (res.status === 409) {
          toast.error(
            'Ce produit est déjà importé!'
          )
        } else {
          throw new Error(data.error)
        }
        return
      }

      toast.success(
        `✅ "${form.name}" importé!`
      )
      
      setImportedProductId(
        data.product.cj_product_id
      )
      setShowMessagePanel(true)
      onImported()
      // Don't close yet, let user send message
      
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setImporting(false)
    }
  }

  if (!product) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 
          bg-black/80 backdrop-blur-sm 
          z-50 flex"
        onClick={e => {
          if (e.target === e.currentTarget) 
            onClose()
        }}>
        
        {/* Drawer — slides from right */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ 
            type: 'spring', 
            damping: 30 
          }}
          className="ml-auto w-full 
            max-w-4xl h-full bg-gray-950 
            flex flex-col overflow-hidden
            border-l border-gray-800">
          
          {/* ── HEADER ── */}
          <div className="flex items-center 
            justify-between px-6 py-4 
            border-b border-gray-800 
            bg-gray-900 flex-shrink-0">
            <div className="flex items-center 
              gap-3">
              <div className="w-10 h-10 
                bg-blue-500/20 rounded-xl 
                flex items-center 
                justify-center">
                <Globe className="w-5 h-5 
                  text-blue-400"/>
              </div>
              <div>
                <h2 className="font-black 
                  text-white text-lg">
                  Importer de CJDropshipping
                </h2>
                <p className="text-gray-500 
                  text-xs">
                  Configurez le produit 
                  avant de l'importer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 
                rounded-xl text-gray-400 
                hover:text-white 
                transition-colors">
              <X className="w-6 h-6"/>
            </button>
          </div>

          {/* ── TABS ── */}
          <div className="flex border-b 
            border-gray-800 bg-gray-900 
            flex-shrink-0 px-6">
            {([
              ['images', 
               `🖼️ Images (${selectedImages.length}/${allImages.length})`],
              ['details', '📝 Détails'],
              ['pricing', '💰 Prix & Catégorie'],
              ['variants', 
               `🎨 Variantes (${variants.filter(v => v.selected).length})`],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => 
                  setActiveTab(tab)}
                className={`px-4 py-3 
                  text-sm font-bold 
                  border-b-2 -mb-px 
                  transition-all 
                  whitespace-nowrap
                  ${activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                  }`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── CONTENT ── */}
          <div className="flex-1 
            overflow-y-auto p-6">

            {/* ── TAB: IMAGES ── */}
            {activeTab === 'images' && (
              <div className="space-y-5">
                
                {mediaLoading ? (
                  <div className="flex flex-col 
                    items-center justify-center 
                    py-20 gap-4">
                    <Loader className="w-10 h-10 
                      text-primary animate-spin"/>
                    <p className="text-gray-400">
                      Chargement des médias 
                      depuis CJ...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Image preview + controls */}
                    <div className="grid 
                      grid-cols-3 gap-4">
                      
                      {/* Main preview */}
                      <div className="col-span-1">
                        <div className="aspect-square 
                          rounded-2xl overflow-hidden 
                          bg-gray-800 border-2 
                          border-primary/30 mb-3">
                          {previewImg ? (
                            <img
                              src={previewImg}
                              alt="Preview"
                              className="w-full h-full 
                                object-contain"
                            />
                          ) : (
                            <div className="w-full 
                              h-full flex items-center 
                              justify-center">
                              <Image className="w-12 
                                h-12 text-gray-700"/>
                            </div>
                          )}
                        </div>
                        <p className="text-xs 
                          text-gray-500 
                          text-center">
                          Image principale
                        </p>
                      </div>

                      {/* Stats + controls */}
                      <div className="col-span-2 
                        space-y-4">
                        
                        {/* Stats */}
                        <div className="grid 
                          grid-cols-3 gap-3">
                          {[
                            { 
                              label: 'Total', 
                              value: allImages.length,
                              color: 'text-white'
                            },
                            { 
                              label: 'Sélectionnées', 
                              value: selectedImages.length,
                              color: 'text-secondary'
                            },
                            { 
                              label: 'Ignorées', 
                              value: allImages.length - selectedImages.length,
                              color: 'text-gray-500'
                            },
                          ].map(s => (
                            <div key={s.label}
                              className="bg-gray-800 
                                rounded-xl p-3 
                                text-center">
                              <p className={`text-2xl 
                                font-black 
                                ${s.color}`}>
                                {s.value}
                              </p>
                              <p className="text-xs 
                                text-gray-500 mt-0.5">
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Quick actions */}
                        <div className="flex 
                          gap-2 flex-wrap">
                          <button
                            onClick={selectAllImages}
                            className="flex items-center 
                              gap-1.5 px-3 py-2 
                              bg-secondary/20 
                              hover:bg-secondary/30 
                              text-secondary 
                              rounded-xl text-xs 
                              font-bold 
                              transition-colors">
                            <Check className="w-3 h-3"/>
                            Tout sélectionner
                          </button>
                          <button
                            onClick={deselectAllImages}
                            className="flex items-center 
                              gap-1.5 px-3 py-2 
                              bg-gray-800 
                              hover:bg-gray-700 
                              text-gray-400 
                              rounded-xl text-xs 
                              font-bold 
                              transition-colors">
                            <X className="w-3 h-3"/>
                            Désélectionner tout
                          </button>
                        </div>

                        {/* Info */}
                        <div className="bg-blue-500/10 
                          border border-blue-500/30 
                          rounded-xl p-3 
                          flex gap-2">
                          <Info className="w-4 h-4 
                            text-blue-400 
                            flex-shrink-0 mt-0.5"/>
                          <p className="text-blue-300 
                            text-xs leading-relaxed">
                            <strong>
                              Images cochées ✅
                            </strong>
                            {' '}= importées sur Missa Shop
                            <br/>
                            <strong>
                              Images décochées
                            </strong>
                            {' '}= ignorées (jamais copiées)
                            <br/>
                            La <strong>
                              1ère image sélectionnée
                            </strong>
                            {' '}sera l'image principale
                            du produit.
                          </p>
                        </div>

                        {/* Video section */}
                        {video && (
                          <div className={`
                            flex items-center 
                            justify-between p-4 
                            rounded-xl border 
                            transition-all
                            ${includeVideo
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-gray-800 border-gray-700'
                            }`}>
                            <div className="flex 
                              items-center gap-3">
                              {includeVideo 
                                ? <Video 
                                    className="w-5 h-5 
                                      text-primary"/> 
                                : <VideoOff 
                                    className="w-5 h-5 
                                      text-gray-500"/>
                              }
                              <div>
                                <p className="text-sm 
                                  font-bold text-white">
                                  Vidéo produit CJ
                                </p>
                                <p className="text-xs 
                                  text-gray-500">
                                  Disponible sur CJ
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => 
                                setIncludeVideo(
                                  !includeVideo
                                )}
                              className={`relative 
                                w-12 h-6 rounded-full 
                                transition-all
                                ${includeVideo 
                                  ? 'bg-primary' 
                                  : 'bg-gray-600'}`}>
                              <span className={`
                                absolute top-1 w-4 h-4 
                                bg-white rounded-full 
                                shadow transition-all
                                ${includeVideo 
                                  ? 'left-7' 
                                  : 'left-1'}`}/>
                            </button>
                          </div>
                        )}

                        {!video && (
                          <div className="flex 
                            items-center gap-2 
                            text-xs text-gray-600">
                            <VideoOff className="w-4 h-4"/>
                            Aucune vidéo disponible 
                            pour ce produit
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Images grid */}
                    <div>
                      <div className="flex 
                        items-center 
                        justify-between mb-3">
                        <h3 className="font-bold 
                          text-white text-sm">
                          Toutes les images 
                          CJDropshipping
                        </h3>
                        <div className="flex 
                          gap-2 text-xs 
                          text-gray-500">
                          <span className="flex 
                            items-center gap-1">
                            <span className="w-2 h-2 
                              bg-secondary 
                              rounded-full"/>
                            Principale
                          </span>
                          <span className="flex 
                            items-center gap-1">
                            <span className="w-2 h-2 
                              bg-blue-400 
                              rounded-full"/>
                            Galerie
                          </span>
                          <span className="flex 
                            items-center gap-1">
                            <span className="w-2 h-2 
                              bg-purple-400 
                              rounded-full"/>
                            Variante
                          </span>
                        </div>
                      </div>

                      <div className="grid 
                        grid-cols-4 sm:grid-cols-5 
                        md:grid-cols-6 
                        lg:grid-cols-8 gap-2">
                        {allImages.map(
                          (img, i) => (
                          <div key={i}
                            className="relative 
                              group">
                            
                            {/* Image */}
                            <div
                              onClick={() => {
                                toggleImage(i)
                                setPreviewImg(
                                  img.url
                                )
                              }}
                              className={`
                                aspect-square 
                                rounded-xl 
                                overflow-hidden 
                                cursor-pointer 
                                border-2 
                                transition-all
                                ${img.selected
                                  ? 'border-secondary shadow-md shadow-secondary/20'
                                  : 'border-gray-700 opacity-40 grayscale'
                                }
                                ${previewImg === img.url
                                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-gray-950'
                                  : ''
                                }`}>
                              <img
                                src={img.url}
                                alt={img.alt}
                                className="w-full 
                                  h-full 
                                  object-cover"
                              />
                              
                              {/* Selected checkmark */}
                              {img.selected && (
                                <div className="absolute 
                                  top-1 right-1 
                                  w-5 h-5 
                                  bg-secondary 
                                  rounded-full flex 
                                  items-center 
                                  justify-center 
                                  shadow-md">
                                  <Check 
                                    className="w-3 h-3 
                                      text-white"/>
                                </div>
                              )}

                              {/* Type badge */}
                              <div className={`
                                absolute bottom-1 
                                left-1 w-2 h-2 
                                rounded-full
                                ${img.type === 'main' 
                                  ? 'bg-secondary' 
                                  : img.type === 'gallery'
                                    ? 'bg-blue-400'
                                    : 'bg-purple-400'
                                }`}/>

                              {/* Primary badge */}
                              {i === 0 && 
                                img.selected && (
                                <div className="absolute 
                                  top-1 left-1 
                                  bg-primary text-white 
                                  text-[8px] font-black 
                                  px-1 rounded">
                                  #1
                                </div>
                              )}
                            </div>

                            {/* Reorder buttons */}
                            <div className="absolute 
                              -left-1 top-1/2 
                              -translate-y-1/2 
                              flex flex-col gap-0.5 
                              opacity-0 
                              group-hover:opacity-100 
                              transition-opacity">
                              <button
                                onClick={() => 
                                  moveImageUp(i)}
                                className="w-4 h-4 
                                  bg-gray-800 
                                  text-white 
                                  rounded-sm text-[10px] 
                                  flex items-center 
                                  justify-center 
                                  hover:bg-gray-700">
                                ↑
                              </button>
                              <button
                                onClick={() => 
                                  moveImageDown(i)}
                                className="w-4 h-4 
                                  bg-gray-800 
                                  text-white 
                                  rounded-sm text-[10px] 
                                  flex items-center 
                                  justify-center 
                                  hover:bg-gray-700">
                                ↓
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs 
                        text-gray-600 mt-3">
                        Cliquez sur une image 
                        pour la sélectionner / 
                        désélectionner. 
                        Utilisez ↑↓ pour 
                        réorganiser l'ordre.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── TAB: DETAILS ── */}
            {activeTab === 'details' && (
              <div className="space-y-5">
                
                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Nom du produit *
                    <span className="text-gray-500 
                      font-normal ml-2 text-xs">
                      (Modifiez si nécessaire)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => 
                      setForm(p => ({
                        ...p, 
                        name: e.target.value
                      }))}
                    className="w-full px-4 py-3 
                      bg-gray-800 border 
                      border-gray-700 rounded-xl 
                      text-white text-sm 
                      focus:border-primary 
                      focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Description courte
                    <span className="text-gray-500 
                      font-normal ml-2 text-xs">
                      (Affichée sur la carte produit)
                    </span>
                  </label>
                  <textarea
                    value={form.shortDescription}
                    onChange={e => 
                      setForm(p => ({
                        ...p, 
                        shortDescription: 
                          e.target.value
                      }))}
                    placeholder="1-2 phrases résumant le produit..."
                    rows={2}
                    className="w-full px-4 py-3 
                      bg-gray-800 border 
                      border-gray-700 rounded-xl 
                      text-white text-sm 
                      focus:border-primary 
                      focus:outline-none 
                      resize-none"
                  />
                  <p className="text-xs 
                    text-gray-600 mt-1">
                    {form.shortDescription.length}
                    /150 caractères recommandés
                  </p>
                </div>

                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Description complète
                    <span className="text-gray-500 
                      font-normal ml-2 text-xs">
                      (Page détail produit)
                    </span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => 
                      setForm(p => ({
                        ...p, 
                        description: 
                          e.target.value
                      }))}
                    placeholder="Description détaillée: matériaux, dimensions, caractéristiques..."
                    rows={8}
                    className="w-full px-4 py-3 
                      bg-gray-800 border 
                      border-gray-700 rounded-xl 
                      text-white text-sm 
                      focus:border-primary 
                      focus:outline-none 
                      resize-y font-mono 
                      leading-relaxed"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Tags
                    <span className="text-gray-500 
                      font-normal ml-2 text-xs">
                      (Pour la recherche)
                    </span>
                  </label>
                  
                  {/* Tags list */}
                  <div className="flex flex-wrap 
                    gap-2 mb-3 min-h-[36px] 
                    p-3 bg-gray-800 rounded-xl 
                    border border-gray-700">
                    {form.tags.length === 0 ? (
                      <span className="text-gray-600 
                        text-sm">
                        Aucun tag...
                      </span>
                    ) : (
                      form.tags.map(tag => (
                        <span key={tag}
                          className="flex 
                            items-center gap-1.5 
                            bg-primary/20 
                            text-primary text-xs 
                            font-bold px-3 py-1 
                            rounded-full">
                          {tag}
                          <button
                            onClick={() => 
                              removeTag(tag)}
                            className="hover:text-red-400 
                              transition-colors">
                            <X className="w-3 h-3"/>
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  
                  {/* Add tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.newTag}
                      onChange={e => 
                        setForm(p => ({
                          ...p, 
                          newTag: e.target.value
                        }))}
                      onKeyDown={e => 
                        e.key === 'Enter' && 
                        addTag()}
                      placeholder="Ex: femme, été, casual..."
                      className="flex-1 px-4 py-2 
                        bg-gray-800 border 
                        border-gray-700 rounded-xl 
                        text-white text-sm 
                        focus:border-primary 
                        focus:outline-none"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 
                        bg-primary/20 
                        hover:bg-primary/30 
                        text-primary font-bold 
                        rounded-xl text-sm 
                        transition-colors">
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: PRICING ── */}
            {activeTab === 'pricing' && (
              <div className="space-y-5">
                
                {/* CJ Cost info */}
                <div className="bg-gray-800 
                  rounded-2xl p-5">
                  <p className="text-xs 
                    text-gray-500 font-bold 
                    uppercase tracking-wide 
                    mb-3">
                    Coût d'achat CJ
                  </p>
                  <div className="flex items-end 
                    gap-2">
                    <span className="text-3xl 
                      font-black text-white">
                      {formatPrice(cjPrice)}
                    </span>
                    <span className="text-gray-500 
                      text-sm mb-1">
                      / unité chez CJDropshipping
                    </span>
                  </div>
                </div>

                {/* Selling price */}
                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Prix de vente sur Missa Shop *
                  </label>
                  <div className="relative">
                    <span className="absolute 
                      left-4 top-1/2 
                      -translate-y-1/2 
                      text-gray-400 font-bold 
                      text-lg">$</span>
                    <input
                      type="number"
                      value={form.sellingPrice}
                      onChange={e => 
                        setForm(p => ({
                          ...p, 
                          sellingPrice: 
                            e.target.value
                        }))}
                      step="0.50"
                      min="0"
                      className="w-full pl-8 
                        pr-4 py-4 bg-gray-800 
                        border border-gray-700 
                        rounded-xl text-white 
                        text-xl font-black 
                        focus:border-primary 
                        focus:outline-none"
                    />
                  </div>
                </div>

                {/* Compare price */}
                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Prix barré / Prix comparatif
                    <span className="text-gray-500 
                      font-normal ml-2 text-xs">
                      (optionnel — crée l'urgence)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute 
                      left-4 top-1/2 
                      -translate-y-1/2 
                      text-gray-400 font-bold 
                      text-lg">$</span>
                    <input
                      type="number"
                      value={form.comparePrice}
                      onChange={e => 
                        setForm(p => ({
                          ...p, 
                          comparePrice: 
                            e.target.value
                        }))}
                      step="0.50"
                      min="0"
                      className="w-full pl-8 
                        pr-4 py-3 bg-gray-800 
                        border border-gray-700 
                        rounded-xl text-white 
                        text-lg 
                        focus:border-primary 
                        focus:outline-none"
                    />
                  </div>
                </div>

                {/* Profit calculator */}
                {form.sellingPrice && (
                  <div className={`
                    rounded-2xl p-5 
                    border transition-all
                    ${profit > 0 
                      ? 'bg-secondary/10 border-secondary/30' 
                      : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    <p className="text-xs 
                      font-bold text-gray-400 
                      uppercase tracking-wide 
                      mb-4">
                      Calculateur de profit
                    </p>
                    <div className="space-y-2 
                      text-sm">
                      <div className="flex 
                        justify-between 
                        text-gray-400">
                        <span>Prix de vente:</span>
                        <span className="text-white 
                          font-bold">
                          {formatPrice(parseFloat(
                            form.sellingPrice || '0'
                          ))}
                        </span>
                      </div>
                      <div className="flex 
                        justify-between 
                        text-gray-400">
                        <span>Coût CJ:</span>
                        <span className="text-red-400 
                          font-bold">
                          -{formatPrice(cjPrice)}
                        </span>
                      </div>
                      {form.comparePrice && (
                        <div className="flex 
                          justify-between 
                          text-gray-400">
                          <span>
                            Réduction affichée:
                          </span>
                          <span className="text-primary 
                            font-bold">
                            {Math.round(
                              (1 - parseFloat(
                                form.sellingPrice
                              ) / parseFloat(
                                form.comparePrice
                              )) * 100
                            )}% off
                          </span>
                        </div>
                      )}
                      <div className="flex 
                        justify-between 
                        font-black text-xl 
                        pt-2 border-t 
                        border-gray-700">
                        <span className="text-white">
                          Profit net:
                        </span>
                        <span className={profit > 0 
                          ? 'text-secondary' 
                          : 'text-red-400'}>
                          {profit > 0 ? '+' : ''}
                          {formatPrice(profit)}
                        </span>
                      </div>
                    </div>
                    
                    {profit > 0 && (
                      <div className="mt-3 
                        text-xs text-secondary">
                        🎯 Marge: {Math.round(
                          (profit / parseFloat(
                            form.sellingPrice || '1'
                          )) * 100
                        )}% 
                        · {Math.round(
                          profit / cjPrice * 100
                        )}% ROI
                      </div>
                    )}
                    
                    {profit <= 0 && (
                      <p className="text-red-400 
                        text-xs mt-2 flex 
                        items-center gap-1">
                        <AlertCircle 
                          className="w-3 h-3"/>
                        Prix trop bas! 
                        Augmentez le prix 
                        de vente.
                      </p>
                    )}
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="block 
                    text-sm font-bold 
                    text-gray-300 mb-2">
                    Catégorie Missa Shop
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={e => 
                      setForm(p => ({
                        ...p, 
                        categoryId: e.target.value
                      }))}
                    className="w-full px-4 py-3 
                      bg-gray-800 border 
                      border-gray-700 rounded-xl 
                      text-white text-sm 
                      focus:border-primary 
                      focus:outline-none">
                    <option value="">
                      Sans catégorie
                    </option>
                    {categories.map(cat => (
                      <option 
                        key={cat.id} 
                        value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── TAB: VARIANTS ── */}
            {activeTab === 'variants' && (
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-center 
                  justify-between">
                  <div>
                    <h3 className="font-bold 
                      text-white">
                      Toutes les variantes CJ
                    </h3>
                    <p className="text-gray-500 
                      text-xs mt-0.5">
                      {variants.filter(
                        v => v.selected
                      ).length} sélectionnées 
                      sur {variants.length} 
                      disponibles
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => 
                        setVariants(p => 
                          p.map(v => ({
                            ...v, selected: true
                          }))
                        )}
                      className="text-xs 
                        bg-secondary/20 
                        text-secondary 
                        px-3 py-1.5 rounded-xl 
                        font-bold transition-colors 
                        hover:bg-secondary/30">
                      ✅ Tout garder
                    </button>
                    <button
                      onClick={() => 
                        setVariants(p => 
                          p.map(v => ({
                            ...v, selected: false
                          }))
                        )}
                      className="text-xs 
                        bg-gray-800 text-gray-400 
                        px-3 py-1.5 rounded-xl 
                        font-bold transition-colors 
                        hover:bg-gray-700">
                      ✗ Tout désélectionner
                    </button>
                  </div>
                </div>

                {/* Variants stats bar */}
                <div className="grid grid-cols-3 
                  gap-3">
                  {[
                    { 
                      label: 'Total CJ', 
                      value: variants.length,
                      color: 'text-white',
                      bg: 'bg-gray-800'
                    },
                    { 
                      label: 'Sélectionnées', 
                      value: variants.filter(
                        v => v.selected
                      ).length,
                      color: 'text-secondary',
                      bg: 'bg-secondary/10'
                    },
                    { 
                      label: 'Ignorées', 
                      value: variants.filter(
                        v => !v.selected
                      ).length,
                      color: 'text-red-400',
                      bg: 'bg-red-500/10'
                    },
                  ].map((s, i) => (
                    <div key={i}
                      className={`${s.bg} 
                        rounded-xl p-3 text-center`}>
                      <p className={`text-2xl 
                        font-black ${s.color}`}>
                        {s.value}
                      </p>
                      <p className="text-xs 
                        text-gray-500 mt-0.5">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Group by type */}
                {(() => {
                  // Group variants by color
                  const byColor = variants.reduce(
                    (acc: any, v) => {
                      const key = v.color || 'Sans couleur'
                      if (!acc[key]) acc[key] = []
                      acc[key].push(v)
                      return acc
                    }, {}
                  )

                  return Object.entries(byColor).map(
                    ([color, colorVariants]: any) => (
                    <div key={color}
                      className="bg-gray-800/50 
                        rounded-2xl overflow-hidden 
                        border border-gray-700">
                      
                      {/* Color group header */}
                      <div className="flex items-center 
                        justify-between px-4 py-3 
                        bg-gray-800 border-b 
                        border-gray-700">
                        <div className="flex items-center 
                          gap-3">
                          {/* Color swatch if available */}
                          {colorVariants[0]?.properties
                            ?.find((p: any) => 
                              p.name?.toLowerCase()
                                .includes('color')
                            )?.image && (
                            <div className="w-6 h-6 
                              rounded-full overflow-hidden 
                              border-2 border-gray-600">
                              <img
                                src={colorVariants[0]
                                  .properties.find(
                                    (p: any) => 
                                      p.name?.toLowerCase()
                                        .includes('color')
                                  )?.image}
                                alt={color}
                                className="w-full h-full 
                                  object-cover"
                              />
                            </div>
                          )}
                          <span className="font-bold 
                            text-white text-sm">
                            {color}
                          </span>
                          <span className="text-xs 
                            text-gray-500">
                            {colorVariants.filter(
                              (v: any) => v.selected
                            ).length}/{colorVariants.length}
                            {' '}tailles
                          </span>
                        </div>
                        
                        {/* Select/deselect all in group */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const vids = colorVariants
                                .map((v: any) => v.vid)
                              setVariants(prev => 
                                prev.map(v => 
                                  vids.includes(v.vid)
                                    ? { ...v, selected: true }
                                    : v
                                )
                              )
                            }}
                            className="text-[10px] 
                              text-secondary 
                              hover:underline font-bold">
                            Tout ✅
                          </button>
                          <button
                            onClick={() => {
                              const vids = colorVariants
                                .map((v: any) => v.vid)
                              setVariants(prev => 
                                prev.map(v => 
                                  vids.includes(v.vid)
                                    ? { ...v, selected: false }
                                    : v
                                )
                              )
                            }}
                            className="text-[10px] 
                              text-red-400 
                              hover:underline font-bold">
                            Tout ✗
                          </button>
                        </div>
                      </div>

                      {/* Sizes in this color */}
                      <div className="p-3 flex flex-wrap 
                        gap-2">
                        {colorVariants.map(
                          (v: any, i: number) => (
                          <div key={v.vid || i}
                            className="relative group">
                            
                            {/* Variant image preview */}
                            {v.image && (
                              <div className="absolute 
                                -top-16 left-1/2 
                                -translate-x-1/2 
                                w-14 h-14 
                                rounded-xl overflow-hidden 
                                bg-gray-700 shadow-xl 
                                z-20 hidden 
                                group-hover:block 
                                border-2 border-primary">
                                <img
                                  src={v.image}
                                  alt={v.size || 'variant'}
                                  className="w-full h-full 
                                    object-cover"
                                />
                              </div>
                            )}

                            <button
                              onClick={() => 
                                setVariants(prev => 
                                  prev.map(x => 
                                    x.vid === v.vid
                                      ? { 
                                          ...x, 
                                          selected: !x.selected 
                                        }
                                      : x
                                  )
                                )}
                              className={`
                                min-w-[48px] h-10 px-3 
                                rounded-xl border-2 
                                text-xs font-bold 
                                transition-all
                                flex flex-col items-center 
                                justify-center gap-0.5
                                ${v.selected
                                  ? 'bg-secondary/20 border-secondary text-secondary'
                                  : 'bg-gray-900 border-gray-700 text-gray-500'
                                }
                                ${v.stock === 0
                                  ? 'opacity-40 grayscale cursor-not-allowed border-red-500/30'
                                  : 'hover:scale-105 cursor-pointer'
                                }`}
                              title={`Stock: ${v.stock} | Prix CJ: $${v.cjPrice}`}
                              disabled={v.stock === 0}>
                              
                              <span className="line-clamp-1">
                                {v.size || v.style || v.sku?.substring(0, 6) || `V${i+1}`}
                              </span>
                              
                              <span className={`text-[8px] font-black uppercase
                                ${v.stock > 10 ? 'text-emerald-400' : v.stock > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                                {v.stock > 0 ? `${v.stock} dispo` : 'Épuisé'}
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Stock info per color */}
                      <div className="px-4 pb-3 
                        flex flex-wrap gap-x-4 gap-y-1">
                        {colorVariants.map(
                          (v: any, i: number) => 
                          v.selected && (
                          <div key={i} className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-gray-500">{v.size || 'Uniq'}:</span>
                            <span className={`font-black ${v.stock > 10 ? 'text-emerald-400' : v.stock > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                              {v.stock > 0 ? `${v.stock} en stock` : 'Épuisé'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}

                {/* Info */}
                <div className="bg-blue-500/10 
                  border border-blue-500/30 
                  rounded-xl p-3 flex gap-2">
                  <Info className="w-4 h-4 
                    text-blue-400 flex-shrink-0"/>
                  <p className="text-blue-300 
                    text-xs leading-relaxed">
                    Seules les variantes 
                    <strong> sélectionnées (colorées)</strong>
                    {' '}seront importées et disponibles 
                    à l'achat. Vous pourrez modifier 
                    cette sélection après l'import 
                    dans la page produit.
                  </p>
                </div>
              </div>
            )}
          </div>

          {showMessagePanel && (
            <div className="border-t 
              border-gray-800 p-6">
              <div className="flex items-center 
                justify-between mb-4">
                <h3 className="font-black 
                  text-white flex items-center 
                  gap-2">
                  <CheckCircle className="w-5 h-5 
                    text-secondary"/>
                  Produit importé! 
                  Envoyer les instructions?
                </h3>
                <button
                  onClick={() => {
                    setShowMessagePanel(false)
                    onClose()
                  }}
                  className="text-gray-500 
                    hover:text-white text-sm 
                    transition-colors">
                  Ignorer →
                </button>
              </div>
              <SupplierMessagePanel
                cjProductId={importedProductId}
                productName={form.name}
                mode="compact"
                onMessageSent={() => {
                  setTimeout(() => {
                    onClose()
                  }, 1500)
                }}
              />
            </div>
          )}

          {/* ── FOOTER ── */}
          <div className="border-t 
            border-gray-800 p-5 
            bg-gray-900 flex-shrink-0">
            
            {/* Summary bar */}
            <div className="flex items-center 
              gap-4 mb-4 bg-gray-800 
              rounded-xl p-3 text-sm">
              <div className="flex items-center 
                gap-1.5">
                <Image className="w-4 h-4 
                  text-secondary"/>
                <span className="text-secondary 
                  font-bold">
                  {selectedImages.length}
                </span>
                <span className="text-gray-500">
                  images
                </span>
              </div>
              <span className="text-gray-700">·</span>
              <div className="flex items-center 
                gap-1.5">
                <Package className="w-4 h-4 
                  text-blue-400"/>
                <span className="text-blue-400 
                  font-bold">
                  {variants.filter(
                    v => v.selected
                  ).length}
                </span>
                <span className="text-gray-500">
                  variantes
                </span>
              </div>
              <span className="text-gray-700">·</span>
              <div className="flex items-center 
                gap-1.5">
                <DollarSign className="w-4 h-4 
                  text-primary"/>
                <span className="text-primary 
                  font-bold">
                  {formatPrice(parseFloat(
                    form.sellingPrice || '0'
                  ))}
                </span>
              </div>
              {profit > 0 && (
                <>
                  <span className="text-gray-700">·</span>
                  <div className="flex items-center 
                    gap-1.5">
                    <TrendingUp className="w-4 h-4 
                      text-secondary"/>
                    <span className="text-secondary 
                      font-bold">
                      +{formatPrice(profit)}
                      /vente
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 
                  border border-gray-700 
                  text-gray-400 
                  hover:text-white 
                  rounded-xl font-bold 
                  text-sm 
                  transition-colors">
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={importing || 
                  mediaLoading || 
                  selectedImages.length === 0 ||
                  !form.name ||
                  !form.sellingPrice}
                className="flex-1 flex items-center 
                  justify-center gap-2 
                  bg-primary 
                  hover:bg-primary-dark 
                  text-white font-black py-3 
                  rounded-xl text-base 
                  transition-all 
                  shadow-xl 
                  shadow-primary/30 
                  disabled:opacity-40 
                  active:scale-[0.98]">
                {importing ? (
                  <>
                    <Loader className="w-5 h-5 
                      animate-spin"/>
                    Importation en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5"/>
                    Importer sur Missa Shop
                    <span className="text-white/60 
                      text-sm font-normal">
                      (masqué)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

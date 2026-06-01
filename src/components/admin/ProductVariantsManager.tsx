'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Upload, Image as ImageIcon,
  Star, Palette, Ruler, Trash2,
  ChevronDown, ChevronUp,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import AIImageGenerator from './AIImageGenerator'

// ── Types ────────────────────────────
interface VariantImage {
  url: string
  alt?: string
  is_primary?: boolean
}

interface ProductVariantsManagerProps {
  productName: string
  productId?: string
  initialColors?: string[]
  initialSizes?: string[]
  initialVariantImages?: Record<string, VariantImage[]>
  initialGeneralImages?: VariantImage[]
  onChange: (data: {
    colors: string[]
    sizes: string[]
    variantImages: Record<string, VariantImage[]>
    generalImages: VariantImage[]
  }) => void
}

// ── Color presets ─────────────────────
const COLOR_PRESETS = [
  { name: 'Noir',      hex: '#1a1a1a' },
  { name: 'Blanc',     hex: '#f5f5f5' },
  { name: 'Rouge',     hex: '#EF4444' },
  { name: 'Bleu',      hex: '#3B82F6' },
  { name: 'Vert',      hex: '#22C55E' },
  { name: 'Rose',      hex: '#EC4899' },
  { name: 'Jaune',     hex: '#EAB308' },
  { name: 'Violet',    hex: '#A855F7' },
  { name: 'Orange',    hex: '#F97316' },
  { name: 'Gris',      hex: '#6B7280' },
  { name: 'Beige',     hex: '#D2B48C' },
  { name: 'Marine',    hex: '#1E3A5F' },
  { name: 'Bordeaux',  hex: '#800020' },
  { name: 'Marron',    hex: '#92400E' },
  { name: 'Turquoise', hex: '#06B6D4' },
  { name: 'Corail',    hex: '#FF6B6B' },
  { name: 'Kaki',      hex: '#8B8B00' },
  { name: 'Lavande',   hex: '#E6E6FA' },
]

// ── Size presets ──────────────────────
const SIZE_PRESETS = {
  'Vêtements': [
    'XS','S','M','L','XL','XXL','3XL'
  ],
  'Chaussures': [
    '36','37','38','39','40',
    '41','42','43','44','45'
  ],
  'Enfants': [
    '2 ans','3 ans','4 ans','5 ans',
    '6 ans','8 ans','10 ans','12 ans'
  ],
  'Standard': [
    'Unique','Petit','Moyen','Grand'
  ],
}

export default function ProductVariantsManager({
  productName,
  productId,
  initialColors = [],
  initialSizes = [],
  initialVariantImages = {},
  initialGeneralImages = [],
  onChange,
}: ProductVariantsManagerProps) {

  const [colors, setColors] = useState<string[]>(initialColors)
  const [sizes, setSizes] = useState<string[]>(initialSizes)
  const [variantImages, setVariantImages] = useState<Record<string, VariantImage[]>>(initialVariantImages)
  const [generalImages, setGeneralImages] = useState<VariantImage[]>(initialGeneralImages)

  // UI state
  const [activeColorTab, setActiveColorTab] = useState<string | null>(null)
  const [customColor, setCustomColor] = useState('')
  const [customSize, setCustomSize] = useState('')
  const [selectedSizePreset, setSelectedSizePreset] = useState('Vêtements')
  const [uploading, setUploading] = useState<string | null>(null)

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ── Notify parent ─────────────────
  function notify(
    c = colors,
    s = sizes,
    vi = variantImages,
    gi = generalImages
  ) {
    onChange({
      colors: c,
      sizes: s,
      variantImages: vi,
      generalImages: gi,
    })
  }

  // ── Add color ─────────────────────
  function addColor(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (colors.includes(trimmed)) {
      toast.error('Couleur déjà ajoutée')
      return
    }
    const newColors = [...colors, trimmed]
    setColors(newColors)
    setCustomColor('')
    
    // Auto-detect images for this color
    let newVI = { ...variantImages }
    
    if (!newVI[trimmed] || newVI[trimmed].length === 0) {
      const colorTranslations: Record<string, string[]> = {
        'Noir': ['black', 'noir', 'blk'],
        'Blanc': ['white', 'blanc', 'wht'],
        'Rouge': ['red', 'rouge'],
        'Bleu': ['blue', 'bleu'],
        'Vert': ['green', 'vert'],
        'Rose': ['pink', 'rose'],
        'Jaune': ['yellow', 'jaune'],
        'Violet': ['purple', 'violet'],
        'Orange': ['orange'],
        'Gris': ['gray', 'grey', 'gris'],
        'Beige': ['beige', 'khaki'],
        'Marine': ['navy', 'marine'],
        'Bordeaux': ['burgundy', 'bordeaux', 'wine'],
        'Marron': ['brown', 'marron'],
        'Kaki': ['khaki', 'kaki'],
      }
      
      const synonyms = colorTranslations[trimmed] || [trimmed.toLowerCase()]
      
      // 1. Look in general images (alt text or URL)
      const foundInGeneral = generalImages.filter(img => {
        const text = ((img.alt || '') + ' ' + (img.url || '')).toLowerCase()
        return synonyms.some(syn => text.includes(syn))
      })
      
      // 2. Look in variant images (keys matching synonyms)
      let foundInVariant: VariantImage[] = []
      const allVariantImageSources = { ...initialVariantImages, ...variantImages }
      
      Object.keys(allVariantImageSources).forEach(key => {
        if (synonyms.some(syn => key.toLowerCase().includes(syn))) {
          foundInVariant = [...foundInVariant, ...allVariantImageSources[key]]
        }
      })
      
      const allFound = [...foundInGeneral, ...foundInVariant]
      
      // Deduplicate by URL
      const uniqueFound: VariantImage[] = []
      const seen = new Set()
      for (const img of allFound) {
        if (!seen.has(img.url)) {
          seen.add(img.url)
          uniqueFound.push(img)
        }
      }
      
      if (uniqueFound.length > 0) {
        newVI[trimmed] = uniqueFound.map((img, i) => ({...img, is_primary: i === 0}))
        toast.success(`📸 ${uniqueFound.length} image(s) auto-associée(s) pour la couleur ${trimmed}`)
      }
    }

    setVariantImages(newVI)
    // Auto-open new color tab
    setActiveColorTab(trimmed)
    notify(newColors, sizes, newVI, generalImages)
  }

  // ── Remove color ──────────────────
  function removeColor(color: string) {
    const newColors = colors.filter(c => c !== color)
    const newVI = { ...variantImages }
    delete newVI[color]
    setColors(newColors)
    setVariantImages(newVI)
    if (activeColorTab === color) {
      setActiveColorTab(newColors[0] || null)
    }
    notify(newColors, sizes, newVI, generalImages)
  }

  // ── Add size ──────────────────────
  function addSize(size: string) {
    const trimmed = size.trim()
    if (!trimmed) return
    if (sizes.includes(trimmed)) {
      toast.error('Taille déjà ajoutée')
      return
    }
    const newSizes = [...sizes, trimmed]
    setSizes(newSizes)
    setCustomSize('')
    notify(colors, newSizes, variantImages, generalImages)
  }

  // ── Remove size ───────────────────
  function removeSize(size: string) {
    const newSizes = sizes.filter(s => s !== size)
    setSizes(newSizes)
    notify(colors, newSizes, variantImages, generalImages)
  }

  // ── Upload image ──────────────────
  async function uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      
      if (!res.ok) {
        const text = await res.text()
        if (text.includes('Request Entity') || res.status === 413) {
          toast.error(`Image trop volumineuse: ${file.name} (Max 4.5MB)`)
        } else {
          toast.error(`Erreur upload: ${file.name}`)
        }
        return null
      }

      const data = await res.json()
      return data.url || null
    } catch {
      return null
    }
  }

  // ── Handle file select ────────────
  async function handleFiles(files: FileList | null, context: string) {
    if (!files?.length) return
    setUploading(context)

    const newImgs: VariantImage[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} invalide`)
        continue
      }
      const url = await uploadImage(file)
      if (url) {
        newImgs.push({
          url,
          alt: `${productName} ${context}`,
          is_primary: false,
        })
      }
    }

    if (!newImgs.length) {
      setUploading(null)
      return
    }

    if (context === 'general') {
      const updated = [...generalImages, ...newImgs].map((img, i) => ({
        ...img,
        is_primary: i === 0 && generalImages.length === 0 ? true : img.is_primary,
      }))
      setGeneralImages(updated)
      notify(colors, sizes, variantImages, updated)
    } else {
      const current = variantImages[context] || []
      const updated = [...current, ...newImgs].map((img, i) => ({
        ...img,
        is_primary: i === 0 && current.length === 0 ? true : img.is_primary,
      }))
      const newVI = { ...variantImages, [context]: updated }
      setVariantImages(newVI)
      notify(colors, sizes, newVI, generalImages)
    }

    toast.success(`✅ ${newImgs.length} image(s) ajoutée(s)`)
    setUploading(null)
  }

  // ── Remove image ──────────────────
  function removeImage(context: string, index: number) {
    if (context === 'general') {
      const updated = generalImages.filter((_, i) => i !== index).map((img, i) => ({
        ...img,
        is_primary: i === 0 ? true : img.is_primary,
      }))
      setGeneralImages(updated)
      notify(colors, sizes, variantImages, updated)
    } else {
      const updated = (variantImages[context] || []).filter((_, i) => i !== index).map((img, i) => ({
        ...img,
        is_primary: i === 0 ? true : img.is_primary,
      }))
      const newVI = { ...variantImages, [context]: updated }
      setVariantImages(newVI)
      notify(colors, sizes, newVI, generalImages)
    }
  }

  // ── Image Grid Component ──────────
  function ImageGrid({ images, context }: { images: VariantImage[], context: string }) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <motion.div
              key={img.url + i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-700 hover:border-gray-500 bg-gray-800 transition-all"
            >
              <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-white"/> Princ.
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(context, i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-10 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
              >
                <X className="w-3.5 h-3.5"/>
              </button>
              {!img.is_primary && (
                <button
                  type="button"
                  onClick={() => {
                    if (context === 'general') {
                      const updated = generalImages.map((im, idx) => ({ ...im, is_primary: idx === i }))
                      setGeneralImages(updated)
                      notify(colors, sizes, variantImages, updated)
                    } else {
                      const updated = (variantImages[context]||[]).map((im, idx) => ({ ...im, is_primary: idx === i }))
                      const newVI = { ...variantImages, [context]: updated }
                      setVariantImages(newVI)
                      notify(colors, sizes, newVI, generalImages)
                    }
                  }}
                  className="absolute bottom-1 inset-x-1 bg-black/70 hover:bg-primary text-white text-[9px] font-bold py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 text-center"
                >
                  ⭐ Principale
                </button>
              )}
            </motion.div>
          ))}
          <div
            onClick={() => fileRefs.current[context]?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-primary/70 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all group bg-gray-800/30"
          >
            {uploading === context ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-primary rounded-full animate-spin"/>
            ) : (
              <>
                <Plus className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors mb-1"/>
                <span className="text-[9px] text-gray-600 group-hover:text-primary font-bold">Ajouter</span>
              </>
            )}
          </div>
        </div>

        <input
          ref={el => { fileRefs.current[context] = el }}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files, context)}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileRefs.current[context]?.click()}
            disabled={uploading === context}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5"/>
            {uploading === context ? 'Upload...' : 'Ajouter images'}
          </button>

          <AIImageGenerator
            productName={context === 'general' ? productName : `${productName} couleur ${context}`}
            onImagesGenerated={(imgs) => {
              const formatted = imgs.map((img, i) => ({
                url: img.url,
                alt: img.alt || productName,
                is_primary: i === 0,
              }))
              if (context === 'general') {
                const updated = [...generalImages, ...formatted]
                setGeneralImages(updated)
                notify(colors, sizes, variantImages, updated)
              } else {
                const current = variantImages[context] || []
                const updated = [...current, ...formatted]
                const newVI = { ...variantImages, [context]: updated }
                setVariantImages(newVI)
                notify(colors, sizes, newVI, generalImages)
              }
              toast.success(`🎨 ${imgs.length} image(s) IA ajoutée(s)!`)
            }}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (!confirm(`Supprimer toutes les ${images.length} images?`)) return
                if (context === 'general') {
                  setGeneralImages([])
                  notify(colors, sizes, variantImages, [])
                } else {
                  const newVI = { ...variantImages, [context]: [] }
                  setVariantImages(newVI)
                  notify(colors, sizes, newVI, generalImages)
                }
              }}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-500 text-xs font-bold transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5"/> Tout supprimer
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ══ SECTION 1 — GENERAL IMAGES ══ */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-primary"/>
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Images Générales</h3>
            <p className="text-gray-500 text-xs">Affichées par défaut sur toutes les variantes</p>
          </div>
          <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-full font-bold">
            {generalImages.length} image(s)
          </span>
        </div>
        <div className="p-5">
          <ImageGrid images={generalImages} context="general" />
        </div>
      </div>

      {/* ══ SECTION 2 — COLORS ══ */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center">
            <Palette className="w-4 h-4 text-pink-400"/>
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Couleurs disponibles</h3>
            <p className="text-gray-500 text-xs">Chaque couleur peut avoir ses propres photos</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {colors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {colors.map(color => {
                const preset = COLOR_PRESETS.find(p => p.name === color)
                const hex = preset?.hex || '#888'
                const imgCount = variantImages[color]?.length || 0
                return (
                  <div key={color} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                    <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: hex }} />
                    <span className="text-sm font-bold text-white">{color}</span>
                    {imgCount > 0 && (
                      <span className="text-[10px] bg-secondary/20 text-secondary font-black px-1.5 py-0.5 rounded-full">{imgCount} 📸</span>
                    )}
                    <button type="button" onClick={() => removeColor(color)} className="w-4 h-4 text-gray-600 hover:text-red-400 transition-colors flex items-center justify-center">
                      <X className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2">Couleurs rapides</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map(preset => {
                  const isAdded = colors.includes(preset.name)
                  const isLight = ['Blanc', 'Beige', 'Jaune', 'Lavande'].includes(preset.name)
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => isAdded ? null : addColor(preset.name)}
                      disabled={isAdded}
                      title={preset.name}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all ${isAdded ? 'opacity-40 cursor-not-allowed border-white/30' : isLight ? 'border-gray-400 hover:scale-110 hover:border-gray-600' : 'border-transparent hover:scale-110 hover:border-white/50'}`}
                      style={{ background: preset.hex }}
                    >
                      {isAdded && <Check className={`w-4 h-4 absolute inset-0 m-auto ${isLight ? 'text-gray-800' : 'text-white'}`} />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addColor(customColor)}
                placeholder="Autre couleur..."
                className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-600 focus:border-primary rounded-xl text-white text-sm focus:outline-none placeholder:text-gray-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => addColor(customColor)}
                disabled={!customColor.trim()}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4"/> Ajouter
              </button>
            </div>
          </div>

          {colors.length > 0 && (
            <div className="border-t border-gray-800 pt-4 space-y-3">
              <p className="text-xs text-gray-400 font-black uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5"/> Images par couleur
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {colors.map(color => {
                  const preset = COLOR_PRESETS.find(p => p.name === color)
                  const hex = preset?.hex || '#888'
                  const imgCount = variantImages[color]?.length || 0
                  const isActive = activeColorTab === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setActiveColorTab(isActive ? null : color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all border ${isActive ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-800 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20" style={{ background: hex }} />
                      {color}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${imgCount > 0 ? 'bg-secondary/20 text-secondary' : 'bg-gray-700 text-gray-500'}`}>
                        {imgCount}
                      </span>
                      {isActive ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                    </button>
                  )
                })}
              </div>
              <AnimatePresence>
                {activeColorTab && (
                  <motion.div
                    key={activeColorTab}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: COLOR_PRESETS.find(p => p.name === activeColorTab)?.hex || '#888' }} />
                      <p className="text-sm font-black text-white">Photos pour <span className="text-primary">{activeColorTab}</span></p>
                      {(variantImages[activeColorTab]?.length || 0) === 0 && (
                        <span className="text-[10px] text-gray-500 bg-gray-700 px-2 py-1 rounded-full ml-auto">💡 Utilisera les images générales si vide</span>
                      )}
                    </div>
                    <ImageGrid images={variantImages[activeColorTab] || []} context={activeColorTab} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 3 — SIZES ══ */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Ruler className="w-4 h-4 text-blue-400"/>
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Tailles disponibles</h3>
            <p className="text-gray-500 text-xs">Le client devra choisir avant d'ajouter au panier</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {sizes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <div key={size} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                  <span className="text-sm font-black text-white">{size}</span>
                  <button type="button" onClick={() => removeSize(size)} className="w-3.5 h-3.5 text-gray-600 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {Object.keys(SIZE_PRESETS).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedSizePreset(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSizePreset === cat ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS[selectedSizePreset as keyof typeof SIZE_PRESETS].map(size => {
                const isAdded = sizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => isAdded ? removeSize(size) : addSize(size)}
                    className={`min-w-[44px] h-10 px-3 rounded-xl border-2 font-black text-sm transition-all ${isAdded ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white'}`}
                  >
                    {isAdded && <Check className="w-3 h-3 inline mr-1"/>}
                    {size}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSize}
                onChange={e => setCustomSize(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSize(customSize)}
                placeholder="Taille personnalisée..."
                className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-600 focus:border-blue-400 rounded-xl text-white text-sm focus:outline-none placeholder:text-gray-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => addSize(customSize)}
                disabled={!customSize.trim()}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4"/> Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SUMMARY ══ */}
      {(colors.length > 0 || sizes.length > 0) && (
        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 flex gap-3">
          <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5"/>
          <div className="text-sm text-secondary">
            <p className="font-black mb-1">Variantes configurées ✅</p>
            <p className="text-xs text-secondary/70">
              {colors.length > 0 && `${colors.length} couleur(s): ${colors.join(', ')}`}
              {colors.length > 0 && sizes.length > 0 && ' · '}
              {sizes.length > 0 && `${sizes.length} taille(s): ${sizes.join(', ')}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

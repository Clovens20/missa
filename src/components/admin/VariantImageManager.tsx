'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Upload, Image as ImageIcon,
  Star, StarOff, GripVertical,
  ChevronDown, ChevronUp,
  Sparkles, Check, Palette,
  RefreshCw, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import AIImageGenerator from './AIImageGenerator'

interface VariantImage {
  id?: string
  url: string
  alt?: string
  is_primary?: boolean
  display_order?: number
}

interface VariantImageManagerProps {
  productId?: string
  productName: string
  colors: string[]
  sizes: string[]
  initialVariantImages?: Record<string, VariantImage[]>
  generalImages?: VariantImage[]
  onChange: (data: {
    generalImages: VariantImage[]
    variantImages: Record<string, VariantImage[]>
  }) => void
}

const COLOR_HEX_MAP: Record<string, string> = {
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
  'Marron': '#92400E', 'Brown': '#92400E',
  'Turquoise': '#06B6D4',
  'Corail': '#FF6B6B',
  'Kaki': '#8B8B00',
}

export default function VariantImageManager({
  productId,
  productName,
  colors,
  sizes,
  initialVariantImages = {},
  generalImages: initGeneral = [],
  onChange,
}: VariantImageManagerProps) {

  const [generalImages, setGeneralImages] = useState<VariantImage[]>(initGeneral)
  const [variantImages, setVariantImages] = useState<Record<string, VariantImage[]>>(initialVariantImages)
  const [activeColor, setActiveColor] = useState<string | null>(colors[0] || null)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function notifyChange(newGeneral: VariantImage[], newVariant: Record<string, VariantImage[]>) {
    onChange({
      generalImages: newGeneral,
      variantImages: newVariant,
    })
  }

  async function deleteImageFromStorage(imageUrl: string) {
    try {
      if (!imageUrl.includes('supabase.co')) return // Only delete if hosted on Supabase

      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/storage/v1/object/public/')
      
      if (pathParts.length < 2) return

      const [bucket, ...fileParts] = pathParts[1].split('/')
      const filename = fileParts.join('/')

      await fetch('/api/admin/images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, filename }),
      })
    } catch (err) {
      console.error('Storage delete error:', err)
    }
  }

  async function uploadImage(file: File, context: string): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      return data.url || null
    } catch (err) {
      toast.error('Erreur upload')
      return null
    }
  }

  async function handleFileSelect(files: FileList | null, context: string) {
    if (!files || files.length === 0) return
    setUploading(context)

    const newImages: VariantImage[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`)
        continue
      }
      const url = await uploadImage(file, context)
      if (url) {
        newImages.push({
          url,
          alt: `${productName} - ${context}`,
          is_primary: false,
          display_order: 0,
        })
      }
    }

    if (newImages.length > 0) {
      if (context === 'general') {
        const updated = [...generalImages, ...newImages].map((img, i) => ({
          ...img,
          display_order: i,
          is_primary: i === 0,
        }))
        setGeneralImages(updated)
        notifyChange(updated, variantImages)
      } else {
        const current = variantImages[context] || []
        const updated = [...current, ...newImages].map((img, i) => ({
          ...img,
          display_order: i,
          is_primary: i === 0,
        }))
        const newVariant = { ...variantImages, [context]: updated }
        setVariantImages(newVariant)
        notifyChange(generalImages, newVariant)
      }
      toast.success(`✅ ${newImages.length} image(s) ajoutée(s)`)
    }
    setUploading(null)
  }

  async function removeImage(context: string, index: number) {
    const images = context === 'general' ? generalImages : (variantImages[context] || [])
    const imageToDelete = images[index]
    
    if (imageToDelete?.url) {
      await deleteImageFromStorage(imageToDelete.url)
    }

    if (context === 'general') {
      const updated = generalImages.filter((_, i) => i !== index).map((img, i) => ({
        ...img,
        is_primary: i === 0,
        display_order: i,
      }))
      setGeneralImages(updated)
      notifyChange(updated, variantImages)
    } else {
      const current = variantImages[context] || []
      const updated = current.filter((_, i) => i !== index).map((img, i) => ({
        ...img,
        is_primary: i === 0,
        display_order: i,
      }))
      const newVariant = { ...variantImages, [context]: updated }
      setVariantImages(newVariant)
      notifyChange(generalImages, newVariant)
    }
  }

  function setPrimary(context: string, index: number) {
    if (context === 'general') {
      const updated = generalImages.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
      setGeneralImages(updated)
      notifyChange(updated, variantImages)
    } else {
      const current = variantImages[context] || []
      const updated = current.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
      const newVariant = { ...variantImages, [context]: updated }
      setVariantImages(newVariant)
      notifyChange(generalImages, newVariant)
    }
  }

  function handleAIImages(newImages: { url: string; alt: string }[], context: string) {
    const formatted = newImages.map((img, i) => ({
      url: img.url,
      alt: img.alt,
      is_primary: i === 0,
      display_order: i,
    }))

    if (context === 'general') {
      const updated = [...generalImages, ...formatted]
      setGeneralImages(updated)
      notifyChange(updated, variantImages)
    } else {
      const current = variantImages[context] || []
      const updated = [...current, ...formatted]
      const newVariant = { ...variantImages, [context]: updated }
      setVariantImages(newVariant)
      notifyChange(generalImages, newVariant)
    }
  }

  function ImageGrid({ images, context }: { images: VariantImage[], context: string }) {
    return (
      <div className="space-y-4">
        {/* Images grid */}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img, i) => (
                <motion.div
                  key={img.url + i}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800 border-2 border-gray-700 hover:border-red-400/50 transition-all">
                  
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />

                  {/* Red X button — top right corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeImage(context, i)
                    }}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 duration-200">
                    <X className="w-4 h-4"/>
                  </button>

                  {/* Primary badge */}
                  {(img.is_primary || i === 0) && (
                    <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-10">
                      Princ.
                    </div>
                  )}

                  {/* Set as Primary button */}
                  {!img.is_primary && i !== 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setPrimary(context, i)
                      }}
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/70 hover:bg-primary text-white text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap transition-all z-10 opacity-0 group-hover:opacity-100 duration-200">
                      ⭐ Principale
                    </button>
                  )}

                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none"/>
                </motion.div>
              ))}

              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileRefs.current[context]?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-primary/60 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <Plus className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors"/>
                <span className="text-[10px] text-gray-600 group-hover:text-primary mt-1 font-bold">Ajouter</span>
              </button>
            </div>

            {/* Bulk delete button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Supprimer toutes les ${images.length} images de ce groupe ?`)) {
                    if (context === 'general') {
                      setGeneralImages([])
                      notifyChange([], variantImages)
                    } else {
                      const newVariant = { ...variantImages, [context]: [] }
                      setVariantImages(newVariant)
                      notifyChange(generalImages, newVariant)
                    }
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 font-bold transition-colors">
                <Trash2 className="w-3.5 h-3.5"/>
                Tout supprimer ({images.length})
              </button>
            </div>
          </>
        )}

        {/* Empty state */}
        {images.length === 0 && (
          <div
            onClick={() => fileRefs.current[context]?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              handleFileSelect(e.dataTransfer.files, context)
            }}
            className="border-2 border-dashed border-gray-700 hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all">
            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-gray-500"/>
            </div>
            <p className="text-white font-bold text-sm mb-1">Cliquez ou glissez</p>
            <p className="text-gray-500 text-xs">JPG · PNG · WEBP</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <input
            ref={el => { fileRefs.current[context] = el }}
            type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFileSelect(e.target.files, context)}
          />
          <button
            type="button"
            onClick={() => fileRefs.current[context]?.click()}
            disabled={uploading === context}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 flex-1 justify-center">
            {uploading === context ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>}
            {uploading === context ? 'Upload...' : 'Ajouter images'}
          </button>
          <AIImageGenerator
            productName={context === 'general' ? productName : `${productName} ${context}`}
            onImagesGenerated={(imgs) => handleAIImages(imgs, context)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── GENERAL IMAGES TAB ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h3 className="font-black text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary"/>
              Images Générales
              <span className="text-gray-500 text-xs font-normal">({generalImages.length})</span>
            </h3>
            <p className="text-gray-600 text-xs mt-0.5">Image principale du produit (toutes variantes)</p>
          </div>
        </div>
        <div className="p-5">
          <ImageGrid images={generalImages} context="general" />
        </div>
      </div>

      {/* ── COLOR VARIANT IMAGES ── */}
      {colors.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="font-black text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary"/>
              Images par Couleur
            </h3>
            <p className="text-gray-600 text-xs mt-0.5">Chaque couleur peut avoir ses propres images</p>
          </div>

          <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-gray-800">
            {colors.map(color => {
              const hex = COLOR_HEX_MAP[color] || '#888'
              const imgs = variantImages[color] || []
              const isActive = activeColor === color
              return (
                <button
                  key={color} type="button"
                  onClick={() => setActiveColor(color)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${isActive ? 'bg-gray-700 text-white border border-gray-600' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
                  <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: hex }} />
                  {color}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${imgs.length > 0 ? 'bg-secondary/20 text-secondary' : 'bg-gray-700 text-gray-500'}`}>
                    {imgs.length}
                  </span>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeColor && (
              <motion.div
                key={activeColor} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full border-2 border-white/20" style={{ background: COLOR_HEX_MAP[activeColor] || '#888' }} />
                  <p className="text-sm font-bold text-white">Images pour la couleur <span className="text-primary">{activeColor}</span></p>
                  {(variantImages[activeColor]?.length || 0) === 0 && (
                    <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-1 rounded-full">Utilisera les images générales si vide</span>
                  )}
                </div>
                <ImageGrid images={variantImages[activeColor] || []} context={activeColor} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

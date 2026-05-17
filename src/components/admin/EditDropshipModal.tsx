import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface EditDropshipModalProps {
  product: any | null
  categories: any[]
  isOpen: boolean
  onClose: () => void
  onSaved: (updatedProduct: any) => void
}

export default function EditDropshipModal({
  product,
  categories,
  isOpen,
  onClose,
  onSaved
}: EditDropshipModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [images, setImages] = useState<any[]>([])
  const [soldCount, setSoldCount] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name || '')
      setCategoryId(product.category_id || '')
      setDescription(product.description || '')
      setShortDescription(product.short_description || '')
      setSoldCount(product.sold_count || 0)
      // Safely parse images using a robust recursive extractor
      const extractUrls = (input: any): string[] => {
        if (!input) return []
        if (typeof input === 'string') {
          // If it looks like a JSON array, parse it and extract recursively
          if (input.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(input)
              return extractUrls(parsed)
            } catch (e) {
              // Not valid JSON, check if it's a valid URL
              return input.startsWith('http') ? [input] : []
            }
          }
          // Check if it's just a raw URL
          return input.startsWith('http') ? [input] : []
        }
        if (Array.isArray(input)) {
          return input.flatMap(extractUrls)
        }
        if (typeof input === 'object' && input !== null) {
          if (input.url && typeof input.url === 'string' && input.url.startsWith('http')) {
            return [input.url]
          }
        }
        return []
      }

      const cleanUrls = extractUrls(product.images)
      
      setImages(cleanUrls)
    }
  }, [product, isOpen])

  if (!isOpen || !product) return null

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('dropship_products')
      .update({
        name,
        category_id: categoryId || null,
        description,
        short_description: shortDescription,
        sold_count: soldCount,
        images
      })
      .eq('id', product.id)
      .select()
      .single()

    // 🔄 Sync changes to main products table as well
    if (!error) {
      await supabase
        .from('products')
        .update({
          name,
          category_id: categoryId || null,
          description,
          short_description: shortDescription,
          sold_count: soldCount,
          images
        })
        .eq('id', product.id)
    }

    setSaving(false)

    if (error) {
      toast.error('Erreur lors de la sauvegarde : ' + error.message)
    } else {
      toast.success('Produit mis à jour avec succès!')
      onSaved(data)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-xl font-black text-white">Modifier le produit importé</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            
            {/* Nom */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Nom du produit</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Nom affiché sur la boutique"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Catégorie de la boutique</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Sélectionner une catégorie...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">C'est ici que le produit sera affiché dans votre catalogue.</p>
            </div>

            {/* Description Courte */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Description courte</label>
              <textarea
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Bref résumé (affiché en haut)"
              />
            </div>

            {/* Nombre Vendus */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Nombre vendus (Factice / Réel)</label>
              <input
                type="number"
                value={soldCount}
                onChange={e => setSoldCount(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: 145"
              />
            </div>

            {/* Description Longue */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Description complète (HTML autorisé)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none font-mono text-sm"
                placeholder="<p>Détails complets du produit...</p>"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Photos du produit ({images.length})</label>
              <p className="text-xs text-gray-500 mb-4">La première image (en haut à gauche) est l'image principale. Cliquez sur X pour supprimer les images avec du texte ou des tableaux de tailles.</p>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {images.map((img: any, idx: number) => {
                  const url = typeof img === 'string' ? img : img.url
                  return (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700 group">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                          title="Supprimer cette photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[10px] font-bold text-center py-1">
                          Principale
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

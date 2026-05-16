'use client'
import { 
  useState, useRef, useCallback,
  useEffect
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Image as ImageIcon,
  X, Search, Camera,
  Link as LinkIcon,
  Loader, RefreshCw,
  CheckCircle, Sparkles,
  Brain, Zap, Eye,
  ChevronDown, Info
} from 'lucide-react'
import { toast } from 'sonner'

interface CJImageSearchProps {
  onResults: (
    results: any[], 
    previewUrl: string,
    method: string
  ) => void
  onSearching: (loading: boolean) => void
}

// Popular product categories for quick search
const QUICK_SEARCHES = [
  { label: '👗 Robes Femme', query: 'women dress' },
  { label: '👜 Sacs', query: 'women handbag' },
  { label: '💍 Bijoux', query: 'jewelry necklace' },
  { label: '👟 Chaussures', query: 'women shoes' },
  { label: '💄 Beauté', query: 'makeup beauty' },
  { label: '🧥 Manteaux', query: 'women coat jacket' },
  { label: '👔 Homme', query: 'men fashion shirt' },
  { label: '🏠 Maison', query: 'home decor' },
]

export default function CJImageSearch({
  onResults,
  onSearching,
}: CJImageSearchProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload')
  const [imageUrl, setImageUrl] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [searchMethod, setSearchMethod] = useState<string>('')
  const [resultCount, setResultCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // Search status messages
  const [statusMsg, setStatusMsg] = useState('')
  const statusMessages = [
    '🔍 Analyse de l\'image...',
    '🧠 Reconnaissance visuelle...',
    '📡 Connexion à CJDropshipping...',
    '⚡ Recherche de produits similaires...',
    '✨ Presque terminé...',
  ]
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)

  function startStatusMessages() {
    let i = 0
    setStatusMsg(statusMessages[0])
    statusIntervalRef.current = setInterval(() => {
      i = (i + 1) % statusMessages.length
      setStatusMsg(statusMessages[i])
    }, 1500)
  }

  function stopStatusMessages() {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
    }
    setStatusMsg('')
  }

  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current)
    }
  }, [])

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier image requis')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image max 10MB')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setSearchDone(false)
    await performSearch(file, previewUrl)
  }

  async function performSearch(
    file?: File,
    previewUrl?: string,
    url?: string
  ) {
    setSearching(true)
    onSearching(true)
    startStatusMessages()
    
    try {
      const formData = new FormData()
      
      if (file) {
        formData.append('image', file)
      } else if (url) {
        formData.append('imageUrl', url)
      }

      const res = await fetch(
        '/api/cj/image-search',
        {
          method: 'POST',
          body: formData,
        }
      )
      
      const data = await res.json()
      
      stopStatusMessages()
      setSearchDone(true)
      setSearchMethod(data.searchMethod || 'unknown')
      setResultCount(data.list?.length || 0)

      const finalPreview = previewUrl || url || ''
      
      onResults(
        data.list || [], 
        finalPreview,
        data.searchMethod || ''
      )

      if (data.list?.length > 0) {
        const methodLabel = 
          data.searchMethod === 'cj_image' 
            ? '🎯 Analyse visuelle CJ'
            : data.searchMethod === 'smart_text'
              ? '🧠 Recherche intelligente'
              : '✨ Produits suggérés'
        
        toast.success(`${data.list.length} produits trouvés! (${methodLabel})`)
      } else {
        toast.info('Aucun résultat. Essayez une autre image.')
      }
      
    } catch (err: any) {
      stopStatusMessages()
      toast.error('Erreur de recherche: ' + err.message)
      onResults([], '', 'error')
    } finally {
      setSearching(false)
      onSearching(false)
    }
  }

  async function searchWithUrl() {
    if (!imageUrl.trim()) {
      toast.error('URL requise')
      return
    }
    setPreview(imageUrl)
    setSearchDone(false)
    await performSearch(undefined, undefined, imageUrl)
  }

  // Quick category search
  async function quickSearch(query: string, label: string) {
    setSearching(true)
    onSearching(true)
    setStatusMsg(`🔍 Recherche "${label}"...`)
    
    try {
      const res = await fetch(`/api/cj/search?q=${encodeURIComponent(query)}&page=1`)
      const data = await res.json()
      
      const list = (data.list || []).map((p: any) => ({
        ...p,
        supplierInfo: {
          supplierName: p.supplierName || 'CJDropshipping',
          countryCode: p.countryCode || 'CN',
          productSales: p.productSales || 0,
          productScore: p.productScore || 4.5,
          supplierScore: p.supplierScore || 4.5,
          reviewCount: p.commentNum || 0,
          processingTime: '2-5 days',
          shippingFromUS: p.countryCode === 'US',
        }
      }))

      setResultCount(list.length)
      setSearchDone(true)
      onResults(list, '', 'quick_search')
      
      toast.success(`${list.length} produits "${label}"!`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSearching(false)
      onSearching(false)
      setStatusMsg('')
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    }, []
  )

  function clearSearch() {
    setPreview(null)
    setSearchDone(false)
    setImageUrl('')
    setResultCount(0)
    setSearchMethod('')
    onResults([], '', '')
  }

  return (
    <div className="space-y-5">
      
      {/* Mode tabs */}
      <div className="flex gap-2 bg-gray-800 rounded-2xl p-1.5">
        {([
          ['upload', <Upload className="w-4 h-4"/>, 'Uploader une image'],
          ['url', <LinkIcon className="w-4 h-4"/>, 'Par URL'],
        ] as const).map(([mode, icon, label]) => (
          <button
            key={mode}
            onClick={() => {
              setInputMode(mode)
              clearSearch()
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
              ${inputMode === mode
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-400 hover:text-white'
              }`}>
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      {inputMode === 'upload' && (
        <div>
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200
                ${dragOver
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-gray-600 hover:border-primary/60 hover:bg-gray-800/50'
                }`}>
              
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
                className="hidden"
              />
              
              <motion.div
                animate={{ scale: dragOver ? 1.1 : 1 }}
                className={`w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-all
                  ${dragOver ? 'bg-primary/30' : 'bg-gray-700'}`}>
                {dragOver ? (
                  <Sparkles className="w-10 h-10 text-primary animate-pulse"/>
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-400"/>
                )}
              </motion.div>
              
              <h3 className="text-white font-black text-xl mb-2">
                {dragOver ? '📸 Déposez ici!' : 'Recherche par image'}
              </h3>
              <p className="text-gray-400 text-sm mb-1">
                Glissez une photo de produit ou cliquez pour choisir
              </p>
              <p className="text-gray-600 text-xs">
                JPG · PNG · WEBP · max 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview + status */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-800 border border-gray-700">
                <img
                  src={preview}
                  alt="Recherche"
                  className="w-full max-h-64 object-contain"
                />
                
                {/* Searching overlay */}
                {searching && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    
                    {/* Animated brain icon */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Brain className="w-8 h-8 text-primary animate-pulse"/>
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={statusMsg}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-white font-bold text-sm">
                        {statusMsg}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                )}

                {/* Done badge */}
                {searchDone && !searching && (
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold
                      ${searchMethod === 'cj_image' ? 'bg-secondary text-white' : 'bg-primary text-white'}`}>
                      {searchMethod === 'cj_image' ? (
                        <>
                          <Eye className="w-3 h-3"/>
                          Analyse visuelle
                        </>
                      ) : (
                        <>
                          <Brain className="w-3 h-3"/>
                          Recherche IA
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Result summary */}
              {searchDone && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-3 rounded-xl border
                    ${resultCount > 0 ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-800 border-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    {resultCount > 0 ? (
                      <CheckCircle className="w-4 h-4 text-secondary"/>
                    ) : (
                      <Info className="w-4 h-4 text-gray-400"/>
                    )}
                    <span className={`text-sm font-bold ${resultCount > 0 ? 'text-secondary' : 'text-gray-400'}`}>
                      {resultCount > 0
                        ? `${resultCount} produits similaires trouvés!`
                        : 'Aucun résultat'
                      }
                    </span>
                  </div>
                  <button
                    onClick={clearSearch}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3"/>
                    Nouvelle recherche
                  </button>
                </motion.div>
              )}

              {/* Actions */}
              {!searching && (
                <div className="flex gap-2">
                  <button
                    onClick={clearSearch}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition-colors">
                    <X className="w-4 h-4"/>
                    Changer d'image
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary font-bold py-2.5 rounded-xl text-sm transition-colors">
                    <RefreshCw className="w-4 h-4"/>
                    Réessayer
                  </button>
                </div>
              )}
              
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* URL mode */}
      {inputMode === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchWithUrl()}
                placeholder="https://exemple.com/image.jpg"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={searchWithUrl}
              disabled={searching || !imageUrl}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-5 py-3 rounded-xl text-sm transition-all disabled:opacity-50">
              {searching ? (
                <Loader className="w-4 h-4 animate-spin"/>
              ) : (
                <Search className="w-4 h-4"/>
              )}
              {searching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
          
          {/* Status */}
          {searching && statusMsg && (
            <motion.p
              key={statusMsg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-primary text-sm font-semibold">
              {statusMsg}
            </motion.p>
          )}

          {preview && !searching && (
            <div className="h-40 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="max-h-full object-contain"
              />
            </div>
          )}
          
          <p className="text-xs text-gray-600 text-center">
            💡 URL d'une image trouvée sur Google, Pinterest, Amazon...
          </p>
        </div>
      )}

      {/* ── QUICK SEARCH CATEGORIES ── */}
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary"/>
          Recherche rapide par catégorie
        </p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_SEARCHES.map((qs, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => quickSearch(qs.query, qs.label)}
              disabled={searching}
              className="flex flex-col items-center gap-1.5 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-primary/40 rounded-2xl text-center transition-all group disabled:opacity-50">
              <span className="text-xl">
                {qs.label.split(' ')[0]}
              </span>
              <span className="text-[10px] text-gray-400 group-hover:text-white font-medium leading-tight transition-colors">
                {qs.label.split(' ').slice(1).join(' ')}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* How it works info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 flex gap-3">
        <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"/>
        <div className="text-xs text-gray-400 space-y-1">
          <p className="font-bold text-white">Comment ça marche:</p>
          <p>🎯 <strong>Analyse visuelle CJ</strong>: Si disponible sur votre compte</p>
          <p>🧠 <strong>Recherche IA</strong>: Détecte le type de produit et trouve des similaires</p>
          <p>⚡ <strong>Recherche rapide</strong>: Par catégorie en 1 clic</p>
        </div>
      </div>
    </div>
  )
}

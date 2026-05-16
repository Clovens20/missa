'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Sparkles, Upload, Wand2,
  Image as ImageIcon, X,
  Check, Loader, RefreshCw,
  Plus, Minus, 
  ChevronDown, Info,
  Palette, CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface GeneratedImage {
  url: string
  color: string
  index: number
  alt: string
  selected: boolean
}

interface AIImageGeneratorProps {
  productName: string
  onImagesGenerated: (
    images: { url: string; alt: string }[]
  ) => void
}

const COLOR_PRESETS = [
  { name: 'Rouge', hex: '#EF4444' },
  { name: 'Bleu', hex: '#3B82F6' },
  { name: 'Vert', hex: '#22C55E' },
  { name: 'Noir', hex: '#111111' },
  { name: 'Blanc', hex: '#F9FAFB' },
  { name: 'Rose', hex: '#EC4899' },
  { name: 'Jaune', hex: '#EAB308' },
  { name: 'Violet', hex: '#A855F7' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Beige', hex: '#D2B48C' },
  { name: 'Marine', hex: '#1E3A5F' },
  { name: 'Bordeaux', hex: '#800020' },
]

const BACKGROUND_OPTIONS = [
  { value: 'white', label: '⬜ Blanc pur', desc: 'Studio professionnel' },
  { value: 'gradient', label: '🌅 Dégradé', desc: 'Fond subtil' },
  { value: 'lifestyle', label: '🌿 Lifestyle', desc: 'Ambiance naturelle' },
  { value: 'transparent', label: '🔲 Transparent', desc: 'Fond transparent' },
]

const ANGLE_OPTIONS = [
  { value: 'front', label: '⬛ Face', desc: 'Vue de face' },
  { value: 'angle', label: '◱ 3/4', desc: 'Vue 3/4' },
  { value: 'side', label: '▷ Profil', desc: 'Vue de côté' },
  { value: 'detail', label: '🔍 Détail', desc: 'Gros plan' },
  { value: 'flat', label: '📐 Flat lay', desc: 'Vue du dessus' },
]

const MODE_OPTIONS = [
  { 
    value: 'recolor',
    label: '🎨 Recolorer',
    desc: 'Change la couleur de ta photo',
    needsRef: true,
  },
  { 
    value: 'variation',
    label: '✨ Variation',
    desc: 'Crée des variantes de ta photo',
    needsRef: true,
  },
  { 
    value: 'generate',
    label: '🚀 Générer',
    desc: 'Génère sans photo de référence',
    needsRef: false,
  },
]

export default function AIImageGenerator({
  productName,
  onImagesGenerated,
}: AIImageGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = 
    useState('recolor')
  const [referenceImage, setReferenceImage] = 
    useState<string | null>(null)
  const [referenceFile, setReferenceFile] = 
    useState<File | null>(null)
  
  // Color groups
  const [colorGroups, setColorGroups] = 
    useState<{ 
      color: string; count: number 
    }[]>([
      { color: 'Rouge', count: 2 },
      { color: 'Bleu', count: 2 },
    ])
  
  const [background, setBackground] = 
    useState('white')
  const [angle, setAngle] = useState('front')
  
  // Natural language instruction
  const [instruction, setInstruction] = 
    useState('')
  const [parsing, setParsing] = 
    useState(false)
  const [instructionMode, 
    setInstructionMode] = 
    useState<'manual' | 'text'>('text')
  
  // Generation state
  const [generating, setGenerating] = 
    useState(false)
  const [progress, setProgress] = 
    useState(0)
  const [generatedImages, 
    setGeneratedImages] = 
    useState<GeneratedImage[]>([])
  const [currentColor, setCurrentColor] = 
    useState('')
  
  const fileRef = useRef<HTMLInputElement>(null)

  // Upload reference image
  async function handleRefUpload(
    file: File
  ) {
    setReferenceFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImage(
        e.target?.result as string
      )
    }
    reader.readAsDataURL(file)
    toast.success('Photo de référence chargée!')
  }

  async function deleteImageFromStorage(imageUrl: string) {
    try {
      if (!imageUrl.includes('supabase.co')) return

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

  // Upload reference to Supabase
  // and get URL
  // Safe uploadReference — no stale state
  async function uploadReference(): Promise<string | null> {
    // If no file, return existing URL
    if (!referenceFile && referenceImage) {
      // Already a URL or base64
      return referenceImage
    }
    
    if (!referenceFile) return null

    try {
      const formData = new FormData()
      formData.append('file', referenceFile)

      const res = await fetch(
        '/api/admin/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!res.ok) {
        // Fallback to base64
        return referenceImage
      }

      const data = await res.json()
      return data.url || referenceImage

    } catch (err) {
      console.error('Upload error:', err)
      // Always fallback to base64
      // so generation still works
      return referenceImage
    }
  }

  // Parse natural language instruction
  async function parseInstruction() {
    if (!instruction.trim()) return
    setParsing(true)
    try {
      const res = await fetch(
        '/api/admin/ai-images/parse',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            instructions: instruction 
          }),
        }
      )
      const data = await res.json()
      
      if (data.colors?.length > 0) {
        setColorGroups(data.colors)
        if (data.background !== 'white') {
          setBackground(data.background)
        }
        if (data.angle !== 'front') {
          setAngle(data.angle)
        }
        toast.success(
          `✅ Compris! ${data.colors.length} couleur(s) détectée(s)`
        )
      }
    } catch (err) {
      toast.error('Impossible de parser')
    } finally {
      setParsing(false)
    }
  }

  // Total images to generate
  const totalImages = colorGroups.reduce(
    (sum, g) => sum + g.count, 0
  )

  // Generate images
  async function generate() {
    if (colorGroups.length === 0) {
      toast.error('Ajoutez au moins une couleur')
      return
    }
    if (mode !== 'generate' && 
      !referenceImage) {
      toast.error('Uploadez une photo de référence')
      return
    }

    setGenerating(true)
    setProgress(0)
    setGeneratedImages([])

    try {
      let refUrl = null
      if (referenceImage) {
        refUrl = await uploadReference()
      }

      // Simulate progress
      const total = totalImages
      let done = 0
      
      const progressInterval = setInterval(
        () => {
          done++
          setCurrentColor(
            colorGroups[
              Math.floor(done / 
                (total / colorGroups.length)
              )]?.color || ''
          )
          setProgress(
            Math.min(
              Math.round((done / total) * 95), 
              95
            )
          )
        }, 
        2000
      )

      const res = await fetch(
        '/api/admin/ai-images',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            referenceImageUrl: refUrl,
            productName,
            colors: colorGroups,
            background,
            angle,
            mode,
          }),
        }
      )

      clearInterval(progressInterval)
      setProgress(100)

      const data = await res.json()

      if (!res.ok) {
        toast.error(
          '❌ Erreur API: ' + 
          (data.error || 'Erreur inconnue')
        )
        return
      }

      if (data.errors?.length > 0) {
        console.warn(
          'Generation errors:', data.errors
        )
      }

      if (!data.images || 
        data.images.length === 0) {
        toast.error(
          '❌ Aucune image générée. ' +
          'Vérifiez votre clé fal.ai ' +
          'et réessayez.'
        )
        // Show errors if any
        if (data.errors?.length > 0) {
          console.error(
            'Generation errors:',
            data.errors
          )
          toast.error(
            'Détail: ' + 
            data.errors[0]
          )
        }
        return
      }

      const images: GeneratedImage[] = 
        data.images.map((img: any) => ({
          ...img,
          selected: true,
        }))

      setGeneratedImages(images)
      toast.success(
        `🎨 ${images.length} image(s) ` +
        `générée(s) avec succès!`
      )

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // Add selected images to product
  function addToProduct() {
    const selected = generatedImages
      .filter(img => img.selected)
      .map(img => ({
        url: img.url,
        alt: img.alt,
      }))

    if (selected.length === 0) {
      toast.error(
        'Sélectionnez au moins une image'
      )
      return
    }

    onImagesGenerated(selected)
    setOpen(false)
    setGeneratedImages([])
    toast.success(
      `✅ ${selected.length} image(s) ajoutée(s) au produit!`
    )
  }

  // Update color group
  function updateColorGroup(
    i: number, 
    field: 'color' | 'count', 
    value: string | number
  ) {
    setColorGroups(prev => {
      const updated = [...prev]
      updated[i] = { 
        ...updated[i], 
        [field]: value 
      }
      return updated
    })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 
          bg-gradient-to-r from-purple-600 
          to-primary hover:from-purple-700 
          hover:to-primary-dark text-white 
          font-black px-5 py-3 rounded-2xl 
          text-sm transition-all shadow-lg 
          shadow-purple-500/25 
          hover:shadow-purple-500/40 
          hover:scale-[1.02]">
        <Sparkles className="w-4 h-4"/>
        Générer avec IA
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !generating && 
                setOpen(false)}
              className="fixed inset-0 
                bg-black/70 z-[100] 
                backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ 
                opacity: 0, x: '100%' 
              }}
              animate={{ 
                opacity: 1, x: 0 
              }}
              exit={{ 
                opacity: 0, x: '100%' 
              }}
              transition={{ 
                type: 'spring', 
                damping: 25 
              }}
              className="fixed right-0 top-0 
                bottom-0 w-full max-w-2xl 
                bg-gray-950 z-[101] 
                overflow-y-auto 
                border-l border-gray-800 
                shadow-2xl">
              
              {/* Header */}
              <div className="sticky top-0 
                bg-gray-950/95 
                backdrop-blur-sm 
                border-b border-gray-800 
                px-6 py-4 flex items-center 
                justify-between z-10">
                <div className="flex items-center 
                  gap-3">
                  <div className="w-10 h-10 
                    bg-gradient-to-br 
                    from-purple-600 to-primary 
                    rounded-2xl flex items-center 
                    justify-center">
                    <Sparkles className="w-5 h-5 
                      text-white"/>
                  </div>
                  <div>
                    <h2 className="font-black 
                      text-white">
                      Générateur IA
                    </h2>
                    <p className="text-xs 
                      text-gray-500">
                      {productName || 
                        'Produit sans nom'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !generating && 
                    setOpen(false)}
                  disabled={generating}
                  className="w-9 h-9 
                    bg-gray-800 rounded-xl 
                    flex items-center 
                    justify-center 
                    hover:bg-gray-700 
                    text-gray-400 
                    hover:text-white 
                    transition-colors 
                    disabled:opacity-50">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="p-6 space-y-6">

                {/* MODE SELECTOR */}
                <div>
                  <p className="text-xs 
                    font-black text-gray-400 
                    uppercase tracking-wide mb-3">
                    Mode de génération
                  </p>
                  <div className="grid 
                    grid-cols-3 gap-3">
                    {MODE_OPTIONS.map(m => (
                      <button
                        type="button"
                        key={m.value}
                        onClick={() => 
                          setMode(m.value)}
                        className={`p-3 
                          rounded-2xl border-2 
                          text-left transition-all
                          ${mode === m.value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-800 hover:border-gray-600'
                          }`}>
                        <p className="text-sm 
                          font-black text-white 
                          mb-0.5">
                          {m.label}
                        </p>
                        <p className="text-[10px] 
                          text-gray-500">
                          {m.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                    {/* Reference image upload */}
                    {MODE_OPTIONS.find(
                      m => m.value === mode
                    )?.needsRef && (
                      <div>
                        <p className="text-xs font-black 
                          text-gray-400 uppercase 
                          tracking-wide mb-3">
                          Photo de référence *
                        </p>

                        {/* Hidden file input */}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]
                            if (!f) return

                            // Show preview immediately
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              setReferenceImage(
                                ev.target?.result as string
                              )
                            }
                            reader.readAsDataURL(f)
                            setReferenceFile(f)
                            toast.success(
                              '📸 Photo chargée!'
                            )

                            // Reset input so same file
                            // can be selected again
                            e.target.value = ''
                          }}
                        />

                        {!referenceImage ? (
                          /* Upload zone */
                          <div
                            onClick={() => {
                              // Programmatically click 
                              // the hidden input
                              fileRef.current?.click()
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const f = 
                                e.dataTransfer.files?.[0]
                              if (!f) return
                              if (!f.type
                                .startsWith('image/')) {
                                toast.error(
                                  'Fichier image requis'
                                )
                                return
                              }
                              // Trigger same logic as input
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                setReferenceImage(
                                  ev.target?.result as string
                                )
                              }
                              reader.readAsDataURL(f)
                              setReferenceFile(f)
                              toast.success(
                                '📸 Photo chargée!'
                              )
                            }}
                            className="border-2 border-dashed 
                              border-gray-700 
                              hover:border-primary/60 
                              hover:bg-primary/5
                              rounded-2xl p-10 text-center 
                              cursor-pointer transition-all
                              active:scale-[0.99]
                              select-none">
                            
                            <div className="w-16 h-16 
                              bg-gray-800 rounded-2xl 
                              flex items-center justify-center 
                              mx-auto mb-4">
                              <Upload className="w-8 h-8 
                                text-gray-500"/>
                            </div>
                            
                            <p className="text-white 
                              font-bold mb-1">
                              Cliquez pour uploader
                            </p>
                            <p className="text-gray-500 
                              text-sm mb-1">
                              ou glissez votre image ici
                            </p>
                            <p className="text-gray-600 
                              text-xs">
                              JPG · PNG · WEBP · max 10MB
                            </p>
                          </div>
                        ) : (
                          /* Preview */
                          <div className="relative 
                            rounded-2xl overflow-hidden 
                            bg-gray-800 border 
                            border-gray-700">
                            <img
                              src={referenceImage}
                              alt="Référence"
                              className="w-full max-h-56 
                                object-contain"
                            />
                            
                            {/* Overlay buttons */}
                            <div className="absolute 
                              inset-0 bg-black/40 
                              transition-all flex items-center 
                              justify-center gap-3 
                              opacity-0 hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => 
                                  fileRef.current?.click()}
                                className="flex items-center 
                                  gap-2 bg-white text-gray-900 
                                  font-bold px-4 py-2 
                                  rounded-xl text-sm 
                                  hover:bg-gray-100 
                                  transition-colors">
                                <Upload className="w-4 h-4"/>
                                Changer
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReferenceImage(null)
                                  setReferenceFile(null)
                                }}
                                className="flex items-center 
                                  gap-2 bg-red-500 text-white 
                                  font-bold px-4 py-2 
                                  rounded-xl text-sm 
                                  hover:bg-red-600 
                                  transition-colors">
                                <X className="w-4 h-4"/>
                                Supprimer
                              </button>
                            </div>

                            {/* Status badge */}
                            <div className="absolute 
                              top-3 left-3 
                              bg-secondary text-white 
                              text-[10px] font-black 
                              px-3 py-1.5 rounded-full 
                              flex items-center gap-1.5">
                              <CheckCircle 
                                className="w-3 h-3"/>
                              Photo prête
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                {/* INSTRUCTION MODE TOGGLE */}
                <div>
                  <div className="flex items-center 
                    justify-between mb-3">
                    <p className="text-xs 
                      font-black text-gray-400 
                      uppercase tracking-wide">
                      Couleurs à générer
                    </p>
                    <div className="flex gap-1 
                      bg-gray-800 rounded-xl p-1">
                      {([
                        ['manual', '🎨 Manuel'],
                        ['text', '💬 Texte'],
                      ] as const).map(
                        ([m, label]) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => 
                            setInstructionMode(m)}
                          className={`px-3 py-1.5 
                            rounded-lg text-xs 
                            font-bold transition-all
                            ${instructionMode === m
                              ? 'bg-primary text-white'
                              : 'text-gray-400 hover:text-white'
                            }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {instructionMode === 'text' ? (
                    /* Natural language input */
                    <div className="space-y-3">
                      <p className="text-xs font-black 
                        text-gray-400 uppercase 
                        tracking-wide flex items-center 
                        gap-2">
                        <Wand2 className="w-3.5 h-3.5 
                          text-purple-400"/>
                        Donnez vos instructions à l'IA
                      </p>
                      
                      <textarea
                        value={instruction}
                        onChange={e => 
                          setInstruction(e.target.value)}
                        placeholder={
                          "Exemples:\n" +
                          "• 3 images en Rouge, 2 en Bleu\n" +
                          "• Génère 4 couleurs différentes\n" +
                          "• 2 en Noir fond blanc, 1 lifestyle rose\n" +
                          "• Recolore en Bordeaux et Marine"
                        }
                        rows={5}
                        className="w-full px-4 py-3 
                          bg-gray-800 border-2 
                          border-purple-500/30 
                          hover:border-purple-500/60
                          focus:border-purple-500
                          rounded-2xl text-white text-sm 
                          focus:outline-none resize-none 
                          placeholder:text-gray-600 
                          leading-relaxed transition-all"
                      />
                      
                      <button
                        type="button"
                        onClick={parseInstruction}
                        disabled={
                          parsing || 
                          !instruction.trim()
                        }
                        className="flex items-center 
                          gap-2 w-full justify-center
                          bg-purple-600 hover:bg-purple-700
                          text-white font-black 
                          px-4 py-3 rounded-xl text-sm 
                          transition-colors 
                          disabled:opacity-50">
                        {parsing ? (
                          <Loader className="w-4 h-4 
                            animate-spin"/>
                        ) : (
                          <Wand2 className="w-4 h-4"/>
                        )}
                        {parsing 
                          ? 'L\'IA analyse...' 
                          : '🧠 Analyser les instructions'}
                      </button>
                      
                      {/* Show parsed result */}
                      {colorGroups.length > 0 && 
                        instruction && (
                        <div className="bg-purple-500/10 
                          border border-purple-500/20 
                          rounded-xl p-3">
                          <p className="text-xs font-bold 
                            text-purple-300 mb-2">
                            ✅ Instructions comprises:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {colorGroups.map((g, i) => (
                              <span key={i}
                                className="text-xs 
                                  bg-gray-800 text-white 
                                  font-bold px-3 py-1.5 
                                  rounded-full flex 
                                  items-center gap-1.5 border border-gray-700">
                                <div
                                  className="w-3 h-3 
                                    rounded-full"
                                  style={{ 
                                    background: COLOR_PRESETS
                                      .find(c => 
                                        c.name === g.color
                                      )?.hex || '#888'
                                  }}
                                />
                                {g.color} × {g.count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Manual color builder */
                    <div className="space-y-3">
                      
                      {/* Color groups */}
                      {colorGroups.map((g, i) => (
                        <div key={i}
                          className="flex items-center 
                            gap-3 bg-gray-800/50 
                            border border-gray-800 
                            rounded-2xl p-3">
                          
                          {/* Color picker */}
                          <div className="flex-1">
                            <p className="text-[10px] 
                              text-gray-500 mb-1.5">
                              Couleur
                            </p>
                            <div className="flex 
                              flex-wrap gap-1.5">
                              {COLOR_PRESETS
                                .map(preset => (
                                <button
                                  type="button"
                                  key={preset.name}
                                  onClick={() => 
                                    updateColorGroup(
                                      i, 'color', 
                                      preset.name
                                    )}
                                  title={preset.name}
                                  className={`w-7 h-7 
                                    rounded-full 
                                    border-2 
                                    transition-all
                                    flex items-center 
                                    justify-center
                                    ${g.color === preset.name
                                      ? 'border-white scale-110'
                                      : 'border-transparent hover:border-gray-400'
                                    }`}
                                  style={{ 
                                    background: preset.hex 
                                  }}>
                                  {g.color === 
                                    preset.name && (
                                    <Check 
                                      className={`w-3 h-3 
                                        ${preset.hex === '#F9FAFB' || 
                                          preset.hex === '#EAB308'
                                          ? 'text-gray-800' 
                                          : 'text-white'
                                        }`}
                                    />
                                  )}
                                </button>
                              ))}
                            </div>
                            {g.color && (
                              <p className="text-xs 
                                text-gray-400 mt-1">
                                {g.color}
                              </p>
                            )}
                          </div>

                          {/* Count */}
                          <div className="flex-shrink-0">
                            <p className="text-[10px] 
                              text-gray-500 mb-1.5 
                              text-center">
                              Nb images
                            </p>
                            <div className="flex 
                              items-center gap-2">
                              <button
                                type="button"
                                onClick={() => 
                                  updateColorGroup(
                                    i, 'count', 
                                    Math.max(
                                      1, g.count - 1
                                    )
                                  )}
                                className="w-8 h-8 
                                  bg-gray-700 
                                  hover:bg-gray-600 
                                  rounded-xl 
                                  flex items-center 
                                  justify-center 
                                  text-white 
                                  transition-colors">
                                <Minus 
                                  className="w-3 h-3"/>
                              </button>
                              <span className="w-8 
                                text-center font-black 
                                text-white text-lg">
                                {g.count}
                              </span>
                              <button
                                type="button"
                                onClick={() => 
                                  updateColorGroup(
                                    i, 'count', 
                                    Math.min(
                                      5, g.count + 1
                                    )
                                  )}
                                className="w-8 h-8 
                                  bg-gray-700 
                                  hover:bg-gray-600 
                                  rounded-xl 
                                  flex items-center 
                                  justify-center 
                                  text-white 
                                  transition-colors">
                                <Plus 
                                  className="w-3 h-3"/>
                              </button>
                            </div>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => 
                              setColorGroups(
                                prev => prev.filter(
                                  (_, j) => j !== i
                                )
                              )}
                            className="w-8 h-8 
                              bg-red-500/10 
                              hover:bg-red-500/20 
                              text-red-400 
                              rounded-xl 
                              flex items-center 
                              justify-center 
                              flex-shrink-0 
                              transition-colors">
                            <X className="w-4 h-4"/>
                          </button>
                        </div>
                      ))}

                      {/* Add color group */}
                      <button
                        type="button"
                        onClick={() => 
                          setColorGroups(
                            prev => [
                              ...prev, 
                              { color: 'Rouge', count: 1 }
                            ]
                          )}
                        className="flex items-center 
                          gap-2 w-full 
                          border-2 border-dashed 
                          border-gray-700 
                          hover:border-primary/60 
                          text-gray-500 
                          hover:text-primary 
                          font-bold py-3 
                          rounded-2xl text-sm 
                          justify-center 
                          transition-colors">
                        <Plus className="w-4 h-4"/>
                        Ajouter une couleur
                      </button>
                    </div>
                  )}
                </div>

                {/* SETTINGS */}
                <div className="grid 
                  grid-cols-2 gap-4">
                  
                  {/* Background */}
                  <div>
                    <p className="text-xs 
                      font-black text-gray-400 
                      uppercase tracking-wide mb-2">
                      Fond
                    </p>
                    <div className="space-y-1.5">
                      {BACKGROUND_OPTIONS
                        .map(opt => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => 
                            setBackground(opt.value)}
                          className={`flex items-center 
                            gap-2.5 w-full px-3 py-2 
                            rounded-xl border 
                            text-left transition-all
                            ${background === opt.value
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-800 hover:border-gray-600'
                            }`}>
                          <span className="text-sm">
                            {opt.label.split(' ')[0]}
                          </span>
                          <div>
                            <p className="text-xs 
                              font-bold text-white">
                              {opt.label.split(' ')
                                .slice(1).join(' ')}
                            </p>
                            <p className="text-[10px] 
                              text-gray-500">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Angle */}
                  <div>
                    <p className="text-xs 
                      font-black text-gray-400 
                      uppercase tracking-wide mb-2">
                      Angle
                    </p>
                    <div className="space-y-1.5">
                      {ANGLE_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => 
                            setAngle(opt.value)}
                          className={`flex items-center 
                            gap-2.5 w-full px-3 py-2 
                            rounded-xl border 
                            text-left transition-all
                            ${angle === opt.value
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-800 hover:border-gray-600'
                            }`}>
                          <span className="text-sm">
                            {opt.label.split(' ')[0]}
                          </span>
                          <div>
                            <p className="text-xs 
                              font-bold text-white">
                              {opt.label.split(' ')
                                .slice(1).join(' ')}
                            </p>
                            <p className="text-[10px] 
                              text-gray-500">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="bg-gray-800/50 
                  border border-gray-800 
                  rounded-2xl p-4">
                  <div className="flex items-center 
                    justify-between mb-3">
                    <p className="text-sm 
                      font-black text-white">
                      Résumé de la génération
                    </p>
                    <span className="text-primary 
                      font-black text-sm">
                      {totalImages} image(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap 
                    gap-2">
                    {colorGroups.map((g, i) => (
                      <div key={i}
                        className="flex items-center 
                          gap-1.5 bg-gray-700 
                          px-3 py-1.5 rounded-full">
                        <div
                          className="w-3 h-3 
                            rounded-full"
                          style={{ 
                            background: COLOR_PRESETS
                              .find(
                                c => c.name === g.color
                              )?.hex || '#888'
                          }}
                        />
                        <span className="text-xs 
                          font-bold text-white">
                          {g.color} × {g.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] 
                    text-gray-500 mt-3">
                    Fond: {
                      BACKGROUND_OPTIONS.find(
                        b => b.value === background
                      )?.label
                    } · 
                    Angle: {
                      ANGLE_OPTIONS.find(
                        a => a.value === angle
                      )?.label
                    }
                  </p>
                </div>

                {/* GENERATE BUTTON */}
                <button
                  type="button"
                  onClick={generate}
                  disabled={
                    generating || 
                    colorGroups.length === 0 ||
                    (mode !== 'generate' && 
                      !referenceImage)
                  }
                  className="w-full flex items-center 
                    justify-center gap-3 
                    bg-gradient-to-r 
                    from-purple-600 to-primary 
                    hover:from-purple-700 
                    hover:to-primary-dark 
                    text-white font-black 
                    py-4 rounded-2xl text-base 
                    transition-all 
                    shadow-lg shadow-purple-500/25
                    disabled:opacity-50 
                    disabled:cursor-not-allowed">
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 
                        animate-spin"/>
                      Génération en cours...
                      {currentColor && (
                        <span className="text-sm 
                          opacity-75">
                          ({currentColor})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5"/>
                      Générer {totalImages} image(s)
                    </>
                  )}
                </button>

                {/* PROGRESS BAR */}
                {generating && (
                  <div className="space-y-2">
                    <div className="h-2 
                      bg-gray-800 rounded-full 
                      overflow-hidden">
                      <motion.div
                        animate={{ 
                          width: `${progress}%` 
                        }}
                        transition={{ 
                          duration: 0.5 
                        }}
                        className="h-full 
                          bg-gradient-to-r 
                          from-purple-500 
                          to-primary 
                          rounded-full"
                      />
                    </div>
                    <p className="text-xs 
                      text-center text-gray-400">
                      {progress}% · 
                      {currentColor && 
                        `Génération ${currentColor}...`
                      }
                    </p>
                  </div>
                )}

                {/* GENERATED RESULTS */}
                {generatedImages.length > 0 && (
                  <div className="space-y-4">
                    
                    <div className="flex items-center 
                      justify-between">
                      <h3 className="font-black 
                        text-white flex items-center 
                        gap-2">
                        <ImageIcon 
                          className="w-5 h-5 
                            text-secondary"/>
                        Images générées
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => 
                            setGeneratedImages(
                              prev => prev.map(
                                img => ({
                                  ...img, 
                                  selected: true
                                })
                              )
                            )}
                          className="text-xs 
                            text-secondary 
                            font-bold 
                            hover:underline">
                          Tout sélect.
                        </button>
                        <button
                          type="button"
                          onClick={() => 
                            setGeneratedImages(
                              prev => prev.map(
                                img => ({
                                  ...img, 
                                  selected: false
                                })
                              )
                            )}
                          className="text-xs 
                            text-gray-500 
                            font-bold 
                            hover:underline">
                          Désélect.
                        </button>
                      </div>
                    </div>

                    {/* Group by color */}
                    {Array.from(
                      new Set(
                        generatedImages.map(
                          img => img.color
                        )
                      )
                    ).map(color => (
                      <div key={color}>
                        <p className="text-xs 
                          font-bold text-gray-400 
                          mb-2 flex items-center 
                          gap-2">
                          <div
                            className="w-3 h-3 
                              rounded-full"
                            style={{ 
                              background: COLOR_PRESETS
                                .find(
                                  c => c.name === color
                                )?.hex || '#888'
                            }}
                          />
                          {color}
                        </p>
                        <div className="grid 
                          grid-cols-3 gap-3">
                          {generatedImages
                            .filter(
                              img => img.color === color
                            )
                            .map((img, i) => (
                            <div
                              key={i}
                              onClick={() => 
                                setGeneratedImages(
                                  prev => prev.map(
                                    x => x === img
                                      ? { 
                                          ...x, 
                                          selected: !x.selected 
                                        }
                                      : x
                                  )
                                )}
                              className={`
                                relative rounded-2xl 
                                overflow-hidden 
                                cursor-pointer 
                                border-2 transition-all
                                ${img.selected
                                  ? 'border-secondary scale-[1.02]'
                                  : 'border-gray-800 opacity-60 hover:opacity-80'
                                }`}>
                              <img
                                src={img.url}
                                alt={img.alt}
                                className="w-full 
                                  aspect-square 
                                  object-cover"
                              />
                              {img.selected && (
                                <div className="absolute 
                                  top-2 right-2 
                                  w-6 h-6 
                                  bg-secondary 
                                  rounded-full 
                                  flex items-center 
                                  justify-center 
                                  shadow-lg">
                                  <Check 
                                    className="w-4 h-4 
                                      text-white"/>
                                </div>
                              )}

                              {/* Delete button for AI generated image */}
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (confirm('Supprimer cette image définitivement ?')) {
                                    setGeneratedImages(prev => 
                                      prev.filter(x => x.url !== img.url)
                                    )
                                    await deleteImageFromStorage(img.url)
                                    toast.success('Image supprimée')
                                  }
                                }}
                                className="absolute bottom-2 right-2 
                                  w-7 h-7 bg-red-500 hover:bg-red-600 
                                  text-white rounded-full 
                                  flex items-center justify-center 
                                  shadow-lg transition-all 
                                  z-10 opacity-0 group-hover:opacity-100 
                                  scale-75 group-hover:scale-100 
                                  duration-200">
                                <X className="w-4 h-4"/>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Add to product */}
                    <button
                      type="button"
                      onClick={addToProduct}
                      className="w-full flex 
                        items-center 
                        justify-center gap-2 
                        bg-secondary 
                        hover:bg-secondary-dark 
                        text-white font-black 
                        py-4 rounded-2xl 
                        text-base transition-all 
                        shadow-lg 
                        shadow-secondary/25">
                      <Check className="w-5 h-5"/>
                      Ajouter {
                        generatedImages.filter(
                          img => img.selected
                        ).length
                      } image(s) au produit
                    </button>

                    {/* Regenerate */}
                    <button
                      type="button"
                      onClick={generate}
                      disabled={generating}
                      className="w-full flex 
                        items-center 
                        justify-center gap-2 
                        bg-gray-800 
                        hover:bg-gray-700 
                        text-gray-300 font-bold 
                        py-3 rounded-2xl 
                        text-sm transition-colors">
                      <RefreshCw 
                        className="w-4 h-4"/>
                      Régénérer
                    </button>
                  </div>
                )}

                {/* PRICING INFO */}
                <div className="bg-blue-500/10 
                  border border-blue-500/20 
                  rounded-2xl p-4 
                  flex gap-3">
                  <Info className="w-4 h-4 
                    text-blue-400 flex-shrink-0 
                    mt-0.5"/>
                  <div className="text-xs 
                    text-blue-300 space-y-1">
                    <p className="font-bold">
                      Coût de génération:
                    </p>
                    <p>
                      🎨 Recolorer: ~$0.003/image
                    </p>
                    <p>
                      ✨ Variation: ~$0.003/image
                    </p>
                    <p>
                      🚀 Générer: ~$0.001/image
                    </p>
                    <p className="text-blue-400 mt-1">
                      💡 {totalImages} image(s) 
                      = ~${(totalImages * 0.003)
                        .toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

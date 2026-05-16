'use client'
import { useState } from 'react'
import { Star, Camera, X, Send } 
  from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StarRating } 
  from './ProductReviews'
import { toast } from 'sonner'

export default function ReviewForm({
  productId,
  productName,
  orderId,
  customerName: defaultName = '',
  customerEmail: defaultEmail = '',
  onSubmitted,
}: {
  productId: string
  productName: string
  orderId?: string
  customerName?: string
  customerEmail?: string
  onSubmitted?: () => void
}) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [name, setName] = 
    useState(defaultName)
  const [email, setEmail] = 
    useState(defaultEmail)
  const [images, setImages] = 
    useState<string[]>([])
  const [uploading, setUploading] = 
    useState(false)
  const [submitting, setSubmitting] = 
    useState(false)

  const RATING_LABELS = [
    '', 
    '😞 Très déçu',
    '😕 Déçu',
    '😐 Correct',
    '😊 Satisfait',
    '🤩 Excellent!',
  ]

  async function uploadImage(
    file: File
  ): Promise<string | null> {
    try {
      const ext = file.name.split('.').pop()
      const path = `reviews/${Date.now()}.${ext}`
      
      const { error } = await supabase
        .storage
        .from('product-images')
        .upload(path, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = 
        supabase.storage
          .from('product-images')
          .getPublicUrl(path)
      
      return publicUrl
    } catch {
      return null
    }
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      e.target.files || []
    )
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 photos')
      return
    }

    setUploading(true)
    const urls: string[] = []
    
    for (const file of files) {
      const url = await uploadImage(file)
      if (url) urls.push(url)
    }
    
    setImages(prev => [...prev, ...urls])
    setUploading(false)
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error(
        'Veuillez choisir une note'
      )
      return
    }
    if (!name.trim()) {
      toast.error('Votre nom est requis')
      return
    }
    if (!body.trim() || 
      body.length < 10) {
      toast.error(
        'Avis trop court (min 10 caractères)'
      )
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        order_id: orderId || null,
        customer_name: name.trim(),
        customer_email: email.trim() 
          || null,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        images: images.map(
          url => ({ url })
        ),
        is_verified: !!orderId,
        status: 'pending',
      })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    onSubmitted?.()
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit}
      className="bg-gray-50 
        border border-gray-200 
        rounded-3xl p-6 space-y-5">
      
      <div className="flex items-center 
        gap-3 mb-2">
        <div className="w-10 h-10 
          bg-amber-100 rounded-xl 
          flex items-center justify-center">
          <Star className="w-5 h-5 
            text-amber-500"/>
        </div>
        <div>
          <h3 className="font-black 
            text-gray-900">
            Votre avis
          </h3>
          <p className="text-gray-500 
            text-xs line-clamp-1">
            {productName}
          </p>
        </div>
      </div>

      {/* Star rating */}
      <div className="text-center 
        space-y-2">
        <p className="text-sm 
          text-gray-500 font-medium">
          Note globale *
        </p>
        <StarRating
          rating={rating}
          size="lg"
          interactive={true}
          onRate={setRating}
        />
        {rating > 0 && (
          <p className="text-sm 
            font-bold text-gray-700 
            animate-fade-in">
            {RATING_LABELS[rating]}
          </p>
        )}
      </div>

      {/* Name + Email */}
      <div className="grid 
        grid-cols-2 gap-3">
        <div>
          <label className="block 
            text-xs font-bold 
            text-gray-500 mb-1.5">
            Votre nom *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => 
              setName(e.target.value)}
            placeholder="Marie D."
            className="w-full px-4 py-2.5 
              border border-gray-200 
              rounded-xl text-gray-900 
              text-sm focus:outline-none 
              focus:border-primary 
              bg-white"
          />
        </div>
        <div>
          <label className="block 
            text-xs font-bold 
            text-gray-500 mb-1.5">
            Email (optionnel)
          </label>
          <input
            type="email"
            value={email}
            onChange={e => 
              setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="w-full px-4 py-2.5 
              border border-gray-200 
              rounded-xl text-gray-900 
              text-sm focus:outline-none 
              focus:border-primary 
              bg-white"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block 
          text-xs font-bold 
          text-gray-500 mb-1.5">
          Titre de l'avis (optionnel)
        </label>
        <input
          type="text"
          value={title}
          onChange={e => 
            setTitle(e.target.value)}
          placeholder="Super produit!"
          maxLength={100}
          className="w-full px-4 py-2.5 
            border border-gray-200 
            rounded-xl text-gray-900 
            text-sm focus:outline-none 
            focus:border-primary 
            bg-white"
        />
      </div>

      {/* Body */}
      <div>
        <div className="flex justify-between 
          mb-1.5">
          <label className="text-xs 
            font-bold text-gray-500">
            Votre avis *
          </label>
          <span className="text-xs 
            text-gray-400">
            {body.length}/500
          </span>
        </div>
        <textarea
          value={body}
          onChange={e => 
            setBody(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit... Qualité, taille, livraison..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 
            border border-gray-200 
            rounded-xl text-gray-900 
            text-sm focus:outline-none 
            focus:border-primary 
            bg-white resize-none 
            leading-relaxed"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="block 
          text-xs font-bold 
          text-gray-500 mb-2">
          Photos (optionnel, max 3)
        </label>
        <div className="flex gap-3 
          flex-wrap">
          {images.map((url, i) => (
            <div key={i}
              className="relative 
                w-20 h-20">
              <img
                src={url}
                alt={`Photo ${i+1}`}
                className="w-full h-full 
                  rounded-xl object-cover 
                  border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setImages(
                  prev => prev.filter(
                    (_, j) => j !== i
                  )
                )}
                className="absolute -top-2 
                  -right-2 w-5 h-5 
                  bg-red-500 text-white 
                  rounded-full flex 
                  items-center justify-center 
                  text-xs hover:bg-red-600">
                ×
              </button>
            </div>
          ))}
          
          {images.length < 3 && (
            <label className="w-20 h-20 
              border-2 border-dashed 
              border-gray-300 rounded-xl 
              flex flex-col items-center 
              justify-center cursor-pointer 
              hover:border-primary 
              hover:bg-primary/5 
              transition-colors">
              <Camera className="w-6 h-6 
                text-gray-400"/>
              <span className="text-[10px] 
                text-gray-400 mt-1">
                {uploading 
                  ? 'Upload...' 
                  : 'Ajouter'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                multiple
              />
            </label>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={
          submitting || 
          rating === 0 || 
          !name || 
          body.length < 10
        }
        className="w-full flex items-center 
          justify-center gap-2 
          bg-primary hover:bg-primary-dark 
          text-white font-black py-3.5 
          rounded-2xl text-sm 
          transition-all 
          shadow-lg shadow-primary/20 
          disabled:opacity-50">
        {submitting ? (
          <div className="w-4 h-4 
            border-2 border-white/30 
            border-t-white rounded-full 
            animate-spin"/>
        ) : (
          <Send className="w-4 h-4"/>
        )}
        {submitting 
          ? 'Envoi...' 
          : 'Publier mon avis'}
      </button>
      
      <p className="text-center 
        text-xs text-gray-400">
        🔒 Votre avis sera vérifié 
        avant publication
      </p>
    </form>
  )
}

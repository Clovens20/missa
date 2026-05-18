'use client'
import { useState, useEffect } 
  from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  Star, Check, X, MessageSquare,
  Eye, Filter, RefreshCw,
  Trash2, Reply, Edit
} from 'lucide-react'
import { StarRating } 
  from '@/components/shop/ProductReviews'
import { toast } from 'sonner'
import RichTextEditor from '@/components/admin/RichTextEditor'

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = 
    useState<any[]>([])
  const [filter, setFilter] = 
    useState<'pending'|'approved'|'rejected'>
    ('pending')
  const [loading, setLoading] = 
    useState(true)
  const [replyId, setReplyId] = 
    useState<string | null>(null)
  const [replyText, setReplyText] = 
    useState('')
  const [editingReview, setEditingReview] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    customer_name: '',
    rating: 5,
    title: '',
    body: '',
    is_verified: true,
  })

  useEffect(() => {
    loadReviews()
  }, [filter])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product:products(name, slug)
      `)
      .eq('status', filter)
      .order('created_at', 
        { ascending: false })
    
    setReviews(data || [])
    setLoading(false)
  }

  async function updateStatus(
    id: string,
    status: 'approved' | 'rejected'
  ) {
    const { error } = await supabase
      .from('product_reviews')
      .update({ status })
      .eq('id', id)
    
    if (!error) {
      setReviews(prev => 
        prev.filter(r => r.id !== id)
      )
      toast.success(
        status === 'approved'
          ? '✅ Avis approuvé!'
          : '❌ Avis rejeté'
      )
    }
  }

  async function submitReply(
    reviewId: string
  ) {
    if (!replyText.trim()) return
    
    const { error } = await supabase
      .from('product_reviews')
      .update({
        admin_reply: replyText.trim(),
        admin_reply_at: 
          new Date().toISOString(),
      })
      .eq('id', reviewId)
    
    if (!error) {
      setReplyId(null)
      setReplyText('')
      loadReviews()
      toast.success('Réponse publiée!')
    }
  }

  async function deleteReview(id: string) {
    if (!confirm('Supprimer cet avis?')) 
      return
    
    await supabase
      .from('product_reviews')
      .delete()
      .eq('id', id)
    
    setReviews(prev => 
      prev.filter(r => r.id !== id)
    )
    toast.success('Avis supprimé')
  }

  function startEdit(review: any) {
    setEditingReview(review)
    setEditForm({
      customer_name: review.customer_name || '',
      rating: review.rating || 5,
      title: review.title || '',
      body: review.body || '',
      is_verified: review.is_verified ?? true,
    })
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingReview) return

    const { error } = await supabase
      .from('product_reviews')
      .update({
        customer_name: editForm.customer_name,
        rating: editForm.rating,
        title: editForm.title,
        body: editForm.body,
        is_verified: editForm.is_verified,
      })
      .eq('id', editingReview.id)

    if (!error) {
      toast.success('✅ Avis mis à jour avec succès !')
      setEditingReview(null)
      loadReviews()
    } else {
      toast.error("Erreur lors de la modification de l'avis")
      console.error(error)
    }
  }

  const pendingCount = reviews.length

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center 
        justify-between">
        <div>
          <h1 className="text-2xl 
            font-black text-white">
            Gestion des Avis
          </h1>
          <p className="text-gray-400 
            text-sm mt-1">
            Modérez les avis clients
          </p>
        </div>
        <button
          onClick={loadReviews}
          className="p-2 bg-gray-800 
            hover:bg-gray-700 
            text-gray-400 rounded-xl 
            transition-colors">
          <RefreshCw className="w-5 h-5"/>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          ['pending', '⏳ En attente'],
          ['approved', '✅ Approuvés'],
          ['rejected', '❌ Rejetés'],
        ] as const).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 
              rounded-xl text-sm font-bold 
              transition-all
              ${filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
            {label}
            {f === 'pending' && 
              pendingCount > 0 && (
              <span className="ml-2 
                bg-red-500 text-white 
                text-[10px] font-black 
                px-1.5 py-0.5 
                rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i}
              className="bg-gray-800 
                rounded-2xl h-32 
                animate-pulse"/>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 
          bg-gray-900 rounded-2xl">
          <Star className="w-10 h-10 
            text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-400">
            Aucun avis {filter}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-900 
                border border-gray-800 
                rounded-2xl p-5 space-y-4">
              
              {/* Review header */}
              <div className="flex items-start 
                justify-between gap-4">
                <div>
                  <div className="flex 
                    items-center gap-3 mb-1">
                    <p className="font-bold 
                      text-white">
                      {review.customer_name}
                    </p>
                    <StarRating 
                      rating={review.rating}
                      size="sm"
                    />
                    {review.is_verified && (
                      <span className="text-[10px] 
                        text-secondary font-bold">
                        ✅ Achat vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-xs 
                    text-gray-500">
                    Produit: {' '}
                    <strong className="text-gray-400">
                      {review.product?.name}
                    </strong>
                    {' · '}
                    {new Date(review.created_at)
                      .toLocaleDateString('fr-CA')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 
                  flex-shrink-0">
                  {filter === 'pending' && (
                    <>
                      <button
                        onClick={() => 
                          updateStatus(
                            review.id, 
                            'approved'
                          )}
                        className="flex 
                          items-center gap-1.5 
                          bg-secondary/20 
                          hover:bg-secondary/30 
                          text-secondary 
                          font-bold px-3 py-1.5 
                          rounded-xl text-xs 
                          transition-colors">
                        <Check 
                          className="w-3.5 h-3.5"/>
                        Approuver
                      </button>
                      <button
                        onClick={() => 
                          updateStatus(
                            review.id, 
                            'rejected'
                          )}
                        className="flex 
                          items-center gap-1.5 
                          bg-red-500/10 
                          hover:bg-red-500/20 
                          text-red-400 
                          font-bold px-3 py-1.5 
                          rounded-xl text-xs 
                          transition-colors">
                        <X 
                          className="w-3.5 h-3.5"/>
                        Rejeter
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setReplyId(review.id)
                      setReplyText(
                        review.admin_reply || ''
                      )
                    }}
                    className="p-1.5 
                      bg-gray-800 
                      hover:bg-gray-700 
                      text-gray-400 
                      hover:text-white 
                      rounded-xl 
                      transition-colors"
                    title="Répondre"
                  >
                    <Reply 
                      className="w-4 h-4"/>
                  </button>
                  <button
                    onClick={() => startEdit(review)}
                    className="p-1.5 
                      bg-gray-800 
                      hover:bg-gray-700 
                      text-gray-400 
                      hover:text-white 
                      rounded-xl 
                      transition-colors"
                    title="Modifier l'avis"
                  >
                    <Edit className="w-4 h-4"/>
                  </button>
                  <button
                    onClick={() => 
                      deleteReview(review.id)}
                    className="p-1.5 
                      bg-red-500/10 
                      hover:bg-red-500/20 
                      text-red-400 rounded-xl 
                      transition-colors">
                    <Trash2 
                      className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Content */}
              {review.title && (
                <p className="font-semibold 
                  text-white">
                  {review.title}
                </p>
              )}
              <p className="text-gray-400 
                text-sm leading-relaxed">
                {review.body}
              </p>

              {/* Images */}
              {review.images?.length > 0 && (
                <div className="flex gap-2">
                  {review.images.map(
                    (img: any, i: number) => (
                    <div key={i}
                      className="w-14 h-14 
                        rounded-lg overflow-hidden 
                        bg-gray-800">
                      <img
                        src={img.url}
                        alt={`Photo ${i+1}`}
                        className="w-full h-full 
                          object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              {replyId === review.id && (
                <div className="space-y-2 
                  pt-3 border-t 
                  border-gray-800">
                  <RichTextEditor
                    value={replyText}
                    onChange={(html) => setReplyText(html)}
                    placeholder="Votre réponse publique..."
                    minHeight={150}
                    compact={true}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => 
                        submitReply(review.id)}
                      className="flex items-center 
                        gap-2 bg-primary 
                        hover:bg-primary-dark 
                        text-white font-bold 
                        px-4 py-2 rounded-xl 
                        text-sm transition-colors">
                      <Reply 
                        className="w-4 h-4"/>
                      Publier la réponse
                    </button>
                    <button
                      onClick={() => 
                        setReplyId(null)}
                      className="px-4 py-2 
                        bg-gray-800 
                        hover:bg-gray-700 
                        text-gray-400 
                        rounded-xl text-sm 
                        font-semibold 
                        transition-colors">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative space-y-4">
            <button 
              onClick={() => setEditingReview(null)}
              className="absolute top-4 right-4 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-primary fill-primary" />
              Modifier l'avis
            </h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom du Client</label>
                <input 
                  type="text" 
                  required
                  value={editForm.customer_name}
                  onChange={e => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Note (Étoiles)</label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, rating: star })}
                        className="transition-transform active:scale-95"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= editForm.rating 
                              ? 'text-primary fill-primary' 
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={editForm.is_verified}
                      onChange={e => setEditForm({ ...editForm, is_verified: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary/20 focus:ring-offset-gray-900 transition-colors"
                    />
                    <span className="text-xs font-bold text-gray-300">Achat vérifié</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Titre de l'avis (Optionnel)</label>
                <input 
                  type="text" 
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Ex: Excellent produit !"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Commentaire</label>
                <textarea 
                  rows={4}
                  required
                  value={editForm.body}
                  onChange={e => setEditForm({ ...editForm, body: e.target.value })}
                  placeholder="Écrivez le commentaire de l'avis..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95 text-sm"
                >
                  Sauvegarder les modifications
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all text-sm"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

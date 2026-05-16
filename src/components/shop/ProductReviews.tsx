'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Star, ThumbsUp, Camera,
  CheckCircle, ChevronDown,
  Filter, SortDesc, Image,
  MessageSquare, Award,
  AlertCircle, Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import ReviewForm from './ReviewForm'

interface ProductReviewsProps {
  productId: string
  productName: string
  reviewCount: number
  reviewAvg: number
  reviewBreakdown: Record<string, number>
}

// ── Star Rating Display ──────────────
export function StarRating({ 
  rating, 
  size = 'md',
  interactive = false,
  onRate,
}: { 
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRate?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i)}
          onMouseEnter={() => 
            interactive && setHover(i)}
          onMouseLeave={() => 
            interactive && setHover(0)}
          className={`transition-all
            ${interactive 
              ? 'cursor-pointer hover:scale-110' 
              : 'cursor-default'
            }`}>
          <Star className={`
            ${sizes[size]}
            transition-colors
            ${i <= (hover || rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ── Rating Breakdown Bar ─────────────
function RatingBar({ 
  stars, 
  count, 
  total,
  onFilter,
  active,
}: { 
  stars: number
  count: number
  total: number
  onFilter: () => void
  active: boolean
}) {
  const pct = total > 0 
    ? (count / total) * 100 
    : 0

  return (
    <button
      onClick={onFilter}
      className={`flex items-center 
        gap-3 w-full group transition-all
        ${active 
          ? 'opacity-100' 
          : 'opacity-70 hover:opacity-100'
        }`}>
      <span className="text-xs 
        text-gray-400 w-12 text-right 
        font-semibold flex-shrink-0">
        {stars} ⭐
      </span>
      <div className="flex-1 h-2 
        bg-gray-200 rounded-full 
        overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ 
            duration: 0.8, 
            ease: 'easeOut' 
          }}
          className={`h-full rounded-full
            ${active 
              ? 'bg-amber-400' 
              : 'bg-amber-300 group-hover:bg-amber-400'
            }`}
        />
      </div>
      <span className="text-xs 
        text-gray-500 w-8 
        flex-shrink-0">
        {count}
      </span>
    </button>
  )
}

// ── Single Review Card ───────────────
function ReviewCard({ 
  review,
  onHelpful,
}: { 
  review: any
  onHelpful: (id: string) => void
}) {
  const [expanded, setExpanded] = 
    useState(false)
  const isLong = 
    review.body?.length > 200

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border 
        border-gray-100 rounded-2xl 
        p-5 space-y-3">
      
      {/* Header */}
      <div className="flex items-start 
        justify-between gap-3">
        <div className="flex items-center 
          gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 
            rounded-full bg-gradient-to-br 
            from-primary to-secondary 
            flex items-center 
            justify-center flex-shrink-0">
            {review.customer_avatar ? (
              <img
                src={review.customer_avatar}
                alt={review.customer_name}
                className="w-full h-full 
                  rounded-full object-cover"
              />
            ) : (
              <span className="text-white 
                font-black text-sm">
                {review.customer_name
                  .charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div>
            <div className="flex items-center 
              gap-2">
              <p className="font-bold 
                text-gray-900 text-sm">
                {review.customer_name}
              </p>
              {review.is_verified && (
                <span className="flex 
                  items-center gap-1 
                  text-[10px] text-secondary 
                  font-bold">
                  <CheckCircle 
                    className="w-3 h-3"/>
                  Achat vérifié
                </span>
              )}
            </div>
            <p className="text-xs 
              text-gray-400">
              {new Date(review.created_at)
                .toLocaleDateString('fr-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </p>
          </div>
        </div>
        
        <StarRating 
          rating={review.rating} 
          size="sm"
        />
      </div>

      {/* Title */}
      {review.title && (
        <p className="font-bold 
          text-gray-900">
          {review.title}
        </p>
      )}

      {/* Body */}
      <div>
        <p className={`text-gray-600 
          text-sm leading-relaxed
          ${!expanded && isLong 
            ? 'line-clamp-3' 
            : ''
          }`}>
          {review.body}
        </p>
        {isLong && (
          <button
            onClick={() => 
              setExpanded(!expanded)}
            className="text-primary 
              text-xs font-semibold 
              mt-1 hover:underline">
            {expanded 
              ? 'Voir moins' 
              : 'Lire plus...'}
          </button>
        )}
      </div>

      {/* Review images */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 
          flex-wrap">
          {review.images.map(
            (img: any, i: number) => (
            <div key={i}
              className="w-16 h-16 
                rounded-xl overflow-hidden 
                border border-gray-100 
                cursor-pointer 
                hover:opacity-90 
                transition-opacity">
              <img
                src={img.url}
                alt={img.alt || 
                  `Photo ${i+1}`}
                className="w-full h-full 
                  object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Admin reply */}
      {review.admin_reply && (
        <div className="bg-primary/5 
          border-l-4 border-primary 
          rounded-r-xl p-3 
          flex gap-3">
          <Award className="w-4 h-4 
            text-primary flex-shrink-0 
            mt-0.5"/>
          <div>
            <p className="text-xs 
              font-bold text-primary mb-1">
              Réponse de Missa Shop
            </p>
            <p className="text-xs 
              text-gray-600">
              {review.admin_reply}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center 
        justify-between pt-2 
        border-t border-gray-50">
        <button
          onClick={() => 
            onHelpful(review.id)}
          className="flex items-center 
            gap-1.5 text-xs text-gray-400 
            hover:text-gray-600 
            transition-colors group">
          <ThumbsUp className="w-3.5 h-3.5 
            group-hover:text-primary 
            transition-colors"/>
          Utile ({review.helpful_count})
        </button>
      </div>
    </motion.div>
  )
}

// ── MAIN COMPONENT ───────────────────
export default function ProductReviews({
  productId,
  productName,
  reviewCount,
  reviewAvg,
  reviewBreakdown,
}: ProductReviewsProps) {
  const [reviews, setReviews] = 
    useState<any[]>([])
  const [loading, setLoading] = 
    useState(true)
  const [filterStar, setFilterStar] = 
    useState<number | null>(null)
  const [sortBy, setSortBy] = 
    useState<'recent' | 'helpful' | 'high' | 'low'>
    ('recent')
  const [showForm, setShowForm] = 
    useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = 
    useState(true)
  const PER_PAGE = 5
  
  // Use ref to track current page
  // avoids stale state in async calls
  const pageRef = useRef(1)
  const isLoadingMore = useRef(false)

  useEffect(() => {
    // Reset page ref on filter/sort change
    pageRef.current = 1
    loadReviews(true)
  }, [filterStar, sortBy, productId])

  async function loadReviews(
    reset = false
  ) {
    // Prevent double loading
    if (isLoadingMore.current) return
    isLoadingMore.current = true

    // Reset page ref if needed
    if (reset) {
      pageRef.current = 1
      setPage(1)
    }

    setLoading(true)

    // Use pageRef.current directly
    // NOT the state value (which may be stale)
    const currentPage = pageRef.current

    try {
      let query = supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')

      if (filterStar) {
        query = query.eq('rating', filterStar)
      }

      switch (sortBy) {
        case 'helpful':
          query = query.order(
            'helpful_count', 
            { ascending: false }
          )
          break
        case 'high':
          query = query.order(
            'rating', 
            { ascending: false }
          )
          break
        case 'low':
          query = query.order(
            'rating', 
            { ascending: true }
          )
          break
        default:
          query = query.order(
            'created_at', 
            { ascending: false }
          )
      }

      query = query.range(
        (currentPage - 1) * PER_PAGE,
        currentPage * PER_PAGE - 1
      )

      const { data } = await query

      if (reset) {
        setReviews(data || [])
      } else {
        // Only append if we have new data
        // AND it's not a duplicate
        setReviews(prev => {
          const existingIds = new Set(
            prev.map(r => r.id)
          )
          const newReviews = (data || [])
            .filter(r => !existingIds.has(r.id))
          return [...prev, ...newReviews]
        })
      }

      setHasMore(
        (data?.length || 0) === PER_PAGE
      )

    } catch (err) {
      console.error('loadReviews error:', err)
    } finally {
      setLoading(false)
      isLoadingMore.current = false
    }
  }

  // Safe loadMore — no stale state
  function loadMore() {
    // Guard: already loading
    if (isLoadingMore.current) return
    if (!hasMore) return

    // Increment ref first
    // BEFORE calling async function
    pageRef.current = pageRef.current + 1
    setPage(pageRef.current)

    // Now call with the correct page
    loadReviews(false)
  }

  async function voteHelpful(
    reviewId: string
  ) {
    await supabase
      .from('review_votes')
      .insert({ review_id: reviewId })
    
    // Using simple update since increment rpc might not exist
    const { data: current } = await supabase.from('product_reviews').select('helpful_count').eq('id', reviewId).single()
    await supabase.from('product_reviews').update({ helpful_count: (current?.helpful_count || 0) + 1 }).eq('id', reviewId)
    
    setReviews(prev => prev.map(r =>
      r.id === reviewId
        ? { 
            ...r, 
            helpful_count: 
              (r.helpful_count || 0) + 1 
          }
        : r
    ))
    toast.success('Merci pour votre vote!')
  }

  const totalReviews = Object.values(
    reviewBreakdown || {}
  ).reduce((a, b) => a + Number(b), 0)

  return (
    <div className="space-y-6">
      
      {/* Section header */}
      <div className="flex items-center 
        justify-between flex-wrap gap-4">
        <h2 className="text-2xl 
          font-black text-gray-900">
          Avis clients
          {reviewCount > 0 && (
            <span className="text-gray-400 
              font-normal text-lg ml-2">
              ({reviewCount})
            </span>
          )}
        </h2>
        <button
          onClick={() => 
            setShowForm(!showForm)}
          className="flex items-center 
            gap-2 bg-primary 
            hover:bg-primary-dark 
            text-white font-bold 
            px-5 py-2.5 rounded-xl 
            text-sm transition-all 
            shadow-md shadow-primary/20">
          <Star className="w-4 h-4"/>
          Laisser un avis
        </button>
      </div>

      {/* Rating summary */}
      {reviewCount > 0 && (
        <div className="bg-gray-50 
          rounded-3xl p-6 grid 
          md:grid-cols-2 gap-6">
          
          {/* Average */}
          <div className="flex flex-col 
            items-center justify-center 
            text-center">
            <p className="text-6xl 
              font-black text-gray-900 
              leading-none mb-2">
              {reviewAvg.toFixed(1)}
            </p>
            <StarRating 
              rating={Math.round(reviewAvg)}
              size="lg"
            />
            <p className="text-gray-500 
              text-sm mt-2">
              Basé sur {reviewCount} avis
            </p>
            {reviewAvg >= 4.5 && (
              <div className="flex items-center 
                gap-1.5 mt-3 bg-secondary/10 
                text-secondary text-xs 
                font-bold px-3 py-1.5 
                rounded-full">
                <Award className="w-3.5 h-3.5"/>
                Produit fortement recommandé
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {[5,4,3,2,1].map(stars => (
              <RatingBar
                key={stars}
                stars={stars}
                count={Number(
                  reviewBreakdown?.[stars] || 0
                )}
                total={totalReviews}
                active={filterStar === stars}
                onFilter={() => 
                  setFilterStar(
                    filterStar === stars 
                      ? null 
                      : stars
                  )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <ReviewForm
              productId={productId}
              productName={productName}
              onSubmitted={() => {
                setShowForm(false)
                loadReviews(true)
                toast.success(
                  '✅ Avis soumis! ' +
                  'Il sera visible après modération.'
                )
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Sort */}
      {reviewCount > 0 && (
        <div className="flex items-center 
          gap-3 flex-wrap">
          
          {filterStar && (
            <button
              onClick={() => 
                setFilterStar(null)}
              className="flex items-center 
                gap-1.5 bg-amber-100 
                text-amber-700 font-bold 
                px-3 py-1.5 rounded-xl 
                text-xs hover:bg-amber-200 
                transition-colors">
              {filterStar}⭐ seulement
              × 
            </button>
          )}

          <div className="ml-auto 
            flex items-center gap-2">
            <SortDesc className="w-4 h-4 
              text-gray-400"/>
            <select
              value={sortBy}
              onChange={e => 
                setSortBy(
                  e.target.value as any
                )}
              className="bg-white border 
                border-gray-200 rounded-xl 
                px-3 py-1.5 text-sm 
                text-gray-600 
                focus:outline-none 
                focus:border-primary">
              <option value="recent">
                Plus récents
              </option>
              <option value="helpful">
                Plus utiles
              </option>
              <option value="high">
                Meilleures notes
              </option>
              <option value="low">
                Notes les plus basses
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading && reviews.length === 0 ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i}
              className="bg-gray-100 
                rounded-2xl h-32 
                animate-pulse"/>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 
          bg-gray-50 rounded-3xl">
          <Star className="w-12 h-12 
            text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 
            font-semibold mb-2">
            {filterStar 
              ? `Aucun avis ${filterStar}⭐`
              : 'Aucun avis pour le moment'
            }
          </p>
          <p className="text-gray-400 
            text-sm mb-5">
            Soyez le premier à laisser 
            un avis sur ce produit!
          </p>
          <button
            onClick={() => 
              setShowForm(true)}
            className="bg-primary 
              text-white font-bold 
              px-6 py-2.5 rounded-xl 
              text-sm hover:bg-primary-dark 
              transition-colors">
            Écrire un avis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={voteHelpful}
            />
          ))}
          
          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading || 
                isLoadingMore.current}
              className="w-full flex items-center 
                justify-center gap-2 bg-gray-100 
                hover:bg-gray-200 text-gray-600 
                font-bold py-3 rounded-2xl text-sm 
                transition-colors disabled:opacity-50 
                disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-4 h-4 
                  border-2 border-gray-400 
                  border-t-gray-600 rounded-full 
                  animate-spin"/>
              ) : (
                <ChevronDown className="w-4 h-4"/>
              )}
              {loading 
                ? 'Chargement...' 
                : 'Voir plus d\'avis'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

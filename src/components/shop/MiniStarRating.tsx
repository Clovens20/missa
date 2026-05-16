'use client'
import { Star } from 'lucide-react'
import Link from 'next/link'

export default function MiniStarRating({
  avg,
  count,
  productSlug,
}: {
  avg: number
  count: number
  productSlug?: string
}) {
  if (!count || count === 0) return (
    <p className="text-xs text-gray-400">
      Aucun avis
    </p>
  )

  const content = (
    <div className="flex items-center 
      gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <Star key={i}
            className={`w-3 h-3 
              ${i <= Math.round(avg)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
              }`}
          />
        ))}
      </div>
      <span className="text-xs 
        text-gray-500">
        <strong className="text-gray-700">
          {avg.toFixed(1)}
        </strong>
        {' '}({count})
      </span>
    </div>
  )

  if (productSlug) {
    return (
      <Link 
        href={`/product/${productSlug}#reviews`}
        className="hover:opacity-80 
          transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}

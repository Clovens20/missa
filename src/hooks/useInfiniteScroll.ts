import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  threshold?: number
  // 0.1 = trigger when 10% visible
  rootMargin?: string
  // '200px' = trigger 200px before end
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  threshold = 0.1,
  rootMargin = '400px',
}: UseInfiniteScrollOptions) {

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMoreRef = useRef(onLoadMore)
  loadMoreRef.current = onLoadMore

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (
          first.isIntersecting &&
          hasMore &&
          !loading
        ) {
          loadMoreRef.current()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.unobserve(sentinel)
      observer.disconnect()
    }
  }, [hasMore, loading, threshold, rootMargin])

  return { sentinelRef }
}

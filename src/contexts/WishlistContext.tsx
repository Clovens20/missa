'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Product } from '@/types'
import { toast } from 'sonner'

interface WishlistContextType {
  wishlist: { id: string, product: Product }[]
  items: string[]
  toggle: (product: Product) => void
  isInWishlist: (id: string) => boolean
  count: number
}

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType)

export function WishlistProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [wishlist, setWishlist] = useState<{ id: string, product: Product }[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('missa-wishlist-v2')
    if (saved) {
      try { 
        setWishlist(JSON.parse(saved)) 
      } catch {
        const old = localStorage.getItem('missa-wishlist')
        if (old) {
          // ignore old version for simplicity
        }
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('missa-wishlist-v2', JSON.stringify(wishlist))
  }, [wishlist])

  function toggle(product: Product) {
    setWishlist(prev => {
      const inList = prev.find(item => item.id === product.id)
      if (inList) {
        toast.info('Retiré des favoris')
        return prev.filter(item => item.id !== product.id)
      }
      toast.success('Ajouté aux favoris! ❤️')
      return [...prev, { id: product.id, product }]
    })
  }

  function isInWishlist(id: string) {
    return wishlist.some(item => item.id === id)
  }

  return (
    <WishlistContext.Provider value={{
      wishlist,
      items: wishlist.map(i => i.id),
      toggle,
      isInWishlist,
      count: wishlist.length
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)

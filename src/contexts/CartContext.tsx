'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CartItem, Product, ProductVariant } from '@/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getSessionId } from '@/lib/session'

interface CartContextType {
  items: CartItem[]
  total: number
  count: number
  isOpen: boolean
  guestEmail: string | null
  addItem: (product: Product, qty?: number, variant?: ProductVariant) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  toggleCart: () => void
  setGuestEmail: (email: string) => void
}

const CartContext = createContext<CartContextType>({} as CartContextType)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [guestEmail, setGuestEmailState] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  // Init session
  useEffect(() => {
    const sid = getSessionId()
    setSessionId(sid)
    
    // Load saved cart from localStorage
    const saved = localStorage.getItem('missa-cart')
    if (saved) {
      try { setItems(JSON.parse(saved)) } catch {}
    }

    // Load saved email
    const email = localStorage.getItem('missa-guest-email')
    if (email) setGuestEmailState(email)
  }, [])

  // Save to localStorage + sync to Supabase
  useEffect(() => {
    localStorage.setItem('missa-cart', JSON.stringify(items))
    
    if (sessionId) {
      const timer = setTimeout(() => {
        syncCartToSupabase(items)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [items, sessionId])

  async function syncCartToSupabase(cartItems: CartItem[]) {
    if (!sessionId) return
    
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    const cartData = {
      session_id: sessionId,
      email: guestEmail,
      customer_email: guestEmail?.toLowerCase() || null,
      items: cartItems.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        qty: item.quantity,
        image: item.product.images?.[0]?.url,
        variant: item.variant,
        slug: item.product.slug,
      })),
      total,
      cart_total: total,
      converted: false,
      recovered: false,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }

    await supabase.from('abandoned_carts').upsert(cartData, { onConflict: 'session_id' })
  }

  async function setGuestEmail(email: string) {
    setGuestEmailState(email)
    localStorage.setItem('missa-guest-email', email)
    
    if (sessionId) {
      await supabase
        .from('abandoned_carts')
        .update({ 
          email, 
          customer_email: email.toLowerCase(),
          updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
    }
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  function addItem(product: Product, qty = 1, variant?: ProductVariant) {
    setItems(prev => {
      const key = variant ? `${product.id}-${variant.id}` : product.id
      const existing = prev.find(i => i.id === key)
      if (existing) {
        return prev.map(i => i.id === key ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { id: key, product, quantity: qty, variant }]
    })
    toast.success(`✅ ${product.name} ajouté!`, { duration: 2000 })
    setIsOpen(true)
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeItem(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  function clearCart() {
    setItems([])
    localStorage.removeItem('missa-cart')
    if (sessionId) {
      supabase
        .from('abandoned_carts')
        .update({ converted: true, converted_at: new Date().toISOString() })
        .eq('session_id', sessionId)
    }
  }

  function toggleCart() { setIsOpen(prev => !prev) }

  return (
    <CartContext.Provider value={{
      items, total, count, isOpen, guestEmail,
      addItem, removeItem, updateQty, clearCart, toggleCart, setGuestEmail,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Search, ShoppingCart, 
  Heart, User, Menu 
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileNav() {
  const pathname = usePathname()
  const { count, toggleCart } = useCart()
  const { count: wishCount } = useWishlist()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems = [
    { href: '/', icon: Home, label: 'Accueil' },
    { href: '/catalog', icon: Search, label: 'Explorer' },
    { 
      onClick: toggleCart, 
      icon: ShoppingCart, 
      label: 'Panier', 
      badge: count 
    },
    { href: '/wishlist', icon: Heart, label: 'Favoris', badge: wishCount },
    { href: '/track', icon: User, label: 'Suivi' },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 pointer-events-none"
        >
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40 flex items-center justify-around p-2 pointer-events-auto max-w-md mx-auto">
            {navItems.map((item, i) => {
              const active = item.href === pathname
              const Icon = item.icon

              const content = (
                <div className="relative flex flex-col items-center gap-1 p-2 min-w-[64px]">
                  <Icon className={`w-6 h-6 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-tight transition-colors ${active ? 'text-primary' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                  
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-1 right-3 w-4 h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border border-gray-900">
                      {item.badge}
                    </span>
                  )}
                  
                  {active && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,53,0.8)]"
                    />
                  )}
                </div>
              )

              return item.onClick ? (
                <button key={i} onClick={item.onClick} className="flex-1 outline-none">
                  {content}
                </button>
              ) : (
                <Link key={i} href={item.href!} className="flex-1 outline-none">
                  {content}
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

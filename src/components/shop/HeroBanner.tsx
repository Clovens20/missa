'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STATIC_SLIDES = [
  {
    id: 1,
    title: 'Découvrez\nMissa Shop',
    subtitle: 'Tout ce dont vous avez besoin',
    button_text: 'Magasiner maintenant',
    button_link: '/catalog',
    gradient: 'from-orange-500 via-orange-400 to-green-500',
    badge: '🛍️ Nouvelles Arrivées',
    image_url: ''
  },
  {
    id: 2,
    title: 'Mode Premium\nÀ Petits Prix',
    subtitle: 'Qualité garantie, livraison rapide',
    button_text: 'Voir les offres',
    button_link: '/catalog?sale=true',
    gradient: 'from-green-500 via-green-400 to-orange-400',
    badge: '🏷️ Jusqu\'à -60%',
    image_url: ''
  }
]

export default function HeroBanner() {
  const [slides, setSlides] = useState<any[]>(STATIC_SLIDES)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    async function fetchBanners() {
      const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('sort_order')
      if (data && data.length > 0) {
        setSlides(data)
      }
    }
    fetchBanners()
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides])

  const slide = slides[current]

  return (
    <section className="relative overflow-hidden h-[300px] md:h-[380px]">
      
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center">
          
          {/* Background Image or Gradient */}
          {slide.image_url ? (
            <div className="absolute inset-0">
              <img src={slide.image_url} alt="" className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/40"/>
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}/>
          )}
          
          <div className="relative max-w-7xl mx-auto px-6 w-full z-10">
            {slide.badge && (
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block bg-white/20 backdrop-blur text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
                {slide.badge}
              </motion.span>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight whitespace-pre-line">
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg md:text-xl mb-8 max-w-xl">
              {slide.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}>
              <Link href={slide.button_link || '/'}
                className="inline-flex items-center gap-2 bg-white text-primary font-black px-8 py-4 rounded-2xl text-lg hover:scale-105 transition-transform shadow-xl active:scale-95">
                {slide.button_text || 'Découvrir'} →
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <button
        onClick={() => setCurrent(p => (p - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 hover:bg-white/50 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronLeft className="w-5 h-5"/>
      </button>

      <button
        onClick={() => setCurrent(p => (p + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 hover:bg-white/50 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronRight className="w-5 h-5"/>
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8' : 'bg-white/50 w-2'}`}
          />
        ))}
      </div>
    </section>
  )
}

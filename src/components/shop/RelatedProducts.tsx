'use client'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface RelatedProductsProps {
  title: string
  subtitle?: string
  products: Product[]
  accentColor?: 'primary' | 'secondary'
}

export default function RelatedProducts({
  title,
  subtitle,
  products,
  accentColor = 'primary'
}: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -400 : 400,
      behavior: 'smooth'
    })
  }

  if (!products.length) return null

  const accent = accentColor === 'primary'
    ? 'from-primary to-orange-400'
    : 'from-secondary to-green-400'

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">{title}</h2>
            {subtitle && <p className="text-gray-500">{subtitle}</p>}
            <div className={`w-12 h-1 bg-gradient-to-r ${accent} rounded-full mt-3`}/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll('left')} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={() => scroll('right')} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

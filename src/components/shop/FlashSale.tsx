'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Clock } from 'lucide-react'
import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface FlashSaleProps {
  products: Product[]
}

export default function FlashSale({ products }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 59, seconds: 59 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) { seconds = 59; minutes-- }
        if (minutes < 0) { minutes = 59; hours-- }
        if (hours < 0) { hours = 5; minutes = 59; seconds = 59 }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <section className="py-10 bg-gradient-to-r from-red-600 to-orange-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2"><Zap className="w-6 h-6 text-yellow-300 fill-yellow-300"/></div>
            <div><h2 className="text-2xl font-black text-white">⚡ VENTES FLASH</h2><p className="text-white/80 text-sm">Offres à durée limitée!</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white/80"/><span className="text-white/80 text-sm font-medium">Expire dans:</span>
            <div className="flex gap-1">
              {[ ['H', timeLeft.hours], ['M', timeLeft.minutes], ['S', timeLeft.seconds] ].map(([label, val], i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-gray-900 text-white font-black text-lg w-12 h-10 rounded-lg flex items-center justify-center font-mono shadow-lg">{pad(val as number)}</div>
                  <span className="text-white/60 text-[10px] mt-0.5 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {products.map((product, i) => (
            <motion.div key={product.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex-shrink-0 w-48 sm:w-56"><ProductCard product={product} index={i}/></motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

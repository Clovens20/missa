'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    name: 'Robes & Jupes',
    emoji: '👗',
    slug: 'robes-jupes',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-200 hover:border-pink-400',
    text: 'text-pink-600',
    count: '120+ styles',
    image: null,
  },
  {
    name: 'Sacs & Maroquinerie',
    emoji: '👜',
    slug: 'sacs',
    color: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-200 hover:border-amber-400',
    text: 'text-amber-600',
    count: '80+ modèles',
    image: null,
  },
  {
    name: 'Bijoux & Accessoires',
    emoji: '💍',
    slug: 'bijoux',
    color: 'from-yellow-400/20 to-amber-400/20',
    border: 'border-yellow-200 hover:border-yellow-400',
    text: 'text-yellow-600',
    count: '200+ pièces',
    image: null,
  },
  {
    name: 'Chaussures',
    emoji: '👠',
    slug: 'chaussures',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-200 hover:border-red-400',
    text: 'text-red-600',
    count: '90+ paires',
    image: null,
  },
  {
    name: 'Beauté & Soins',
    emoji: '💄',
    slug: 'beaute',
    color: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-200 hover:border-purple-400',
    text: 'text-purple-600',
    count: '150+ produits',
    image: null,
  },
  {
    name: 'Vêtements Homme',
    emoji: '👔',
    slug: 'homme',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-200 hover:border-blue-400',
    text: 'text-blue-600',
    count: '100+ articles',
    image: null,
  },
  {
    name: 'Enfants & Bébés',
    emoji: '🧸',
    slug: 'enfants',
    color: 'from-green-500/20 to-teal-500/20',
    border: 'border-green-200 hover:border-green-400',
    text: 'text-green-600',
    count: '60+ articles',
    image: null,
  },
  {
    name: 'Maison & Déco',
    emoji: '🏠',
    slug: 'maison',
    color: 'from-teal-500/20 to-cyan-500/20',
    border: 'border-teal-200 hover:border-teal-400',
    text: 'text-teal-600',
    count: '75+ articles',
    image: null,
  },
]

export default function HomepageCategories() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Section header */}
        <div className="flex items-end 
          justify-between mb-8">
          <div>
            <p className="text-primary 
              font-bold text-sm 
              uppercase tracking-wide mb-1">
              Explorez
            </p>
            <h2 className="text-3xl 
              font-black text-gray-900">
              Nos Catégories
            </h2>
          </div>
          <Link 
            href="/catalog"
            className="flex items-center 
              gap-1.5 text-primary 
              font-bold text-sm 
              hover:underline 
              hidden sm:flex">
            Tout voir
            <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 
          sm:grid-cols-3 lg:grid-cols-4 
          gap-3 sm:gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ 
                opacity: 0, 
                y: 20 
              }}
              whileInView={{ 
                opacity: 1, 
                y: 0 
              }}
              viewport={{ once: true }}
              transition={{ 
                delay: i * 0.05,
                duration: 0.4,
              }}>
              <Link
                href={`/catalog?category=${cat.slug}`}
                className={`
                  block p-5 rounded-2xl 
                  border-2 bg-gradient-to-br 
                  ${cat.color} ${cat.border}
                  transition-all duration-200 
                  hover:scale-[1.02] 
                  hover:shadow-lg group
                  relative overflow-hidden`}>
                
                {/* Background emoji watermark */}
                <div className="absolute 
                  -right-2 -bottom-2 
                  text-6xl opacity-10 
                  select-none 
                  group-hover:opacity-20 
                  transition-opacity">
                  {cat.emoji}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  
                  {/* Emoji */}
                  <div className="text-3xl 
                    mb-3 transform 
                    group-hover:scale-110 
                    transition-transform 
                    duration-200 
                    inline-block">
                    {cat.emoji}
                  </div>
                  
                  {/* Name */}
                  <h3 className={`font-black 
                    text-gray-900 text-sm 
                    sm:text-base 
                    leading-tight mb-1`}>
                    {cat.name}
                  </h3>
                  
                  {/* Count */}
                  <p className={`text-xs 
                    font-semibold 
                    ${cat.text} 
                    mb-3`}>
                    {cat.count}
                  </p>

                  {/* Arrow */}
                  <div className={`
                    flex items-center 
                    gap-1 text-xs font-bold 
                    ${cat.text} 
                    opacity-0 
                    group-hover:opacity-100 
                    transition-opacity 
                    -translate-x-2 
                    group-hover:translate-x-0 
                    transform duration-200`}>
                    Découvrir
                    <ArrowRight 
                      className="w-3 h-3"/>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile see all button */}
        <div className="text-center mt-6 
          sm:hidden">
          <Link
            href="/catalog"
            className="inline-flex items-center 
              gap-2 bg-gray-100 
              hover:bg-gray-200 
              text-gray-700 font-bold 
              px-6 py-3 rounded-2xl 
              text-sm transition-colors">
            Voir toutes les catégories
            <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </div>
    </section>
  )
}

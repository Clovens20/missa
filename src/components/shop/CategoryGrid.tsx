'use client'
import Link from 'next/link'
import type { Category } from '@/types'

interface CategoryGridProps {
  categories: Category[]
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-6 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          🗂️ Catégories
          <span className="h-px flex-1 bg-gray-100 ml-2"/>
        </h2>

        <div className="flex overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-6 sm:gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="flex flex-col items-center gap-2 group flex-shrink-0 sm:flex-shrink w-20 sm:w-auto">
              <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl sm:rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-primary transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20 flex-shrink-0 bg-gray-50">
                <img src={cat.image_url || '/placeholder-cat.png'} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 group-hover:text-primary text-center leading-tight transition-colors line-clamp-1 sm:line-clamp-2 uppercase tracking-tight">
                {cat.name.replace(/^[^\s]+\s/, '')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

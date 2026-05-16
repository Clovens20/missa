'use client'
import { useWishlist } from '@/contexts/WishlistContext'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import ProductCard from '@/components/shop/ProductCard'
import { Heart, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function WishlistPage() {
  const { wishlist } = useWishlist()

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-100 py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500"/>
              Ma Liste de Souhaits
            </h1>
            <p className="text-gray-500 mt-2">
              {wishlist.length} produits sauvegardés
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {wishlist.map((item: { id: string, product: any }, i: number) => (
                <ProductCard key={item.id} product={item.product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4"/>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Votre liste est vide</h2>
              <p className="text-gray-500 mb-6">Vous n'avez pas encore ajouté de produits à vos favoris.</p>
              <Link href="/catalog" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-8 py-3 rounded-xl transition-all active:scale-95">
                <ShoppingBag className="w-5 h-5"/>
                Découvrir nos produits
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

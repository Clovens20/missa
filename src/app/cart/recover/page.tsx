'use client'
import { useEffect, useState, Suspense } 
  from 'react'
import { useSearchParams, useRouter } 
  from 'next/navigation'
import { 
  CheckCircle, ShoppingCart,
  Loader, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/shop/Header'
import { useCart } from '@/contexts/CartContext'

function RecoverCartContent() {
  const { restoreCart, setGuestEmail } = useCart()
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const code = params.get('code')
  const [status, setStatus] = 
    useState<'loading'|'success'|'error'>
    ('loading')
  const [cart, setCart] = useState<any>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    recoverCart()
  }, [token])

  async function recoverCart() {
    try {
      const res = await fetch(
        `/api/cart/recover?token=${token}` +
        (code ? `&code=${code}` : '')
      )
      const data = await res.json()
      
      if (data.error) {
        setStatus('error')
        return
      }

      setCart(data.cart)
      setStatus('success')
      
      // Mettre à jour l'email et le contexte du panier
      if (data.cart.customer_email || data.cart.email) {
        setGuestEmail(data.cart.customer_email || data.cart.email)
      }

      // Reconstruire les CartItems
      if (data.cart.items && Array.isArray(data.cart.items)) {
        const mappedItems = data.cart.items.map((i: any) => ({
          id: i.variant?.id ? `${i.id || i.product_id}-${i.variant.id}` : (i.id || i.product_id),
          product: {
            id: i.id || i.product_id,
            name: i.name,
            price: i.price,
            images: i.image ? [{ url: i.image }] : [],
            slug: i.slug || '',
          },
          quantity: i.quantity || i.qty || 1,
          variant: i.variant
        }))
        restoreCart(mappedItems)
      }

      // Determiner la redirection (vers la page produit si 1 seul article, sinon checkout)
      setTimeout(() => {
        const firstItemSlug = data.cart?.items?.[0]?.slug
        if (data.cart?.items?.length === 1 && firstItemSlug) {
          router.push(`/product/${firstItemSlug}${code ? `?coupon=${code}` : ''}`)
        } else {
          router.push('/checkout' + (code ? `?coupon=${code}` : ''))
        }
      }, 3000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="bg-white 
      rounded-3xl shadow-xl 
      p-10 max-w-md w-full 
      text-center">
      
      {status === 'loading' && (
        <>
          <Loader className="w-12 h-12 
            text-primary mx-auto 
            mb-4 animate-spin"/>
          <h2 className="text-xl 
            font-black text-gray-900">
            Récupération de votre panier...
          </h2>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 
            bg-secondary/10 rounded-full 
            flex items-center justify-center 
            mx-auto mb-4">
            <CheckCircle className="w-8 h-8 
              text-secondary"/>
          </div>
          <h2 className="text-2xl 
            font-black text-gray-900 mb-2">
            Panier récupéré! ✅
          </h2>
          <p className="text-gray-500 mb-4">
            {cart?.items?.length || 0}
            {' '}article(s) ajoutés 
            à votre panier
          </p>
          {code && (
            <div className="bg-primary/5 
              border border-primary/20 
              rounded-2xl p-4 mb-6">
              <p className="text-sm 
                text-gray-600 mb-1">
                Code promo appliqué:
              </p>
              <p className="text-2xl 
                font-black text-primary 
                tracking-wider">
                {code}
              </p>
            </div>
          )}
          <p className="text-gray-400 
            text-sm">
            Redirection vers le paiement...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 
            text-red-400 mx-auto mb-4"/>
          <h2 className="text-xl 
            font-black text-gray-900 mb-2">
            Lien expiré
          </h2>
          <p className="text-gray-500 mb-6">
            Ce lien de récupération 
            n'est plus valide.
          </p>
          <Link href="/"
            className="inline-flex 
              items-center gap-2 
              bg-primary text-white 
              font-bold px-6 py-3 
              rounded-xl hover:bg-primary-dark 
              transition-colors">
            <ShoppingCart className="w-4 h-4"/>
            Retourner au shop
          </Link>
        </>
      )}
    </div>
  )
}

export default function RecoverCartPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen 
        bg-gray-50 flex items-center 
        justify-center p-4">
        <Suspense fallback={
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
            <Loader className="w-12 h-12 text-primary mx-auto mb-4 animate-spin"/>
            <h2 className="text-xl font-black text-gray-900">Chargement...</h2>
          </div>
        }>
          <RecoverCartContent />
        </Suspense>
      </div>
    </>
  )
}

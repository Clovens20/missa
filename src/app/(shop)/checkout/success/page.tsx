'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

function SuccessContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const { clearCart } = useCart()

  useEffect(() => {
    // Empty local shopping cart upon landing back with success
    clearCart()
  }, [clearCart])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">

        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500"/>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Paiement réussi ! 🎉
        </h1>

        <p className="text-gray-500 mb-2">
          Merci pour votre commande.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Un email de confirmation vous sera envoyé.
        </p>

        {sessionId && (
          <p className="text-xs text-gray-300 mb-6 font-mono">
            Ref: {sessionId.slice(-8).toUpperCase()}
          </p>
        )}

        <div className="space-y-3">
          <Link href="/catalog"
            className="block w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
            <ShoppingBag className="w-5 h-5"/>
            Continuer mes achats
          </Link>
          <Link href="/track"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition-all">
            📦 Suivre ma commande
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"/>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

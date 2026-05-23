'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import { motion } from 'framer-motion'
import { Building2, CheckCircle, ArrowRight, ShoppingCart, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/types'
import { formatPrice, getSafeImageUrl } from '@/lib/utils'

function WholesaleCard({ product, discount, defaultMoq }: { product: Product, discount: number, defaultMoq: number }) {
  const { addItem } = useCart()
  const wholesalePrice = product.price * (1 - discount / 100)
  const moq = product.wholesale_moq || defaultMoq
  const [qty, setQty] = useState(moq)

  const handleAdd = () => {
    // Clone product and override price for cart
    const cartProduct = { ...product, price: wholesalePrice }
    addItem(cartProduct, qty, undefined, true, moq)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:border-gray-700 transition-colors">
      <div className="relative aspect-square overflow-hidden bg-gray-800">
        <img 
          src={getSafeImageUrl(product.images?.[0]?.url)} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 right-3 bg-secondary text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
          -{discount}% B2B
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-white text-lg line-clamp-2 mb-2">{product.name}</h3>
        
        <div className="mt-auto pt-4 border-t border-gray-800/50 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-gray-500 text-xs uppercase font-black tracking-wide mb-1">Prix de gros</p>
              <p className="text-2xl font-black text-secondary">{formatPrice(wholesalePrice)}</p>
              <p className="text-xs text-gray-500 line-through">Détail: {formatPrice(product.price)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase font-black tracking-wide mb-1 flex items-center justify-end gap-1"><Package className="w-3 h-3"/> MOQ</p>
              <p className="text-sm font-bold text-white">{moq} unités</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="number" 
              min={moq} 
              value={qty} 
              onChange={e => setQty(Math.max(moq, parseInt(e.target.value) || moq))}
              className="w-20 bg-gray-950 border border-gray-700 rounded-xl px-3 text-center font-black text-white focus:border-secondary outline-none transition-colors"
            />
            <button 
              onClick={handleAdd}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-secondary/20 active:scale-95"
            >
              <ShoppingCart className="w-5 h-5"/>
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WholesalePage() {
  const [featureOn, setFeatureOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [settings, setSettings] = useState({ discount: 30, minOrder: 200, defaultMoq: 10 })
  const [products, setProducts] = useState<Product[]>([])
  const [fetchingProducts, setFetchingProducts] = useState(false)
  
  const [form, setForm] = useState({
    business_name: '', contact_name: '', email: '', phone: '',
    website: '', business_type: '', message: '',
  })

  useEffect(() => {
    async function check() {
      const { data: feature } = await supabase.from('site_settings').select('value').eq('key', 'feature_wholesale').single()
      const { data: disc } = await supabase.from('site_settings').select('value').eq('key', 'wholesale_default_discount').single()
      const { data: min } = await supabase.from('site_settings').select('value').eq('key', 'wholesale_min_order').single()
      const { data: moqData } = await supabase.from('site_settings').select('value').eq('key', 'wholesale_default_moq').single()
      
      setFeatureOn(feature?.value === true || feature?.value === 'true')
      setSettings({
        discount: parseInt(disc?.value || '30'),
        minOrder: parseInt(min?.value || '200'),
        defaultMoq: parseInt(moqData?.value || '10')
      })

      const stored = localStorage.getItem('missa_wholesale_approved')
      if (stored === 'true') {
        setIsApproved(true)
        loadProducts()
      }

      setLoading(false)
    }
    check()
  }, [])

  async function loadProducts() {
    setFetchingProducts(true)
    const { data } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
    if (data) {
      setProducts(data as Product[])
    }
    setFetchingProducts(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.business_name || !form.contact_name || !form.email) { toast.error('Remplissez les champs requis'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('wholesale_applications').insert({
        ...form, 
        status: 'approved', // Auto approve
        discount_rate: settings.discount, 
        min_order_amount: settings.minOrder,
      })
      if (error) throw error
      localStorage.setItem('missa_wholesale_approved', 'true')
      setIsApproved(true)
      toast.success('✅ Bienvenue dans le programme B2B!')
      loadProducts()
    } catch (err: any) { toast.error(err.message) } finally { setSubmitting(false) }
  }

  if (loading) return null
  if (!featureOn) return <><Header/><div className="min-h-screen flex items-center justify-center text-gray-400">Vente en gros bientôt disponible</div><Footer/></>

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-gray-950 min-h-screen pb-20 text-white">
        {!isApproved ? (
          <>
            <section className="py-20 text-center bg-gradient-to-br from-gray-900 to-black">
              <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-4xl md:text-6xl font-black mb-6">Achetez en gros, économisez {settings.discount}%</h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">Accès instantané à notre catalogue B2B. Tarifs préférentiels pour les professionnels.</p>
              </div>
            </section>

            <section className="py-16 max-w-2xl mx-auto px-4">
              <div className="bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-800">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                  <Building2 className="text-secondary"/> Accéder au catalogue B2B
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <input type="text" placeholder="Nom de l'entreprise *" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-secondary transition-colors" required/>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Contact *" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-secondary transition-colors" required/>
                    <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-secondary transition-colors" required/>
                  </div>
                  <textarea placeholder="Décrivez votre activité (optionnel)..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-secondary h-32 resize-none transition-colors"/>
                  <button type="submit" disabled={submitting} className="w-full bg-secondary hover:bg-secondary/90 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-secondary/30 disabled:opacity-50">
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>Entrer dans la boutique B2B <ArrowRight className="w-5 h-5"/></>}
                  </button>
                </form>
              </div>
            </section>
          </>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gray-800 pb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4">
                  <Building2 className="w-10 h-10 text-secondary" />
                  Catalogue B2B
                </h1>
                <p className="text-gray-400 mt-3 text-lg">Vos tarifs préférentiels de -{settings.discount}% sont activés.</p>
              </div>
              <div className="mt-6 md:mt-0 bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-secondary" />
                <div>
                  <p className="text-white font-bold">Compte Pro vérifié</p>
                  <p className="text-secondary text-sm font-black">Remise: {settings.discount}%</p>
                </div>
              </div>
            </div>

            {fetchingProducts ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"/>
                <p className="text-gray-500 font-bold">Chargement de votre catalogue B2B...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500 text-lg">Aucun produit disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <WholesaleCard key={product.id} product={product} discount={settings.discount} defaultMoq={settings.defaultMoq} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}


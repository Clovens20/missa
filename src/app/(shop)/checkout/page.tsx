'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/shop/Header'
import { formatPrice } from '@/lib/utils'
import { Mail, User, Phone, MapPin, CreditCard, Lock, ChevronRight, ShoppingBag, CheckCircle, Shield } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { generateOrderNumber, getSessionId } from '@/lib/session'
import { toast } from 'sonner'
import { trackPurchase, trackInitiateCheckout } from '@/components/shop/PixelsInjector'

type Step = 'email' | 'info' | 'shipping' | 'payment' | 'confirm'

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  cardName: string
  notes: string
}

export default function CheckoutPage() {
  const { items, total, clearCart, guestEmail, setGuestEmail } = useCart()
  const router = useRouter()
  
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>('')
  
  const [form, setForm] = useState<FormData>({
    email: guestEmail || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'CA',
    cardName: '',
    notes: '',
  })

  function update(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (items.length === 0 && step !== 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 mb-4">Votre panier est vide</p>
          <button onClick={() => router.push('/')} className="bg-primary text-white px-6 py-2 rounded-xl font-bold">Continuer mes achats</button>
        </div>
      </div>
    )
  }

  const shipping = total >= 50 ? 0 : 8.99
  const tax = total * 0.15
  const grandTotal = total + shipping + tax

  const steps = [
    { id: 'email', label: 'Email' },
    { id: 'info', label: 'Infos' },
    { id: 'shipping', label: 'Livraison' },
    { id: 'payment', label: 'Paiement' },
  ]
  const currentStepIdx = steps.findIndex(s => s.id === step)

  async function handleEmailSubmit() {
    if (!form.email || !form.email.includes('@')) {
      toast.error('Entrez un email valide')
      return
    }
    await setGuestEmail(form.email)
    setStep('info')
  }

  // Capture email as soon as typed
  // so we can recover if they leave
  async function captureCartForRecovery(
    email: string,
    name: string,
  ) {
    if (!email || !email.includes('@')) 
      return
    
    try {
      if (items.length === 0) return

      const cartTotal = items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      )

      // Upsert abandoned cart record
      await supabase
        .from('abandoned_carts')
        .upsert({
          customer_email: email.toLowerCase(),
          customer_name: name || null,
          items: items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.images?.[0]?.url,
            quantity: item.quantity,
            variant: item.variant || null,
          })),
          cart_total: cartTotal,
          cart_url: window.location.href,
          last_seen_at: new Date().toISOString(),
          recovered: false,
        }, {
          onConflict: 'customer_email,recovered'
        })
    } catch (err) {
      console.error('Cart capture error:', err)
    }
  }

  // When order COMPLETES successfully
  async function markCartRecovered(
    email: string,
    orderId: string
  ) {
    try {
      await supabase
        .from('abandoned_carts')
        .update({
          recovered: true,
          recovered_at: new Date().toISOString(),
          recovered_order_id: orderId,
        })
        .eq('customer_email', email.toLowerCase())
        .eq('recovered', false)
    } catch (err) {
      console.error('Mark recovered error:', err)
    }
  }

  async function handlePlaceOrder() {
    setLoading(true)
    try {
      const number = generateOrderNumber()
      
      const orderData = {
        order_number: number,
        session_id: getSessionId(),
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        items: items.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          qty: item.quantity,
          image: item.product.images?.[0]?.url,
          variant: item.variant,
        })),
        subtotal: total,
        shipping: shipping,
        tax: tax,
        total: grandTotal,
        shipping_address: {
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        payment_method: 'card',
        payment_status: 'paid',
        order_status: 'confirmed',
        notes: form.notes,
      }

      const { error } = await supabase.from('guest_orders').insert(orderData)
      if (error) throw error

      clearCart()
      setOrderNumber(number)
      setStep('confirm')
      
      // Track Purchase
      trackPurchase(orderData)

      // Mark cart as recovered
      await markCartRecovered(form.email, number)

      await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName,
          orderNumber: number,
          items: orderData.items,
          total: grandTotal,
        })
      })

    } catch (err) {
      toast.error('Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'confirm') {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-secondary"/>
            </motion.div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Commande confirmée! 🎉</h1>
            <p className="text-gray-500 mb-2">Merci {form.firstName}!</p>
            <div className="bg-primary/10 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
              <p className="text-2xl font-black text-primary">{orderNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Email de confirmation:</span><span className="font-semibold text-gray-900">{form.email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Total payé:</span><span className="font-black text-primary">{formatPrice(grandTotal)}</span></div>
            </div>
            <p className="text-sm text-gray-400 mb-8">📧 Un email de confirmation a été envoyé à <strong>{form.email}</strong></p>
            <button onClick={() => router.push('/')} className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-colors">Continuer mes achats →</button>
          </motion.div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {step !== 'email' && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                {steps.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= currentStepIdx ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>{i < currentStepIdx ? '✓' : i + 1}</div>
                      <span className={`text-xs mt-1 font-medium ${i <= currentStepIdx ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-4 transition-all ${i < currentStepIdx ? 'bg-primary' : 'bg-gray-200'}`}/>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {step === 'email' && (
                  <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="text-center mb-8"><div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-primary"/></div><h2 className="text-2xl font-black text-gray-900 mb-2">Entrez votre email</h2><p className="text-gray-500 text-sm leading-relaxed">Pas besoin de créer un compte. Votre email nous permet de vous envoyer la confirmation de commande and les informations de livraison.</p></div>
                    <div className="max-w-md mx-auto space-y-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">Adresse email *</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="email" value={form.email} onChange={e => update('email', e.target.value)} onBlur={e => e.target.value.includes('@') && captureCartForRecovery(e.target.value, form.firstName)} onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} placeholder="votre@email.com" className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none text-base transition-colors" autoFocus/></div></div>
                      <p className="text-xs text-gray-400 text-center">🔒 Votre email ne sera jamais partagé. Utilisé uniquement pour votre commande.</p>
                      <button onClick={handleEmailSubmit} className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/30">Continuer <ChevronRight className="w-5 h-5"/></button>
                    </div>
                  </motion.div>
                )}
                {step === 'info' && (
                  <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-primary"/>Vos informations</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Prénom *</label><input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="Jean" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Nom *</label><input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Tremblay" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                      </div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(514) 000-0000" className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">Notes (optionnel)</label><textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Instructions spéciales pour la livraison..." rows={3} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors resize-none"/></div>
                      <div className="flex gap-3 pt-2"><button onClick={() => setStep('email')} className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">← Retour</button><button onClick={() => { if (!form.firstName || !form.lastName) { toast.error('Prénom et nom requis'); return } setStep('shipping') }} className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all">Livraison <ChevronRight className="w-4 h-4"/></button></div>
                    </div>
                  </motion.div>
                )}
                {step === 'shipping' && (
                  <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/>Adresse de livraison</h2>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">Adresse *</label><input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Rue Principale" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Ville *</label><input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Montréal" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Province/État</label><input type="text" value={form.state} onChange={e => update('state', e.target.value)} placeholder="QC" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Code postal *</label><input type="text" value={form.zip} onChange={e => update('zip', e.target.value)} placeholder="H1A 1A1" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Pays *</label><select value={form.country} onChange={e => update('country', e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none bg-white transition-colors"><option value="CA">🇨🇦 Canada</option><option value="US">🇺🇸 États-Unis</option><option value="HT">🇭🇹 Haïti</option><option value="FR">🇫🇷 France</option></select></div>
                      </div>
                      <div className="border-2 border-gray-100 rounded-2xl p-4"><p className="font-bold text-gray-700 text-sm mb-3">Mode de livraison</p><div className={`flex items-center justify-between p-3 rounded-xl border-2 ${total >= 50 ? 'border-secondary bg-secondary/10' : 'border-primary bg-primary/10'}`}><div><p className="font-bold text-sm">Livraison standard (5-7 jours)</p><p className="text-xs text-gray-500">{total >= 50 ? '✅ Gratuite!' : 'Standard'}</p></div><span className={`font-black ${total >= 50 ? 'text-secondary' : 'text-primary'}`}>{total >= 50 ? 'GRATUIT' : formatPrice(8.99)}</span></div></div>
                      <div className="flex gap-3 pt-2"><button onClick={() => setStep('info')} className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">← Retour</button><button onClick={() => { if (!form.address || !form.city || !form.zip) { toast.error('Adresse complète requise'); return } setStep('payment'); trackInitiateCheckout(grandTotal) }} className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all">Paiement <ChevronRight className="w-4 h-4"/></button></div>
                    </div>
                  </motion.div>
                )}
                {step === 'payment' && (
                  <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary"/>Paiement sécurisé</h2>
                    <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-6 flex items-center gap-3"><Lock className="w-5 h-5 text-secondary flex-shrink-0"/><p className="text-sm text-secondary font-medium">Vos informations de paiement sont 100% sécurisées and chiffrées.</p></div>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">Nom sur la carte *</label><input type="text" value={form.cardName} onChange={e => update('cardName', e.target.value)} placeholder="JEAN TREMBLAY" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors uppercase"/></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">Numéro de carte *</label><input type="text" placeholder="1234 5678 9012 3456" maxLength={19} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Expiration *</label><input type="text" placeholder="MM/AA" maxLength={5} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">CVV *</label><input type="text" placeholder="123" maxLength={4} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"/></div>
                      </div>
                      <div className="flex gap-3 pt-2"><button onClick={() => setStep('shipping')} className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">← Retour</button><button onClick={handlePlaceOrder} disabled={loading} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 text-base">{loading ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>) : (<><Lock className="w-5 h-5"/>Confirmer la commande — {formatPrice(grandTotal)}</>)}</button></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary"/>Votre commande</h3>
                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 items-center"><div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">{item.product.images?.[0]?.url && (<Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover"/>)}<span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center">{item.quantity}</span></div><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product.name}</p>{item.variant?.size && (<p className="text-xs text-gray-400">Taille: {item.variant.size}</p>)}</div><span className="font-bold text-sm text-gray-900 flex-shrink-0">{formatPrice(item.product.price * item.quantity)}</span></div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-gray-100 pt-4"><div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{formatPrice(total)}</span></div><div className="flex justify-between text-sm text-gray-600"><span>Livraison</span><span className={shipping === 0 ? 'text-secondary font-bold' : ''}>{shipping === 0 ? 'GRATUIT' : formatPrice(shipping)}</span></div><div className="flex justify-between text-sm text-gray-600"><span>Taxes (15%)</span><span>{formatPrice(tax)}</span></div><div className="flex justify-between font-black text-xl pt-2 border-t border-gray-200 mt-2"><span>Total</span><span className="text-primary">{formatPrice(grandTotal)}</span></div></div>
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100"><div className="flex items-center gap-1 text-xs text-gray-400"><Lock className="w-3 h-3"/>SSL Sécurisé</div><div className="flex items-center gap-1 text-xs text-gray-400"><Shield className="w-3 h-3"/>100% Sécurisé</div></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

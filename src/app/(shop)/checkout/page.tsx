'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/shop/Header'
import { formatPrice, getTaxRate } from '@/lib/utils'
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

const WORLDWIDE_COUNTRIES = [
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'US', name: '🇺🇸 États-Unis' },
  { code: 'HT', name: '🇭🇹 Haïti' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'BE', name: '🇧🇪 Belgique' },
  { code: 'CH', name: '🇨🇭 Suisse' },
  { code: 'GB', name: '🇬🇧 Royaume-Uni' },
  { code: 'DE', name: '🇩🇪 Allemagne' },
  { code: 'IT', name: '🇮🇹 Italie' },
  { code: 'ES', name: '🇪🇸 Espagne' },
  { code: 'NL', name: '🇳🇱 Pays-Bas' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'IE', name: '🇮🇪 Irlande' },
  { code: 'AT', name: '🇦🇹 Autriche' },
  { code: 'DK', name: '🇩🇰 Danemark' },
  { code: 'SE', name: '🇸🇪 Suède' },
  { code: 'NO', name: '🇳🇴 Norvège' },
  { code: 'FI', name: '🇫🇮 Finlande' },
  { code: 'LU', name: '🇱🇺 Luxembourg' },
  { code: 'MC', name: '🇲🇨 Monaco' },
  { code: 'GP', name: '🇬🇵 Guadeloupe' },
  { code: 'MQ', name: '🇲🇶 Martinique' },
  { code: 'GF', name: '🇬🇫 Guyane Française' },
  { code: 'RE', name: '🇷🇪 La Réunion' },
  { code: 'YT', name: '🇾🇹 Mayotte' },
  { code: 'PF', name: '🇵🇫 Polynésie Française' },
  { code: 'NC', name: '🇳🇨 Nouvelle-Calédonie' },
  { code: 'CI', name: '🇨🇮 Côte d\'Ivoire' },
  { code: 'SN', name: '🇸🇳 Sénégal' },
  { code: 'MA', name: '🇲🇦 Maroc' },
  { code: 'DZ', name: '🇩🇿 Algérie' },
  { code: 'TN', name: '🇹🇳 Tunisie' },
  { code: 'CD', name: '🇨🇩 R.D. Congo' },
  { code: 'CM', name: '🇨🇲 Cameroun' },
  { code: 'GA', name: '🇬🇦 Gabon' },
  { code: 'CG', name: '🇨🇬 Congo' },
  { code: 'BJ', name: '🇧🇯 Bénin' },
  { code: 'TG', name: '🇹🇬 Togo' },
  { code: 'GN', name: '🇬🇳 Guinée' },
  { code: 'ML', name: '🇲🇱 Mali' }
]

export default function CheckoutPage() {
  const { items, total, clearCart, guestEmail, setGuestEmail } = useCart()
  const { currency, setCurrency } = useCurrency()
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')

  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>('')

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  
  const [taxSettings, setTaxSettings] = useState<{
    tax_enabled: boolean
    tax_rates: Record<string, { name: string, rate: number, enabled: boolean }>
  } | null>(null)

  useEffect(() => {
    async function loadTax() {
      try {
        const res = await fetch('/api/shop/tax-settings')
        if (res.ok) {
          const data = await res.json()
          setTaxSettings(data)
        }
      } catch (err) {
        console.error('Failed to load tax settings:', err)
      }
    }
    loadTax()
  }, [])

  const hasLocalProducts = items.some(item => !item.product?.is_dropship)
  
  const countryOptions = hasLocalProducts
    ? [
        { code: 'CA', name: '🇨🇦 Canada' },
        { code: 'US', name: '🇺🇸 États-Unis' },
        { code: 'HT', name: '🇭🇹 Haïti' },
        { code: 'FR', name: '🇫🇷 France' }
      ]
    : WORLDWIDE_COUNTRIES

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

  let discountAmount = 0
  if (appliedCoupon) {
    if (appliedCoupon.product_id) {
      // restricted to specific product
      const restrictedItems = items.filter(item => item.product.id === appliedCoupon.product_id)
      const restrictedSubtotal = restrictedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      if (appliedCoupon.discount_type === 'percentage') {
        discountAmount = restrictedSubtotal * (appliedCoupon.discount_value / 100)
      } else {
        discountAmount = Math.min(appliedCoupon.discount_value, restrictedSubtotal)
      }
    } else {
      // global coupon
      if (appliedCoupon.discount_type === 'percentage') {
        discountAmount = total * (appliedCoupon.discount_value / 100)
      } else {
        discountAmount = Math.min(appliedCoupon.discount_value, total)
      }
    }
  }

  const shipping = total >= 100 ? 0 : 8.99
  
  let taxRate = 0
  let taxLabel = 'Taxes'
  
  if (taxSettings && taxSettings.tax_enabled && form.country === 'CA') {
    const key = `CA_${form.state?.toUpperCase() || 'QC'}`
    const prov = taxSettings.tax_rates[key]
    if (prov && prov.enabled) {
      taxRate = prov.rate / 100
      taxLabel = prov.name || 'Taxes'
    }
  }

  const tax = Math.max(0, total - discountAmount) * taxRate
  const grandTotal = Math.max(0, total - discountAmount) + shipping + tax

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

  async function handleApplyCoupon() {
    if (!couponCode) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setCouponError('Code promo invalide')
        return
      }

      // Check expiry date
      if (data.expires_at) {
        const expiryDate = new Date(data.expires_at)
        expiryDate.setHours(23, 59, 59, 999)
        if (expiryDate < new Date()) {
          setCouponError('Ce code promo a expiré')
          return
        }
      }

      // Check max uses
      if (data.max_uses !== null && data.used_count >= data.max_uses) {
        setCouponError("Ce code promo a atteint sa limite d'utilisation")
        return
      }

      // Check product_id restriction!
      if (data.product_id) {
        const hasRestrictedProduct = items.some(item => item.product.id === data.product_id)
        if (!hasRestrictedProduct) {
          setCouponError("Ce code promo n'est pas applicable aux articles de votre panier")
          return
        }
      }

      // Check min purchase amount
      if (data.min_purchase_amount && total < data.min_purchase_amount) {
        setCouponError(`Montant d'achat minimum requis : ${formatPrice(data.min_purchase_amount)}`)
        return
      }

      setAppliedCoupon(data)
      toast.success('Code promo appliqué !')
    } catch {
      setCouponError('Erreur de validation du coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  async function handleStripeCheckout() {
    setLoading(true)
    try {
      const res = await fetch(
        '/api/checkout/create-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail: form.email,
            items: items.map(i => {
              let itemPrice = i.product.price
              if (appliedCoupon) {
                if (appliedCoupon.product_id) {
                  if (i.product.id === appliedCoupon.product_id) {
                    if (appliedCoupon.discount_type === 'percentage') {
                      itemPrice = i.product.price * (1 - appliedCoupon.discount_value / 100)
                    } else {
                      const itemTotal = i.product.price * i.quantity
                      const disc = Math.min(appliedCoupon.discount_value, itemTotal)
                      itemPrice = (itemTotal - disc) / i.quantity
                    }
                  }
                } else {
                  if (appliedCoupon.discount_type === 'percentage') {
                    itemPrice = i.product.price * (1 - appliedCoupon.discount_value / 100)
                  } else {
                    const proportion = (i.product.price * i.quantity) / total
                    const itemTotal = i.product.price * i.quantity
                    const disc = appliedCoupon.discount_value * proportion
                    itemPrice = (itemTotal - disc) / i.quantity
                  }
                }
              }

              return {
                product_id: i.product.id,
                name: i.product.name + (appliedCoupon && (i.product.id === appliedCoupon.product_id || !appliedCoupon.product_id) ? ` (${appliedCoupon.code})` : ''),
                price: itemPrice,
                quantity: i.quantity,
                image: i.product.images?.[0]?.url || null,
                variant: i.variant || null,
                is_dropship: i.product.is_dropship || false,
                variant_id: i.variant?.id || null
              }
            }),
            shippingDetails: {
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              address: form.address,
              city: form.city,
              state: form.state,
              zip: form.zip,
              country: form.country,
              notes: form.notes
            },
            currency
          }),
        }
      )

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Track initiate checkout
      trackInitiateCheckout(grandTotal)

      // Capture/recovery capture before redirecting
      await captureCartForRecovery(form.email, `${form.firstName} ${form.lastName}`)

      window.location.href = data.url

    } catch (err: any) {
      toast.error('Erreur: ' + err.message)
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
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Province/État *</label>
                          {form.country === 'CA' ? (
                            <select 
                              value={form.state || 'QC'} 
                              onChange={e => update('state', e.target.value)} 
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none bg-white transition-colors font-bold text-gray-800"
                            >
                              <option value="QC">Québec (14.975%)</option>
                              <option value="ON">Ontario (13%)</option>
                              <option value="BC">Colombie-Britannique (12%)</option>
                              <option value="AB">Alberta (5%)</option>
                              <option value="MB">Manitoba (12%)</option>
                              <option value="NB">Nouveau-Brunswick (15%)</option>
                              <option value="NL">Terre-Neuve-et-Labrador (15%)</option>
                              <option value="NS">Nouvelle-Écosse (15%)</option>
                              <option value="PE">Île-du-Prince-Édouard (15%)</option>
                              <option value="SK">Saskatchewan (11%)</option>
                              <option value="NT">Territoires du Nord-Ouest (5%)</option>
                              <option value="NU">Nunavut (5%)</option>
                              <option value="YT">Yukon (5%)</option>
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={form.state} 
                              onChange={e => update('state', e.target.value)} 
                              placeholder="État / Province" 
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                            />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Code postal *</label>
                          <input 
                            type="text" 
                            value={form.zip} 
                            onChange={e => update('zip', e.target.value)} 
                            placeholder="H1A 1A1" 
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Pays *</label>
                          <select 
                            value={form.country} 
                            onChange={e => {
                              const val = e.target.value
                              setForm(prev => ({ ...prev, country: val, state: val === 'CA' ? 'QC' : '' }))
                            }} 
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none bg-white transition-colors font-bold text-gray-800"
                          >
                            {countryOptions.map(c => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="border-2 border-gray-100 rounded-2xl p-4"><p className="font-bold text-gray-700 text-sm mb-3">Mode de livraison</p><div className={`flex items-center justify-between p-3 rounded-xl border-2 ${total >= 100 ? 'border-secondary bg-secondary/10' : 'border-primary bg-primary/10'}`}><div><p className="font-bold text-sm">Livraison standard (5-7 jours)</p><p className="text-xs text-gray-500">{total >= 100 ? '✅ Gratuite!' : 'Standard'}</p></div><span className={`font-black ${total >= 100 ? 'text-secondary' : 'text-primary'}`}>{total >= 100 ? 'GRATUIT' : formatPrice(8.99)}</span></div></div>
                      <div className="flex gap-3 pt-2"><button onClick={() => setStep('info')} className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">← Retour</button><button onClick={() => { if (!form.address || !form.city || !form.zip) { toast.error('Adresse complète requise'); return } setStep('payment'); trackInitiateCheckout(grandTotal) }} className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all">Paiement <ChevronRight className="w-4 h-4"/></button></div>
                    </div>
                  </motion.div>
                )}
                {step === 'payment' && (
                  <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary"/>Paiement sécurisé</h2>
                    <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-6 flex items-center gap-3"><Lock className="w-5 h-5 text-secondary flex-shrink-0"/><p className="text-sm text-secondary font-medium">Vous allez être redirigé vers la page sécurisée de Stripe pour finaliser votre paiement en toute sécurité.</p></div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Nom du client:</span><span className="font-semibold text-gray-900">{form.firstName} {form.lastName}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Adresse de livraison:</span><span className="font-semibold text-gray-900">{form.address}, {form.city}, {form.zip}</span></div>
                      </div>
                      <div className="flex gap-3 pt-2"><button onClick={() => setStep('shipping')} className="px-6 py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:border-primary hover:text-primary transition-all">← Retour</button><button onClick={handleStripeCheckout} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 text-base">{loading ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>) : (<><Lock className="w-5 h-5"/>🔒 Payer maintenant (Stripe) — {formatPrice(grandTotal)}</>)}</button></div>
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
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{formatPrice(total)}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-secondary font-bold">
                      <span>Remise {appliedCoupon?.code && `(${appliedCoupon.code})`}</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600"><span>Livraison</span><span className={shipping === 0 ? 'text-secondary font-bold' : ''}>{shipping === 0 ? 'GRATUIT' : formatPrice(shipping)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>{taxLabel} ({(taxRate * 100).toFixed(3).replace(/\.?0+$/, '')}%)</span><span>{formatPrice(tax)}</span></div>
                  <div className="flex justify-between font-black text-xl pt-2 border-t border-gray-200 mt-2"><span>Total</span><span className="text-primary">{formatPrice(grandTotal)}</span></div>
                </div>

                {/* Panel Code Promo */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Code promo" 
                      value={couponCode} 
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      disabled={appliedCoupon !== null}
                      className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors uppercase font-bold text-gray-800"
                    />
                    {appliedCoupon ? (
                      <button 
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="bg-red-50 hover:bg-red-100 text-red-500 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
                      >
                        Retirer
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode}
                        className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
                      >
                        {couponLoading ? '...' : 'Appliquer'}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1.5 font-bold">❌ {couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-secondary text-xs mt-1.5 font-black flex items-center gap-1">
                      ✅ Code promo appliqué avec succès !
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100"><div className="flex items-center gap-1 text-xs text-gray-400"><Lock className="w-3 h-3"/>SSL Sécurisé</div><div className="flex items-center gap-1 text-xs text-gray-400"><Shield className="w-3 h-3"/>100% Sécurisé</div></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

function generateRefCode(name: string) {
  const clean = name.toLowerCase().replace(/\s+/g, '').substring(0, 8)
  const random = Math.random().toString(36).substring(2, 6)
  return `${clean}${random}`.toUpperCase()
}

export default function AffiliatesPage() {
  const [featureOn, setFeatureOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [commission, setCommission] = useState(8)
  
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', instagram_url: '',
    tiktok_url: '', audience_size: '', niche: '', why_join: '',
    payout_method: 'paypal', payout_info: '',
  })

  useEffect(() => {
    async function check() {
      const { data: feature } = await supabase.from('site_settings').select('value').eq('key', 'feature_affiliates').single()
      const { data: comm } = await supabase.from('site_settings').select('value').eq('key', 'affiliate_default_commission').single()
      
      setFeatureOn(feature?.value === true || feature?.value === 'true')
      setCommission(parseInt(comm?.value || '8'))
      setLoading(false)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.why_join) { toast.error('Remplissez tous les champs requis'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('affiliates').insert({
        ...form, 
        ref_code: generateRefCode(form.full_name), 
        status: 'pending', 
        commission_rate: commission,
      })
      if (error) throw error
      setDone(true); toast.success('✅ Candidature envoyée!')
    } catch (err: any) { toast.error(err.message) } finally { setSubmitting(false) }
  }

  if (loading) return null
  if (!featureOn) return <><Header/><div className="min-h-screen flex items-center justify-center text-gray-400">Programme d'affiliés bientôt disponible</div><Footer/></>

  return (
    <>
      <Header />
      <main className="bg-gray-50 pb-20">
        <section className="bg-gradient-to-br from-primary to-orange-400 py-20 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-6">Gagnez {commission}% en partageant Missa Shop</h1>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">Devenez ambassadeur et recevez des commissions sur chaque vente générée par votre lien.</p>
          </div>
        </section>

        <section className="py-16 max-w-2xl mx-auto px-4">
          {done ? (
            <div className="text-center bg-white rounded-3xl p-12 shadow-xl">
              <CheckCircle className="w-20 h-20 text-secondary mx-auto mb-6"/>
              <h2 className="text-2xl font-black mb-3">Candidature reçue! 🎉</h2>
              <p className="text-gray-500 mb-6">Nous analyserons votre profil et vous répondrons sous 48 heures.</p>
              <a href="/" className="bg-primary text-white font-bold px-8 py-3 rounded-xl inline-block hover:bg-primary-dark transition-colors">Retour à l'accueil</a>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-8">Devenir Ambassadeur</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nom complet *" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" required/>
                  <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" required/>
                </div>
                <input type="url" placeholder="📸 Instagram / TikTok URL" value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"/>
                <textarea placeholder="Pourquoi voulez-vous nous rejoindre? *" value={form.why_join} onChange={e => setForm({...form, why_join: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary h-32 resize-none" required/>
                <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 disabled:opacity-50">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>Soumettre ma candidature <ArrowRight className="w-5 h-5"/></>}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}

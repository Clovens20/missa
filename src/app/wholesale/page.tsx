'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import { motion } from 'framer-motion'
import { Building2, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function WholesalePage() {
  const [featureOn, setFeatureOn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [settings, setSettings] = useState({ discount: 30, minOrder: 200 })
  
  const [form, setForm] = useState({
    business_name: '', contact_name: '', email: '', phone: '',
    website: '', business_type: '', message: '',
  })

  useEffect(() => {
    async function check() {
      const { data: feature } = await supabase.from('site_settings').select('value').eq('key', 'feature_wholesale').single()
      const { data: disc } = await supabase.from('site_settings').select('value').eq('key', 'wholesale_default_discount').single()
      const { data: min } = await supabase.from('site_settings').select('value').eq('key', 'wholesale_min_order').single()
      
      setFeatureOn(feature?.value === true || feature?.value === 'true')
      setSettings({
        discount: parseInt(disc?.value || '30'),
        minOrder: parseInt(min?.value || '200')
      })
      setLoading(false)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.business_name || !form.contact_name || !form.email) { toast.error('Remplissez les champs requis'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('wholesale_applications').insert({
        ...form, 
        status: 'pending', 
        discount_rate: settings.discount, 
        min_order_amount: settings.minOrder,
      })
      if (error) throw error
      setDone(true); toast.success('✅ Demande envoyée!')
    } catch (err: any) { toast.error(err.message) } finally { setSubmitting(false) }
  }

  if (loading) return null
  if (!featureOn) return <><Header/><div className="min-h-screen flex items-center justify-center text-gray-400">Vente en gros bientôt disponible</div><Footer/></>

  return (
    <>
      <Header />
      <main className="bg-gray-950 pb-20 text-white">
        <section className="py-20 text-center bg-gradient-to-br from-gray-900 to-black">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black mb-6">Achetez en gros, économisez {settings.discount}%</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Pour les boutiques et revendeurs. Tarifs préférentiels et support prioritaire.</p>
          </div>
        </section>

        <section className="py-16 max-w-2xl mx-auto px-4">
          {done ? (
            <div className="text-center bg-gray-900 rounded-3xl p-12 shadow-xl border border-gray-800">
              <CheckCircle className="w-20 h-20 text-secondary mx-auto mb-6"/>
              <h2 className="text-2xl font-black mb-3">Demande reçue! 🎉</h2>
              <p className="text-gray-500 mb-6">Notre équipe commerciale analysera votre dossier sous 2-3 jours ouvrés.</p>
              <a href="/" className="bg-primary text-white font-bold px-8 py-3 rounded-xl inline-block hover:bg-primary-dark transition-colors">Retour à l'accueil</a>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-800">
              <h2 className="text-2xl font-black mb-8">Devenir Partenaire Grossiste</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="text" placeholder="Nom de l'entreprise *" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-primary" required/>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Contact *" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-primary" required/>
                  <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-primary" required/>
                </div>
                <textarea placeholder="Décrivez votre activité..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm outline-none focus:border-primary h-32 resize-none"/>
                <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 disabled:opacity-50">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>Envoyer ma demande <ArrowRight className="w-5 h-5"/></>}
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

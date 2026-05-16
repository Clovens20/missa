'use client'
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, ShieldCheck } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { useState } from 'react'
import { toast } from 'sonner'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'

export default function ContactPage() {
  const { getSetting } = useSettings()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/shop/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success('Message envoyé avec succès ! Nous vous répondrons bientôt.')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        throw new Error('Erreur lors de l\'envoi')
      }
    } catch (err) {
      toast.error('Une erreur est survenue. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Contactez <span className="text-primary">Missa</span><span className="text-secondary">Shop</span>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Une question sur une commande ? Un besoin d'assistance ? Notre équipe est là pour vous aider 7j/7.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card: Direct Contact */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-primary"/>
                  Direct Contact
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary"/>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">Email Support</p>
                      <p className="text-gray-900 font-bold">{getSetting('contact_email', 'support@missashop.com')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-secondary"/>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">Téléphone / WhatsApp</p>
                      <p className="text-gray-900 font-bold">{getSetting('contact_phone', '+1 (514) 000-0000')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-500"/>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">Localisation</p>
                      <p className="text-gray-900 font-bold">{getSetting('contact_address', 'Montréal, QC, Canada')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Hours */}
              <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-secondary"/>
                  Heures d'ouverture
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Lundi - Vendredi</span>
                    <span className="font-bold">09:00 - 18:00</span>
                  </li>
                  <li className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Samedi</span>
                    <span className="font-bold">10:00 - 16:00</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-400">Dimanche</span>
                    <span className="text-secondary font-bold">Online Support</span>
                  </li>
                </ul>
              </div>

              {/* Card: Trust */}
              <div className="bg-white rounded-[32px] p-6 border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                  <ShieldCheck className="w-7 h-7"/>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Vos données sont sécurisées. Nous ne partageons jamais vos informations personnelles.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100 h-full">
                <h2 className="text-3xl font-black text-gray-900 mb-8">Envoyez-nous un message</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">Nom complet</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jean Dupont"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">Email</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean@example.com"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">Sujet</label>
                    <input 
                      type="text" 
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Question sur ma commande #1234"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 ml-1">Message</label>
                    <textarea 
                      rows={6}
                      required
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Dites-nous comment nous pouvons vous aider..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 focus:bg-white focus:border-primary outline-none transition-all resize-none placeholder:text-gray-300"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white font-black px-10 py-5 rounded-2xl transition-all shadow-lg shadow-primary/25 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      ) : (
                        <>
                          <Send className="w-5 h-5"/>
                          Envoyer le message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

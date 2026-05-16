'use client'
import { useState, useEffect } 
  from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Bell, X, Mail, Check,
  Sparkles, Gift, Zap,
  ArrowRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CollectionAlertPopup() {
  const [visible, setVisible] = 
    useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = 
    useState(false)
  const [done, setDone] = useState(false)
  const [dismissed, setDismissed] = 
    useState(false)
  const [selectedInterests, setSelectedInterests] =
    useState<string[]>([
      'collections', 'flash', 'vip'
    ])

  useEffect(() => {
    // Don't show if already subscribed or dismissed
    const subscribed = localStorage.getItem('missa_subscribed')
    const dismissedForever = localStorage.getItem('missa_popup_dismissed_forever')
    
    if (subscribed || dismissedForever) return
    
    const dismissedAt = localStorage.getItem('missa_popup_dismissed')
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (days < 3) return // Show again after 3 days if not dismissed "forever"
    }

    // Show after 10 seconds
    const timer = setTimeout(() => {
      setVisible(true)
    }, 10000)

    // Also show on exit intent
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !dismissed) {
        setVisible(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [dismissed])

  function dismiss(forever = false) {
    setVisible(false)
    setDismissed(true)
    if (forever) {
      localStorage.setItem('missa_popup_dismissed_forever', 'true')
    } else {
      localStorage.setItem('missa_popup_dismissed', Date.now().toString())
    }
  }

  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.includes('@')) {
      setError('Veuillez entrer un email valide')
      return
    }

    setLoading(true)
    setError('')

    const { error: upErr } = await supabase
      .from('collection_subscribers')
      .upsert({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        source: 'popup',
        confirmed: true,
        notify_new_products: selectedInterests.includes('collections'),
        notify_flash_sales: selectedInterests.includes('flash'),
        notify_restocks: selectedInterests.includes('vip'),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })

    if (upErr && !upErr.message.includes('duplicate')) {
      setError(upErr.message)
      setLoading(false)
      return
    }

    localStorage.setItem('missa_subscribed', 'true')
    setDone(true)
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismiss()}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Popup Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md z-[101] max-h-[90vh] overflow-y-auto hide-scrollbar rounded-3xl shadow-2xl bg-white"
          >
            {!done ? (
              <div className="relative">
                {/* Close button */}
                <button
                  onClick={() => dismiss(true)}
                  className="absolute top-3 right-3
                    z-20 w-8 h-8 bg-black/20
                    hover:bg-black/40 rounded-full
                    flex items-center justify-center
                    text-white transition-colors"
                >
                  <X className="w-4 h-4"/>
                </button>

                {/* Top gradient section */}
                <div className="bg-gradient-to-br
                  from-orange-400 to-green-400
                  px-5 pt-8 pb-6 text-center
                  relative"
                >
                  <div className="text-4xl mb-3">🔔</div>
                  <h2 className="text-white font-black
                    text-xl leading-tight mb-2">
                    Soyez la première à savoir!
                  </h2>
                  <p className="text-white/90 text-xs
                    leading-relaxed px-4">
                    Recevez les nouvelles collections & ventes flash
                    directement dans votre boîte mail.
                  </p>
                </div>

                {/* Bottom white section */}
                <div className="px-5 py-5 space-y-4">

                  {/* Preferences */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-center
                      text-gray-400 font-bold uppercase tracking-wider">
                      👆 Choisissez vos préférences
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'collections', icon: '👗', text: 'Collections' },
                        { key: 'flash', icon: '⚡', text: 'Flash Sales' },
                        { key: 'vip', icon: '🎁', text: 'Offres VIP' },
                      ].map(b => {
                        const isSelected = selectedInterests.includes(b.key)
                        return (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() => {
                              setSelectedInterests(prev =>
                                prev.includes(b.key)
                                  ? prev.length === 1 ? prev : prev.filter(k => k !== b.key)
                                  : [...prev, b.key]
                              )
                            }}
                            className={`
                              relative p-3 rounded-2xl
                              border-2 text-center
                              transition-all duration-200
                              ${isSelected
                                ? 'border-orange-400 bg-orange-50 shadow-sm'
                                : 'border-gray-100 opacity-60 hover:opacity-100'
                              }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3 text-white"/>
                              </div>
                            )}
                            <p className="text-xl mb-1">{b.icon}</p>
                            <p className="text-[9px] font-bold text-gray-600 leading-tight">
                              {b.text}
                            </p>
                          </button>
                        )
                      })}
                    </div>

                    <p className="text-center text-[10px] text-orange-500 font-black">
                      {selectedInterests.length === 3
                        ? 'TOUT SÉLECTIONNÉ ✓'
                        : `${selectedInterests.length}/3 SÉLECTIONNÉ(S)`
                      }
                    </p>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Votre prénom (optionnel)"
                      className="w-full px-4 py-3
                        bg-gray-50 border-2 border-transparent
                        focus:border-orange-400 focus:bg-white
                        rounded-xl text-sm transition-all
                        focus:outline-none placeholder:text-gray-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="votre@email.com *"
                      className="w-full px-4 py-3
                        bg-gray-50 border-2 border-transparent
                        focus:border-orange-400 focus:bg-white
                        rounded-xl text-sm transition-all
                        focus:outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 font-bold text-center"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2
                        bg-gradient-to-r from-orange-500 to-orange-400
                        hover:from-orange-600 hover:to-orange-500
                        disabled:opacity-50 text-white font-black
                        py-4 rounded-xl text-sm transition-all shadow-xl
                        shadow-orange-500/20 active:scale-[0.98]"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      ) : (
                        <>🔔 M'ALERTER MAINTENANT</>
                      )}
                    </button>
                  </div>

                  {/* Footer links */}
                  <div className="text-center space-y-2 pt-2">
                    <p className="text-[10px] text-gray-400">
                      🔒 Zéro spam. Désabonnement en 1 clic.
                    </p>
                    <button 
                      onClick={() => dismiss()}
                      className="text-[10px] text-gray-300 hover:text-gray-500 underline underline-offset-2 transition-colors"
                    >
                      Peut-être plus tard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                >
                  <Check className="w-10 h-10 text-green-500"/>
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">
                    C'est noté {name || ''}! 🎉
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Vous recevrez une alerte dès que nos nouvelles pépites seront en ligne.
                  </p>
                </div>
                <button
                  onClick={() => setVisible(false)}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  C'EST PARTI !
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

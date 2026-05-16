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
    // Don't show if already subscribed
    const subscribed = localStorage
      .getItem('missa_subscribed')
    const dismissedAt = localStorage
      .getItem('missa_popup_dismissed')
    
    if (subscribed) return
    
    // Don't show if dismissed < 7 days ago
    if (dismissedAt) {
      const days = (Date.now() - 
        parseInt(dismissedAt)
      ) / (1000 * 60 * 60 * 24)
      if (days < 7) return
    }

    // Show after 15 seconds
    const timer = setTimeout(() => {
      setVisible(true)
    }, 15000)

    // Also show on exit intent
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !dismissed) {
        setVisible(true)
      }
    }

    document.addEventListener(
      'mouseleave', handleMouseLeave
    )

    return () => {
      clearTimeout(timer)
      document.removeEventListener(
        'mouseleave', handleMouseLeave
      )
    }
  }, [])

  function dismiss() {
    setVisible(false)
    setDismissed(true)
    localStorage.setItem(
      'missa_popup_dismissed',
      Date.now().toString()
    )
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 
              bg-black/60 z-[100] 
              backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 z-[101]
              -translate-x-1/2
              w-full max-w-md px-4
              top-1/2 -translate-y-1/2
              max-h-[90vh]
              overflow-y-auto hide-scrollbar"
          >
            {!done ? (
              <div className="bg-white rounded-3xl
                shadow-2xl overflow-hidden
                w-full max-w-md mx-auto relative">

                {/* Close button */}
                <button
                  onClick={dismiss}
                  className="absolute top-3 right-3
                    z-10 w-8 h-8 bg-black/20
                    hover:bg-black/40 rounded-full
                    flex items-center justify-center
                    text-white transition-colors"
                >
                  <X className="w-4 h-4"/>
                </button>

                {/* Top gradient section - COMPACT */}
                <div className="bg-gradient-to-br
                  from-orange-400 to-green-400
                  px-5 pt-6 pb-4 text-center
                  relative"
                >
                  <div className="text-3xl mb-2">🔔</div>
                  <h2 className="text-white font-black
                    text-lg leading-tight mb-1">
                    Soyez la première à savoir!
                  </h2>
                  <p className="text-white/80 text-xs
                    leading-relaxed">
                    Nouvelles collections & ventes flash
                    directement dans votre boîte mail.
                  </p>
                </div>

                {/* Bottom white section */}
                <div className="px-5 py-4 space-y-3">

                  {/* 3 clickable icons - COMPACT */}
                  <p className="text-xs text-center
                    text-gray-400 font-medium">
                    👆 Choisissez vos préférences
                  </p>

                  <div className="grid grid-cols-3
                    gap-2"
                  >
                    {[
                      {
                        key: 'collections',
                        icon: '👗',
                        text: 'Nouvelles collections'
                      },
                      {
                        key: 'flash',
                        icon: '⚡',
                        text: 'Flash sales'
                      },
                      {
                        key: 'vip',
                        icon: '🎁',
                        text: 'Offres VIP'
                      },
                    ].map(b => {
                      const isSelected =
                        selectedInterests.includes(b.key)
                      return (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => {
                            setSelectedInterests(prev =>
                              prev.includes(b.key)
                                ? prev.length === 1
                                  ? prev
                                  : prev.filter(
                                      k => k !== b.key
                                    )
                                : [...prev, b.key]
                            )
                          }}
                          className={`
                            relative p-2.5 rounded-xl
                            border-2 text-center
                            transition-all
                            ${isSelected
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-gray-200 opacity-60'
                            }`}
                        >
                          {isSelected && (
                            <div className="absolute
                              -top-1.5 -right-1.5
                              w-4 h-4 bg-orange-400
                              rounded-full flex items-center
                              justify-center"
                            >
                              <Check className="w-2.5 h-2.5
                                text-white"/>
                            </div>
                          )}
                          <p className="text-lg mb-0.5">
                            {b.icon}
                          </p>
                          <p className="text-[9px]
                            font-semibold
                            text-gray-600
                            leading-tight"
                          >
                            {b.text}
                          </p>
                        </button>
                      )
                    })}
                  </div>

                  <p className="text-center
                    text-[10px] text-orange-500
                    font-bold"
                  >
                    {selectedInterests.length === 3
                      ? 'Tout sélectionné ✓'
                      : `${selectedInterests.length}/3 sélectionné(s)`
                    }
                  </p>

                  {/* Name input (optional) */}
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Votre prénom (optionnel)"
                    className="w-full px-4 py-2.5
                      border-2 border-gray-200
                      focus:border-orange-400
                      rounded-xl text-sm
                      focus:outline-none
                      placeholder:text-gray-400"
                  />

                  {/* Email input */}
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e =>
                      e.key === 'Enter' && handleSubmit()
                    }
                    placeholder="votre@email.com *"
                    className="w-full px-4 py-2.5
                      border-2 border-gray-200
                      focus:border-orange-400
                      rounded-xl text-sm
                      focus:outline-none
                      placeholder:text-gray-400"
                  />

                  {/* Error */}
                  {error && (
                    <p className="text-xs text-red-500
                      font-bold text-center"
                    >
                      {error}
                    </p>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !email.trim()}
                    className="w-full flex items-center
                      justify-center gap-2
                      bg-gradient-to-r
                      from-orange-500 to-orange-400
                      hover:from-orange-600
                      hover:to-orange-500
                      disabled:opacity-50
                      text-white font-black
                      py-3 rounded-xl text-sm
                      transition-all shadow-md
                      shadow-orange-500/30
                      active:scale-[0.99]"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2
                        border-white/30 border-t-white
                        rounded-full animate-spin"
                      />
                    ) : (
                      <>
                        🔔 M'alerter pour{' '}
                        {selectedInterests.length}{' '}
                        {selectedInterests.length > 1
                          ? 'catégories'
                          : 'catégorie'
                        }!
                      </>
                    )}
                  </button>

                  {/* Privacy note */}
                  <p className="text-center text-[10px]
                    text-gray-400"
                  >
                    🔒 Zéro spam. Désabonnement
                    en 1 clic.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl
                shadow-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100
                  rounded-full flex items-center
                  justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-green-500"/>
                </div>
                <h3 className="text-xl font-black mb-2">
                  Parfait {name || ''}! 🎉
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Vous serez alertée dès que de nouvelles
                  collections arrivent sur Missa Shop!
                </p>
                <button
                  onClick={() => setVisible(false)}
                  className="bg-orange-500 text-white
                    font-bold px-8 py-3 rounded-xl
                    hover:bg-orange-600 transition-colors"
                >
                  Continuer mes achats →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

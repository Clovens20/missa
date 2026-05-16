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

  async function subscribe(
    e: React.FormEvent
  ) {
    e.preventDefault()
    if (!email.includes('@')) {
      toast.error('Email invalide')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('collection_subscribers')
      .upsert({
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        source: 'popup',
        confirmed: true,
        // Save what they selected:
        notify_new_products: 
          selectedInterests
            .includes('collections'),
        notify_flash_sales: 
          selectedInterests
            .includes('flash'),
        // VIP = both notifications
        notify_restocks: 
          selectedInterests
            .includes('vip'),
      }, {
        onConflict: 'email',
        ignoreDuplicates: true,
      })

    if (error && 
      !error.message.includes('duplicate')
    ) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    localStorage.setItem(
      'missa_subscribed', 'true'
    )
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
              bg-black/40 z-[100] 
              backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.85,
              y: 20,
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0,
            }}
            exit={{ 
              opacity: 0,
              scale: 0.85,
              y: 20,
            }}
            transition={{ 
              type: 'spring',
              damping: 25,
            }}
            className="fixed left-1/2 
              top-[40%] -translate-x-1/2 
              -translate-y-1/2 z-[101] 
              w-full max-w-md 
              overflow-hidden rounded-3xl 
              shadow-2xl">

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 
                right-4 z-10 w-8 h-8 
                bg-black/20 hover:bg-black/40 
                rounded-full flex items-center 
                justify-center 
                transition-colors">
              <X className="w-4 h-4 
                text-white"/>
            </button>

            {!done ? (
              <>
                {/* Hero section */}
                <div className="bg-gradient-to-br 
                  from-primary via-primary 
                  to-secondary p-8 
                  text-center relative 
                  overflow-hidden">
                  
                  {/* Decorative circles */}
                  <div className="absolute 
                    -top-8 -right-8 
                    w-32 h-32 
                    bg-white/10 rounded-full"/>
                  <div className="absolute 
                    -bottom-4 -left-4 
                    w-24 h-24 
                    bg-white/10 rounded-full"/>

                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      repeat: Infinity,
                      duration: 3,
                    }}
                    className="text-5xl 
                      mb-4 relative z-10">
                    🔔
                  </motion.div>
                  
                  <h2 className="text-2xl 
                    font-black text-white 
                    mb-2 relative z-10">
                    Soyez la première 
                    à savoir!
                  </h2>
                  <p className="text-white/80 
                    text-sm relative z-10">
                    Recevez les nouvelles 
                    collections et offres 
                    exclusives directement 
                    dans votre boîte mail
                  </p>
                </div>

                {/* Form */}
                <div className="bg-white p-6">
                  
                  {/* Benefits */}
                  <p className="text-xs text-gray-500 
                    text-center mb-3 
                    flex items-center 
                    justify-center gap-1.5">
                    <span>👆</span>
                    Choisissez vos préférences
                  </p>

                  <div className="grid 
                    grid-cols-3 gap-3 mb-3">
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
                    ].map((b, i) => {
                      const isSelected = 
                        selectedInterests.includes(b.key)

                      return (
                        <motion.button
                          key={i}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedInterests(prev => {
                              // Toggle selection
                              if (prev.includes(b.key)) {
                                // Keep at least 1 selected
                                if (prev.length === 1) return prev
                                return prev.filter(
                                  k => k !== b.key
                                )
                              }
                              return [...prev, b.key]
                            })
                          }}
                          className={`
                            relative text-center 
                            bg-gray-50 rounded-2xl p-3
                            border-2 transition-all
                            cursor-pointer
                            ${isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-gray-200 opacity-60'
                            }`}>
                          
                          {/* Checkmark when selected */}
                          {isSelected && (
                            <div className="absolute 
                              -top-1.5 -right-1.5
                              w-5 h-5 bg-primary 
                              rounded-full flex items-center
                              justify-center shadow-sm">
                              <Check className="w-3 h-3 
                                text-white"/>
                            </div>
                          )}
                          
                          <p className={`text-2xl mb-1
                            transition-all
                            ${isSelected ? '' : 'grayscale'}`}>
                            {b.icon}
                          </p>
                          <p className={`text-[10px] 
                            font-semibold leading-tight
                            transition-colors
                            ${isSelected
                              ? 'text-gray-700'
                              : 'text-gray-400'
                            }`}>
                            {b.text}
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>

                  <p className="text-center text-[10px]
                    text-primary font-bold mb-4">
                    {selectedInterests.length === 3 
                      ? 'Tout sélectionné ✓' 
                      : `${selectedInterests.length}/3 sélectionné(s)`
                    }
                  </p>

                  <form onSubmit={subscribe}
                    className="space-y-3">
                    
                    <input
                      type="text"
                      value={name}
                      onChange={e => 
                        setName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full px-4 
                        py-3 bg-gray-50 
                        border border-gray-200 
                        rounded-xl text-gray-900 
                        text-sm 
                        focus:outline-none 
                        focus:border-primary"
                    />
                    
                    <input
                      type="email"
                      value={email}
                      onChange={e => 
                        setEmail(e.target.value)}
                      placeholder="votre@email.com *"
                      required
                      className="w-full px-4 
                        py-3 bg-gray-50 
                        border border-gray-200 
                        rounded-xl text-gray-900 
                        text-sm 
                        focus:outline-none 
                        focus:border-primary"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex 
                        items-center 
                        justify-center gap-2 
                        bg-primary 
                        hover:bg-primary-dark 
                        text-white font-black 
                        py-4 rounded-2xl 
                        text-sm transition-all 
                        shadow-lg 
                        shadow-primary/25 
                        disabled:opacity-50">
                      {loading ? (
                        <div className="w-4 h-4 
                          border-2 
                          border-white/30 
                          border-t-white 
                          rounded-full 
                          animate-spin"/>
                      ) : (
                        <>
                          <Bell 
                            className="w-4 h-4"/>
                          M'alerter pour {selectedInterests.length}
                          {selectedInterests.length > 1 
                            ? ' catégories' 
                            : ' catégorie'
                          }!
                          <ArrowRight 
                            className="w-4 h-4"/>
                        </>
                      )}
                    </button>

                    <p className="text-center 
                      text-[10px] 
                      text-gray-400">
                      🔒 Pas de spam. 
                      Désabonnement en 1 clic.
                    </p>
                  </form>

                  <button
                    onClick={dismiss}
                    className="w-full text-center 
                      text-xs text-gray-400 
                      hover:text-gray-600 
                      mt-3 transition-colors">
                    Non merci, je ne veux 
                    pas d'offres exclusives
                  </button>
                </div>
              </>
            ) : (
              /* Success state */
              <div className="bg-white 
                p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: 'spring',
                    damping: 15,
                  }}
                  className="w-20 h-20 
                    bg-secondary/10 
                    rounded-full flex 
                    items-center justify-center 
                    mx-auto mb-5">
                  <Check className="w-10 h-10 
                    text-secondary"/>
                </motion.div>
                <h3 className="text-2xl 
                  font-black text-gray-900 
                  mb-2">
                  Parfait {name || ''}! 🎉
                </h3>
                <p className="text-gray-500 
                  mb-6">
                  Vous serez alertée dès 
                  que de nouvelles collections 
                  arrivent sur Missa Shop!
                </p>
                <button
                  onClick={() => 
                    setVisible(false)}
                  className="bg-primary 
                    text-white font-bold 
                    px-8 py-3 rounded-xl 
                    hover:bg-primary-dark 
                    transition-colors">
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

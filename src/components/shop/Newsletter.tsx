'use client'
import { useState } from 'react'
import { Mail, ArrowRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      toast.error('Email invalide')
      return
    }
    setLoading(true)
    await supabase.from('newsletters').upsert({ email }, { onConflict: 'email' })
    setLoading(false)
    setDone(true)
    setEmail('')
    toast.success('🎉 -10% envoyé dans votre boîte!')
  }

  return (
    <section className="bg-primary py-5 border-t-4 border-orange-400">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">Newsletter — <span className="text-yellow-300"> -10% sur votre 1ère commande</span></p>
              <p className="text-white/70 text-xs">Offres exclusives · Nouveautés · Promotions</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 bg-white/20 rounded-xl px-5 py-2.5">
                <Check className="w-5 h-5 text-yellow-300"/>
                <span className="text-white font-bold text-sm">Inscrit(e)! Merci 🎉</span>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 sm:w-64 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/25 focus:border-white/60 text-sm transition-all"/>
                <button type="submit" disabled={loading} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95 flex-shrink-0 disabled:opacity-70">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><span className="hidden sm:inline">S'inscrire</span><ArrowRight className="w-4 h-4"/></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

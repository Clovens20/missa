'use client'
import { useState } from 'react'
import { Bell, Check, ArrowRight } 
  from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function NewsletterWidget() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = 
    useState(false)

  async function subscribe(
    e: React.FormEvent
  ) {
    e.preventDefault()
    if (!email.includes('@')) return
    
    setLoading(true)
    
    const { error } = await supabase
      .from('collection_subscribers')
      .upsert({
        email: email.toLowerCase().trim(),
        source: 'footer',
        confirmed: true,
      }, {
        onConflict: 'email',
        ignoreDuplicates: true,
      })

    if (!error || 
      error.message.includes('duplicate')
    ) {
      setDone(true)
      localStorage.setItem(
        'missa_subscribed', 'true'
      )
    } else {
      toast.error(error.message)
    }
    
    setLoading(false)
  }

  if (done) return (
    <div className="flex items-center 
      gap-3 text-secondary">
      <Check className="w-5 h-5"/>
      <span className="font-bold text-sm">
        ✅ Vous êtes abonnée!
      </span>
    </div>
  )

  return (
    <form onSubmit={subscribe}
      className="space-y-3">
      <p className="font-black text-white 
        flex items-center gap-2">
        <Bell className="w-4 h-4 
          text-primary"/>
        Alertes nouvelles collections
      </p>
      <p className="text-gray-400 text-xs">
        Recevez nos nouveautés et 
        offres exclusives en avant-première
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => 
            setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          className="flex-1 px-4 py-2.5 
            bg-gray-800 border 
            border-gray-700 rounded-xl 
            text-white text-sm 
            focus:outline-none 
            focus:border-primary 
            placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center 
            gap-1.5 bg-primary 
            hover:bg-primary-dark 
            text-white font-bold 
            px-4 py-2.5 rounded-xl 
            text-sm transition-all 
            disabled:opacity-50">
          {loading ? (
            <div className="w-4 h-4 
              border-2 border-white/30 
              border-t-white rounded-full 
              animate-spin"/>
          ) : (
            <ArrowRight className="w-4 h-4"/>
          )}
        </button>
      </div>
    </form>
  )
}

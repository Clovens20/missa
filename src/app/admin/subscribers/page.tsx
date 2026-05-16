'use client'
import { useState, useEffect } 
  from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Users, Mail, Send,
  Trash2, RefreshCw,
  TrendingUp, Search,
  Package, Zap, 
  RotateCcw, Check, X,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = 
    useState<any[]>([])
  const [notifications, setNotifications] = 
    useState<any[]>([])
  const [loading, setLoading] = 
    useState(true)
  const [sending, setSending] = 
    useState(false)
  const [search, setSearch] = useState('')
  
  // Send form
  const [subject, setSubject] = 
    useState('')
  const [type, setType] = 
    useState<
      'new_products'|
      'flash_sale'|
      'restock'
    >('new_products')
  const [productSearch, setProductSearch] = 
    useState('')
  const [selectedProducts, 
    setSelectedProducts] = 
    useState<any[]>([])
  const [productResults, 
    setProductResults] = 
    useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const [
      { data: subs },
      { data: notifs },
    ] = await Promise.all([
      supabase
        .from('collection_subscribers')
        .select('*')
        .order('created_at', 
          { ascending: false }),
      supabase
        .from('collection_notifications')
        .select('*')
        .order('sent_at', 
          { ascending: false })
        .limit(10),
    ])

    setSubscribers(subs || [])
    setNotifications(notifs || [])
    setLoading(false)
  }

  async function searchProducts(q: string) {
    if (!q.trim()) {
      setProductResults([])
      return
    }
    const { data: prods } = await supabase
      .from('products')
      .select('id, name, price, images, slug')
      .ilike('name', `%${q}%`)
      .eq('is_active', true)
      .limit(5)
    
    const { data: dropProds } = await supabase
      .from('dropship_products')
      .select('id, name, selling_price, images, slug')
      .ilike('name', `%${q}%`)
      .eq('is_active', true)
      .limit(5)
    
    const combined = [
      ...(prods || []),
      ...(dropProds || []).map(p => ({ ...p, price: p.selling_price, is_dropship: true }))
    ].slice(0, 8)
    
    setProductResults(combined)
  }

  async function sendNotification() {
    if (!subject.trim()) {
      toast.error('Sujet requis')
      return
    }
    if (selectedProducts.length === 0) {
      toast.error(
        'Sélectionnez au moins 1 produit'
      )
      return
    }

    setSending(true)
    try {
      const res = await fetch(
        '/api/admin/notify-collection',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 
              'application/json' 
          },
          body: JSON.stringify({
            subject,
            productIds: selectedProducts
              .map(p => p.id),
            type,
          }),
        }
      )
      const data = await res.json()
      
      if (data.success) {
        toast.success(
          `✅ Envoyé à ${data.sent} abonné(e)s!`
        )
        setSubject('')
        setSelectedProducts([])
        loadData()
      } else {
        toast.error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  async function deleteSubscriber(
    id: string
  ) {
    if (!confirm('Supprimer cet abonné?')) 
      return
    await supabase
      .from('collection_subscribers')
      .delete()
      .eq('id', id)
    setSubscribers(prev => 
      prev.filter(s => s.id !== id)
    )
    toast.success('Abonné supprimé')
  }

  const activeCount = subscribers.filter(
    s => s.confirmed
  ).length
  const filtered = subscribers.filter(
    s => !search || 
      s.email.toLowerCase().includes(search.toLowerCase()) || 
      s.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            Abonnés & Alertes 
            <span className="text-sm font-bold bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest">Email</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez votre audience et lancez de nouvelles campagnes de collection
          </p>
        </div>
        <button onClick={loadData}
          className="p-3 bg-gray-900 border border-gray-800 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/>
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Users, label: 'Total Abonnés', value: subscribers.length, color: 'text-white', bg: 'bg-white/5' },
          { icon: Check, label: 'Abonnés Confirmés', value: activeCount, color: 'text-secondary', bg: 'bg-secondary/10' },
          { icon: Mail, label: 'Campagnes Envoyées', value: notifications.length, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s, i) => (
          <div key={i} className={`bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden group`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[60px] opacity-20 ${s.bg}`} />
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 relative z-10`}>
              <s.icon className={`w-6 h-6 ${s.color}`}/>
            </div>
            <p className={`text-4xl font-black ${s.color} relative z-10 tracking-tight`}>{s.value}</p>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1 relative z-10">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Campaign Composer */}
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-primary"/>
            </div>
            <h2 className="text-xl font-black text-white">Nouvelle Alerte Collection</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">Type de Notification</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ['new_products', '✨', 'Nouveautés'],
                  ['flash_sale', '⚡', 'Vente Flash'],
                  ['restock', '🎉', 'Réassort'],
                ] as const).map(([t, emoji, label]) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${type === t ? 'border-primary bg-primary/10 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}>
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-[10px] font-black uppercase">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Objet de l'Email</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex: La nouvelle collection Été est arrivée ! ✨"
                  className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl text-white text-sm focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Sélectionner des Produits (Max 4)</label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 w-4 h-4 text-gray-500"/>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => {
                      setProductSearch(e.target.value)
                      searchProducts(e.target.value)
                    }}
                    placeholder="Chercher par nom..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-950 border border-gray-800 rounded-2xl text-white text-sm focus:outline-none focus:border-primary transition-all"
                  />
                  
                  <AnimatePresence>
                    {productResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden z-20 shadow-2xl">
                        {productResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (selectedProducts.length < 4 && !selectedProducts.find(s => s.id === p.id)) {
                                setSelectedProducts(prev => [...prev, p])
                              }
                              setProductSearch('')
                              setProductResults([])
                            }}
                            className="flex items-center gap-3 w-full px-5 py-4 hover:bg-white/[0.03] transition-colors text-left border-b border-gray-800 last:border-0">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                              <img src={p.images?.[0]?.url || '/placeholder.png'} alt={p.name} className="w-full h-full object-cover"/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-bold truncate">{p.name}</p>
                              <p className="text-primary text-xs font-black">${p.price?.toFixed(2)}</p>
                            </div>
                            <Plus className="w-4 h-4 text-gray-600"/>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {selectedProducts.map(p => (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} key={p.id} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl pl-2 pr-3 py-1.5 group">
                      <div className="w-6 h-6 rounded-lg overflow-hidden bg-gray-800">
                        <img src={p.images?.[0]?.url || '/placeholder.png'} alt="" className="w-full h-full object-cover"/>
                      </div>
                      <span className="text-white text-[10px] font-black">{p.name.substring(0, 15)}...</span>
                      <button onClick={() => setSelectedProducts(prev => prev.filter(s => s.id !== p.id))} className="text-gray-500 hover:text-red-400">
                        <X className="w-3 h-3"/>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={sendNotification}
              disabled={sending || !subject || selectedProducts.length === 0}
              className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl text-sm transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-95">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
              {sending ? 'Expédition en cours...' : `Diffuser à ${activeCount} abonné(e)s`}
            </button>
          </div>
        </div>

        {/* Right: History & List */}
        <div className="space-y-8">
          {/* History */}
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-white">Dernières Alertes</h3>
              <RotateCcw className="w-4 h-4 text-gray-600"/>
            </div>
            <div className="divide-y divide-gray-800 max-h-[300px] overflow-y-auto scrollbar-hide">
              {notifications.map(n => (
                <div key={n.id} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                  <div>
                    <p className="font-bold text-white text-sm">{n.subject}</p>
                    <p className="text-gray-500 text-[10px] font-bold uppercase mt-1">Envoyé le {new Date(n.sent_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-secondary bg-secondary/10 px-3 py-1 rounded-full">{n.recipients_count} 📬</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <div className="p-10 text-center text-gray-500 text-sm">Aucun historique d'envoi</div>}
            </div>
          </div>

          {/* Search Subscriber */}
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-black text-white">Registre des Abonnés</h3>
               <div className="relative flex-1 max-w-[200px] ml-4">
                 <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-600"/>
                 <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher..." className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"/>
               </div>
             </div>
             
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
               {filtered.slice(0, 50).map(s => (
                 <div key={s.id} className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800/50 rounded-2xl group hover:border-gray-700 transition-all">
                   <div className="min-w-0">
                     <p className="text-white text-sm font-bold truncate">{s.email}</p>
                     <p className="text-gray-500 text-[10px] font-medium">{s.name || 'Anonyme'} • Via {s.source}</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${s.confirmed ? 'bg-secondary' : 'bg-gray-600'}`} />
                     <button onClick={() => deleteSubscriber(s.id)} className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-4 h-4"/>
                     </button>
                   </div>
                 </div>
               ))}
               {filtered.length === 0 && <div className="text-center py-10 text-gray-500 text-xs uppercase tracking-widest">Aucun abonné trouvé</div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  )
}

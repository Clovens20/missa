'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Search, Filter, Eye, 
  Package, Truck, Clock,
  CheckCircle, XCircle,
  RefreshCw, Download
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
  confirmed: { label: 'Confirmé', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: CheckCircle },
  processing: { label: '📦 En traitement', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Package },
  shipped: { label: '🚚 Expédié', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', icon: Truck },
  delivered: { label: '✅ Livré', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30', icon: CheckCircle },
  cancelled: { label: '❌ Annulé', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function cancelOrder(orderId: string, orderNumber: string) {
    if (!confirm(`Êtes-vous sûr de vouloir annuler la commande ${orderNumber} ?`)) return
    setCancellingId(orderId)
    try {
      const { error } = await supabase
        .from('guest_orders')
        .update({ order_status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
      
      if (error) throw error
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: 'cancelled' } : o))
      await supabase.from('admin_logs').insert({ 
        admin_email: 'admin', 
        action: 'ORDER_CANCELLED', 
        entity: 'orders', 
        entity_id: orderId, 
        details: { order_number: orderNumber } 
      })
      toast.success(`❌ Commande ${orderNumber} annulée avec succès !`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCancellingId(null)
    }
  }

  useEffect(() => {
    loadOrders()
    const channel = supabase.channel('orders_changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guest_orders' }, (payload) => {
      setOrders(prev => [payload.new as any, ...prev])
      if (Notification.permission === 'granted') { new Notification('🛒 Nouvelle commande!', { body: `${(payload.new as any).order_number} — ${formatPrice((payload.new as any).total)}`, icon: '/logo.png' }) }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadOrders() {
    setRefreshing(true)
    const { data } = await supabase.from('guest_orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false); setRefreshing(false)
  }

  useEffect(() => { if ('Notification' in window && Notification.permission === 'default') { Notification.requestPermission() } }, [])

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.email?.toLowerCase().includes(search.toLowerCase()) || `${o.first_name} ${o.last_name}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc: any, key) => { acc[key] = orders.filter(o => o.order_status === key).length; return acc }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-black text-white">🛒 Commandes</h1><button onClick={loadOrders} disabled={refreshing} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}/>Actualiser</button></div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setStatusFilter('all')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === 'all' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Toutes<span className="bg-gray-700 text-white text-xs px-1.5 rounded-full">{orders.length}</span></button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (<button key={key} onClick={() => setStatusFilter(key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === key ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'bg-gray-800 text-gray-400 hover:text-white'}`}><cfg.icon className="w-3.5 h-3.5"/>{cfg.label}{statusCounts[key] > 0 && <span className={`text-xs px-1.5 rounded-full ${statusFilter === key ? 'bg-white/20' : 'bg-gray-700'}`}>{statusCounts[key]}</span>}</button>))}
      </div>
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par numéro, email, nom..." className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:border-primary focus:outline-none transition-colors"/></div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-800 bg-gray-900">{['Commande', 'Client', 'Articles', 'Total', 'Statut', 'Date', 'Actions'].map(h => (<th key={h} className="text-left px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead><tbody>{loading ? Array(6).fill(0).map((_, i) => (<tr key={i} className="border-b border-gray-800/50">{Array(7).fill(0).map((_, j) => (<td key={j} className="px-5 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"/></td>))}</tr>)) : filtered.length === 0 ? (<tr><td colSpan={7} className="text-center py-12 text-gray-500">Aucune commande trouvée</td></tr>) : filtered.map(order => { const cfg = STATUS_CONFIG[order.order_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending; return (<tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"><td className="px-5 py-4"><span className="text-primary font-black text-sm">{order.order_number}</span></td><td className="px-5 py-4"><p className="text-white font-semibold text-sm">{order.first_name} {order.last_name}</p><p className="text-gray-500 text-xs">{order.email}</p></td><td className="px-5 py-4"><span className="text-gray-300 text-sm">{order.items?.length || 0} article(s)</span></td><td className="px-5 py-4"><span className="text-white font-black">{formatPrice(order.total)}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}><cfg.icon className="w-3 h-3"/>{cfg.label}</span></td><td className="px-5 py-4"><span className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString('fr-CA')}</span><br/><span className="text-gray-600 text-xs">{new Date(order.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span></td><td className="px-5 py-4"><div className="flex items-center gap-2"><Link href={`/admin/orders/${order.id}`} className="flex items-center gap-1.5 bg-gray-800 hover:bg-primary/20 hover:text-primary text-gray-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all w-fit"><Eye className="w-3.5 h-3.5"/>Traiter</Link>{order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (<button onClick={() => cancelOrder(order.id, order.order_number)} disabled={cancellingId === order.id} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all w-fit disabled:opacity-50">{cancellingId === order.id ? (<div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"/>) : (<XCircle className="w-3.5 h-3.5"/>)}Annuler</button>)}</div></td></tr>) })}</tbody></table></div></div>
    </div>
  )
}

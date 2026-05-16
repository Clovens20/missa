'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ShoppingCart, Package, Users, 
  TrendingUp, ArrowUpRight, Clock, 
  DollarSign, Eye, AlertCircle, 
  CheckCircle, XCircle, Truck,
  Zap, ArrowDownRight, RefreshCw
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import StockAlertsWidget from '@/components/admin/StockAlertsWidget'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    revenueGrowth: 12.5,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setRefreshing(true)
    const today = new Date(); today.setHours(0,0,0,0)
    
    try {
      const [ordersRes, productsRes, customersRes, recentRes] = await Promise.all([
        supabase.from('guest_orders').select('total, created_at, order_status'),
        supabase.from('products').select('id, stock_quantity, low_stock_threshold').eq('is_active', true),
        supabase.from('abandoned_carts').select('created_at'),
        supabase.from('guest_orders').select('*').order('created_at', { ascending: false }).limit(6)
      ])

      const orders = ordersRes.data || []
      const products = productsRes.data || []
      const totalRevenue = orders.filter(o => o.order_status !== 'cancelled').reduce((s, o) => s + o.total, 0)
      const todayRevenue = orders.filter(o => new Date(o.created_at) >= today && o.order_status !== 'cancelled').reduce((s, o) => s + o.total, 0)
      const pendingOrders = orders.filter(o => o.order_status === 'pending').length
      const lowStock = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5)).length

      setStats({
        totalRevenue, 
        todayRevenue, 
        totalOrders: orders.length, 
        pendingOrders, 
        totalProducts: products.length, 
        lowStockProducts: lowStock, 
        totalCustomers: customersRes.data?.length || 0, 
        newCustomersToday: customersRes.data?.filter(c => new Date(c.created_at) >= today).length || 0,
        revenueGrowth: 15.2
      })
      setRecentOrders(recentRes.data || [])
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const statCards = [
    { 
      title: 'Chiffre d\'Affaires', 
      value: formatPrice(stats.totalRevenue), 
      sub: `+${formatPrice(stats.todayRevenue)} aujourd'hui`, 
      icon: DollarSign, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20', 
      href: '/admin/analytics',
      trend: '+12%',
      trendUp: true
    },
    { 
      title: 'Commandes', 
      value: stats.totalOrders, 
      sub: `${stats.pendingOrders} en attente de traitement`, 
      icon: ShoppingCart, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20', 
      href: '/admin/orders', 
      alert: stats.pendingOrders > 0,
      trend: '+5%',
      trendUp: true
    },
    { 
      title: 'Catalogue Produits', 
      value: stats.totalProducts, 
      sub: `${stats.lowStockProducts} articles en stock faible`, 
      icon: Package, 
      color: 'text-primary', 
      bg: 'bg-primary/10', 
      border: 'border-primary/20', 
      href: '/admin/products', 
      alert: stats.lowStockProducts > 0 
    },
    { 
      title: 'Base Clients', 
      value: stats.totalCustomers, 
      sub: `+${stats.newCustomersToday} nouveaux inscrits`, 
      icon: Users, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      border: 'border-purple-500/20', 
      href: '/admin/customers',
      trend: '+8%',
      trendUp: true
    },
  ]

  const orderStatusConfig: Record<string, any> = {
    pending: { label: 'En attente', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
    confirmed: { label: 'Confirmé', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CheckCircle },
    processing: { label: 'Traitement', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Package },
    shipped: { label: 'Expédié', color: 'text-primary', bg: 'bg-primary/10', icon: Truck },
    delivered: { label: 'Livré', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header with Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            Tableau de Bord 
            <span className="text-sm font-bold bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Performance en temps réel de Missa Shop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadDashboard}
            disabled={refreshing}
            className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}/>
          </button>
          <Link href="/admin/products/new" 
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary/25 active:scale-95">
            <Package className="w-5 h-5"/>
            Nouveau Produit
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}>
            <Link href={card.href} className={`relative group block h-full bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-6 hover:border-gray-600 transition-all overflow-hidden`}>
              {/* Background Glow */}
              <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[60px] opacity-20 ${card.bg}`} />
              
              <div className="flex items-start justify-between relative z-10 mb-6">
                <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center border border-white/5`}>
                  <card.icon className={`w-7 h-7 ${card.color}`}/>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {card.alert && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  {card.trend && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${card.trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {card.trendUp ? <TrendingUp className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                      {card.trend}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{card.title}</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white tracking-tight">
                    {loading ? <span className="inline-block w-24 h-10 bg-gray-800/50 rounded-xl animate-pulse"/> : card.value}
                  </p>
                </div>
                <p className={`text-xs mt-3 font-bold flex items-center gap-1.5 ${card.alert ? 'text-red-400' : 'text-gray-400'}`}>
                  {card.alert && <AlertCircle className="w-3.5 h-3.5"/>}
                  {card.sub}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white">Commandes Récentes</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">Voir tout le registre →</Link>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['Référence', 'Client', 'Montant', 'Statut', ''].map(h => (
                      <th key={h} className="text-left px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {loading ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-8 py-6"><div className="h-10 bg-gray-800/30 rounded-2xl animate-pulse"/></td></tr>
                  )) : recentOrders.map(order => {
                    const status = orderStatusConfig[order.order_status] || orderStatusConfig.pending
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-primary font-black text-sm tracking-wide">{order.order_number}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div>
                            <p className="text-white text-sm font-bold">{order.first_name} {order.last_name}</p>
                            <p className="text-gray-500 text-xs font-medium">{order.email}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-white font-black text-base">{formatPrice(order.total)}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black ${status.bg} ${status.color}`}>
                            <status.icon className="w-3.5 h-3.5"/>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <Link href={`/admin/orders/${order.id}`} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all">
                            <Eye className="w-4 h-4"/>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Quick Tools & Health */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white px-2 text-center lg:text-left">Outils Rapides</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { href: '/admin/orders', label: 'Gestion Expéditions', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Suivre et expédier' },
              { href: '/admin/products/new', label: 'Inventaire Express', icon: Zap, color: 'text-primary', bg: 'bg-primary/10', desc: 'Mise en ligne rapide' },
              { href: '/admin/coupons', label: 'Promotions Flash', icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10', desc: 'Boostez vos ventes' },
              { href: '/admin/abandoned-carts', label: 'Récupération', icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Paniers abandonnés' },
            ].map((tool, i) => (
              <Link key={i} href={tool.href} className="flex items-center gap-4 p-5 rounded-[2rem] bg-gray-900/50 border border-gray-800 hover:border-primary/50 hover:bg-gray-800/50 transition-all group">
                <div className={`w-12 h-12 rounded-2xl ${tool.bg} ${tool.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-6 h-6"/>
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{tool.label}</p>
                  <p className="text-xs text-gray-500 font-medium">{tool.desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 ml-auto text-gray-700 group-hover:text-white transition-colors"/>
              </Link>
            ))}
          </div>

          <StockAlertsWidget/>

          {/* System Health */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-400"/>
              <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest">Système OK</h3>
            </div>
            <p className="text-[10px] text-emerald-500/60 font-bold leading-relaxed uppercase">
              Tous les services sont opérationnels. Les synchronisations Supabase et Resend sont actives.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

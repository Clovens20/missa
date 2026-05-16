'use client'
import { useState, useEffect } 
  from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown,
  Package, ShoppingCart,
  Users, DollarSign,
  Clock, ArrowUpRight,
  ArrowDownRight, Eye,
  Globe, Instagram,
  Facebook, Smartphone,
  RefreshCw, Download,
  Calendar, BarChart2,
  Activity,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

// ── Custom Tooltip ──────────────────
function CustomTooltip({ 
  active, payload, label 
}: any) {
  if (!active || !payload?.length) 
    return null
  return (
    <div className="bg-gray-900 
      border border-gray-700 
      rounded-xl p-3 shadow-xl">
      <p className="text-gray-400 
        text-xs mb-2 font-bold">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i}
          className="text-sm font-black"
          style={{ color: p.color }}>
          {p.name === 'revenue' || 
           p.name === 'Revenus'
            ? `$${p.value.toFixed(2)}`
            : p.value
          }
          {' '}{p.name}
        </p>
      ))}
    </div>
  )
}

// ── Source Icon ─────────────────────
function SourceIcon({ 
  name 
}: { 
  name: string 
}) {
  const icons: Record<string, string> = {
    'Direct': '🔗',
    'Google': '🔍',
    'Facebook': '👤',
    'Instagram': '📸',
    'WhatsApp': '💬',
    'Autre': '🌐',
  }
  return (
    <span>{icons[name] || '🌐'}</span>
  )
}

// ── Growth Badge ────────────────────
function GrowthBadge({ 
  value 
}: { 
  value: number 
}) {
  const isPos = value >= 0
  return (
    <span className={`flex items-center 
      gap-0.5 text-xs font-black
      ${isPos 
        ? 'text-secondary' 
        : 'text-red-400'
      }`}>
      {isPos 
        ? <ArrowUpRight className="w-3 h-3"/>
        : <ArrowDownRight className="w-3 h-3"/>
      }
      {Math.abs(value)}%
    </span>
  )
}

function StatCard({ title, val, icon: Icon, color, trend }: any) {
  const colors: any = {
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400'
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 group hover:border-primary/30 transition-all shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon className="w-5 h-5"/></div>
        <div className="flex items-center gap-1 text-[10px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-full">{trend}</div>
      </div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-white text-2xl font-black">{val}</h3>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function loadAnalytics(p: string = '30') {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics('30')
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary"/>
            Analytique & Performances
          </h1>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de la santé de votre boutique</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Aujourd\'hui', value: '1' },
            { label: '7 jours', value: '7' },
            { label: '30 jours', value: '30' },
            { label: '90 jours', value: '90' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => {
                setPeriod(p.value)
                loadAnalytics(p.value)
              }}
              className={`px-4 py-2 rounded-xl 
                text-sm font-bold transition-all
                ${period === p.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}>
              {p.label}
            </button>
          ))}
          <button
            onClick={() => loadAnalytics(period)}
            className="p-2 bg-gray-800 
              hover:bg-gray-700 text-gray-400 
              hover:text-white rounded-xl 
              transition-colors">
            <RefreshCw className={`w-4 h-4 
              ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Main KPI Cards - Keep existing ones but with real data if possible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Chiffre d'Affaires" 
          val={formatPrice(data?.summary?.currentRevenue || 0)} 
          icon={DollarSign} 
          color="primary" 
          trend={data?.summary?.revenueGrowth >= 0 ? `+${data?.summary?.revenueGrowth}%` : `${data?.summary?.revenueGrowth}%`} 
        />
        <StatCard 
          title="Commandes" 
          val={data?.summary?.totalOrders || 0} 
          icon={ShoppingCart} 
          color="secondary" 
          trend="Calculé" 
        />
        <StatCard 
          title="Taux Conv." 
          val={`${data?.summary?.conversionRate || '—'}%`} 
          icon={Users} 
          color="blue" 
          trend="Mensuel" 
        />
        <StatCard 
          title="Préc. Revenu" 
          val={formatPrice(data?.summary?.prevRevenue || 0)} 
          icon={TrendingUp} 
          color="purple" 
          trend="Période préc." 
        />
      </div>

      {/* ── REVENUE CHART ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white font-black text-xl flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary"/>
              Revenus & Commandes
            </h3>
            <p className="text-gray-500 text-xs mt-1">
              Évolution sur {period === '1' ? "aujourd'hui" : `les ${period} derniers jours`}
            </p>
          </div>
          {data?.summary?.revenueGrowth !== undefined && (
            <div className="text-right">
              <p className="text-3xl font-black text-white">
                {formatPrice(data.summary.currentRevenue)}
              </p>
              <GrowthBadge value={data.summary.revenueGrowth} />
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={period === '1' ? data?.hourlyData : data?.dailyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey={period === '1' ? 'hour' : 'label'}
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval={period === '30' ? 4 : period === '90' ? 10 : 0}
              />
              <YAxis
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v === 0 ? '0' : `$${v}`}
              />
              <Tooltip content={<CustomTooltip/>} cursor={{ stroke: '#374151', strokeWidth: 2 }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 20 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenus"
                stroke="#FF6B35"
                strokeWidth={4}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 6, fill: '#FF6B35', stroke: '#111', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                name="Commandes"
                stroke="#4ECDC4"
                strokeWidth={3}
                fill="url(#ordersGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#4ECDC4', stroke: '#111', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Best sellers */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
          <h3 className="font-black text-white text-lg flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-secondary"/>
            Produits les plus vendus
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 bg-gray-800/50 rounded-2xl animate-pulse"/>
              ))}
            </div>
          ) : !data?.bestSellers?.length ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-800 mx-auto mb-3"/>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Aucune vente enregistrée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.bestSellers.map((p: any, i: number) => {
                const maxRevenue = data.bestSellers[0]?.revenue || 1
                const pct = Math.round((p.revenue / maxRevenue) * 100)
                return (
                  <div key={p.id || i} className="flex items-center gap-4 group">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-gray-800 text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border border-gray-700 shadow-inner">
                      {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-700"/></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-black truncate">{p.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full shadow-[0_0_8px_rgba(255,107,53,0.4)]"/>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase flex-shrink-0">{p.quantity} vendus</span>
                      </div>
                    </div>
                    <span className="text-primary font-black text-sm tabular-nums flex-shrink-0">{formatPrice(p.revenue)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="font-black text-white text-lg flex items-center gap-2 mb-6">
            <ShoppingCart className="w-5 h-5 text-primary"/>
            Statut des commandes
          </h3>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-8 border-gray-800 border-t-primary animate-spin"/>
            </div>
          ) : !data?.ordersByStatus?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <ShoppingCart className="w-12 h-12 text-gray-800 mb-3"/>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">En attente de commandes</p>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}>
                      {data.ordersByStatus.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} commandes`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                {data.ordersByStatus.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{s.name}</span>
                    </div>
                    <span className="text-xs font-black text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TRAFFIC SOURCES ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="w-48 h-48 text-primary"/>
        </div>
        
        <h3 className="font-black text-white text-xl flex items-center gap-3 mb-8">
          <Globe className="w-6 h-6 text-primary"/>
          Origine du Trafic
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-4 bg-gray-800 px-3 py-1 rounded-full">Analyse Conversion</span>
        </h3>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-8">
             <div className="h-48 bg-gray-800/50 rounded-3xl animate-pulse"/>
             <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-800/50 rounded-2xl animate-pulse"/>)}
             </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.trafficSources || []} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 900 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip/>} />
                <Bar dataKey="value" name="Commandes" radius={[0, 10, 10, 0]} barSize={20}>
                  {(data?.trafficSources || []).map((_: any, i: number) => (
                    <Cell key={i} fill={['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 gap-4 self-center">
              {(data?.trafficSources || []).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-950/40 rounded-3xl border border-gray-800/50 hover:border-gray-700 transition-all group">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition-transform">
                    <SourceIcon name={s.name}/>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-white text-sm font-black tracking-tight">{s.name}</span>
                      <span className="text-primary font-black text-lg">{s.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4] }}
                      />
                    </div>
                  </div>
                  <div className="text-right pl-4 border-l border-gray-800">
                    <p className="text-white font-black text-lg leading-none">{s.value}</p>
                    <p className="text-[8px] font-black text-gray-500 uppercase mt-1">Orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RECENT ORDERS TABLE ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800 bg-gray-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary"/>
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Transactions Récentes</h3>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Temps réel</p>
            </div>
          </div>
          <Link href="/admin/orders" className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-2">
            Journal complet <ArrowUpRight className="w-3.5 h-3.5"/>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-950/20">
                {['Numéro', 'Client', 'Détails', 'Montant', 'Statut', 'Date'].map(h => (
                  <th key={h} className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}><td colSpan={6} className="px-8 py-6"><div className="h-10 bg-gray-800/50 rounded-2xl animate-pulse"/></td></tr>
                ))
              ) : !data?.recentOrders?.length ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-600 font-black uppercase tracking-widest text-xs">Aucune activité récente</td></tr>
              ) : (
                data.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <span className="bg-gray-800 text-primary font-black text-[10px] px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-black text-xs border border-gray-600 shadow-lg">
                          {order.customer_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-black">{order.customer_name}</p>
                          <p className="text-gray-500 text-[10px] font-medium">{order.customer_email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-gray-400 text-xs font-medium max-w-[200px] truncate">
                        {order.items?.map((i: any) => i.product_name).join(', ')}
                      </p>
                      {order.items?.length > 1 && <span className="text-primary text-[10px] font-black">+{order.items.length - 1} autres</span>}
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-black text-white text-base tabular-nums">{formatPrice(order.total_amount)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm ${
                        ['delivered', 'completed'].includes(order.status) ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                        ['shipped'].includes(order.status) ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        ['cancelled'].includes(order.status) ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {order.status === 'pending' ? '⌛ En attente' :
                         order.status === 'processing' ? '⚙️ Préparation' :
                         order.status === 'confirmed' ? '✅ Confirmée' :
                         order.status === 'shipped' ? '🚚 Expédiée' :
                         ['delivered', 'completed'].includes(order.status) ? '🎉 Livrée' :
                         order.status === 'cancelled' ? '❌ Annulée' : order.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                        {new Date(order.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

function InsightItem({ title, desc, trend }: any) {
  return (
    <div className="flex gap-4 p-4 bg-gray-950/40 border border-gray-800/50 hover:bg-gray-900 rounded-3xl transition-all group">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${trend === 'up' ? 'bg-secondary/10 text-secondary' : 'bg-red-500/10 text-red-400'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
      </div>
      <div>
        <h4 className="text-white text-sm font-black tracking-tight">{title}</h4>
        <p className="text-gray-500 text-xs leading-relaxed mt-1 font-medium">{desc}</p>
      </div>
    </div>
  )
}

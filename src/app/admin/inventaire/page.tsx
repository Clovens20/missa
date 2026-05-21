'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Package, TrendingUp,
  TrendingDown, DollarSign,
  ShoppingCart, RefreshCw,
  Download, AlertCircle,
  CheckCircle, ArrowUpRight,
  BarChart2, Layers,
  Tag, Eye, Info,
} from 'lucide-react'
import Link from 'next/link'
import { formatAdminPrice } from '@/lib/utils'

export default function InventairePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [tab, setTab] = useState<'overview' | 'own' | 'drop'>('overview')

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/inventory?period=${period}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Export CSV
  function exportCSV() {
    if (!data) return

    const rows = [
      ['TYPE', 'PRODUIT', 'PRIX ACHAT', 'PRIX VENTE', 'MARGE/UNITÉ', 'UNITÉS VENDUES', 'REVENU TOTAL', 'COÛT TOTAL', 'PROFIT', 'ROI%'],
      ...data.ownProducts.map((p: any) => [
        'Missa Shop',
        p.name,
        p.cost_price.toFixed(2),
        p.sell_price.toFixed(2),
        p.unit_margin.toFixed(2),
        p.units_sold,
        p.total_revenue.toFixed(2),
        p.total_cost.toFixed(2),
        p.total_profit.toFixed(2),
        p.roi_pct + '%',
      ]),
      ...data.dropProducts.map((p: any) => [
        'Dropshipping',
        p.name,
        p.cj_price.toFixed(2),
        p.selling_price.toFixed(2),
        p.unit_margin.toFixed(2),
        p.units_sold,
        p.total_revenue.toFixed(2),
        p.total_cj_cost.toFixed(2),
        p.total_profit.toFixed(2),
        p.margin_pct + '%',
      ]),
    ]

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventaire-${period}j-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  function HealthBadge({ health }: { health: string }) {
    const config: Record<string, {
      label: string
      color: string
      bg: string
    }> = {
      excellent: { 
        label: '🔥 Excellent', 
        color: 'text-secondary',
        bg: 'bg-secondary/10',
      },
      good: { 
        label: '✅ Bon', 
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
      },
      low: { 
        label: '⚠️ Faible', 
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
      },
      loss: { 
        label: '❌ Perte', 
        color: 'text-red-400',
        bg: 'bg-red-500/10',
      },
      no_cost: { 
        label: '💡 Sans coût', 
        color: 'text-gray-400',
        bg: 'bg-gray-700',
      },
    }
    const c = config[health] || config.no_cost

    return (
      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${c.bg} ${c.color}`}>
        {c.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Package className="w-7 h-7 text-primary"/>
            Inventaire & Comptabilité
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Contrôle complet de vos dépenses, gains et profits
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            disabled={!data || loading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
            <Download className="w-4 h-4"/>
            Export CSV
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {[
          ['7', '7 jours'],
          ['30', '30 jours'],
          ['90', '3 mois'],
          ['365', '1 an'],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
              ${period === v
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 bg-gray-800 rounded-2xl animate-pulse"/>
          ))}
        </div>
      ) : data && (
        <>
          {/* ── GRAND TOTAL CARDS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: DollarSign,
                label: 'Revenu Total',
                value: formatAdminPrice(data.grandTotal.total_revenue),
                sub: 'Toutes sources',
                color: 'text-white',
                bg: 'bg-gray-800',
                border: 'border-gray-700',
              },
              {
                icon: TrendingDown,
                label: 'Dépenses Totales',
                value: formatAdminPrice(data.grandTotal.total_expenses),
                sub: 'Achats + CJ',
                color: 'text-red-400',
                bg: 'bg-red-500/5',
                border: 'border-red-500/20',
              },
              {
                icon: TrendingUp,
                label: 'Profit Net',
                value: formatAdminPrice(data.grandTotal.total_profit),
                sub: data.grandTotal.total_profit >= 0 ? '✅ Rentable' : '❌ En perte',
                color: data.grandTotal.total_profit >= 0 ? 'text-secondary' : 'text-red-400',
                bg: data.grandTotal.total_profit >= 0 ? 'bg-secondary/5' : 'bg-red-500/5',
                border: data.grandTotal.total_profit >= 0 ? 'border-secondary/20' : 'border-red-500/20',
              },
              {
                icon: Package,
                label: 'Valeur Stock',
                value: formatAdminPrice(data.ownTotals.stock_value),
                sub: 'Produits en stock',
                color: 'text-primary',
                bg: 'bg-primary/5',
                border: 'border-primary/20',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`${s.bg} border ${s.border} rounded-2xl p-5`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-3`}/>
                <p className={`text-2xl font-black ${s.color}`}>
                  {s.value}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {s.sub}
                </p>
                <p className="text-gray-600 text-[10px] mt-0.5">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-2 bg-gray-800 rounded-2xl p-1.5">
            {([
              ['overview', '📊 Vue Globale'],
              ['own', '🏪 Produits Missa Shop'],
              ['drop', '📦 Dropshipping CJ'],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${tab === t
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                  }`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-5">
              
              {/* Missa Shop summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-black text-white flex items-center gap-2">
                  🏪 Produits Missa Shop
                  <span className="text-xs font-normal text-gray-500">(en stock)</span>
                </h3>
                {[
                  { label: '💸 Total investi', value: formatAdminPrice(data.ownTotals.total_invested), color: 'text-red-400' },
                  { label: '💰 Revenu généré', value: formatAdminPrice(data.ownTotals.total_revenue), color: 'text-white' },
                  { label: '📉 Coût des ventes', value: formatAdminPrice(data.ownTotals.total_cost), color: 'text-red-400' },
                  { label: '📈 Profit brut', value: formatAdminPrice(data.ownTotals.total_profit), color: data.ownTotals.total_profit >= 0 ? 'text-secondary' : 'text-red-400' },
                  { label: '📦 Valeur stock restant', value: formatAdminPrice(data.ownTotals.stock_value), color: 'text-primary' },
                  { label: '🛍️ Unités vendues', value: data.ownTotals.total_units.toString(), color: 'text-gray-300' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{row.label}</span>
                    <span className={`font-black text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}

                {/* ROI global */}
                {data.ownTotals.total_invested > 0 && (
                  <div className="bg-gray-800 rounded-xl p-3 text-center mt-2">
                    <p className="text-xs text-gray-500 mb-1">ROI Global Missa Shop</p>
                    <p className={`text-2xl font-black ${data.ownTotals.total_profit >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                      {`${Math.round((data.ownTotals.total_profit / data.ownTotals.total_invested) * 100)}%`}
                    </p>
                  </div>
                )}
              </div>

              {/* Dropshipping summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-black text-white flex items-center gap-2">
                  📦 Dropshipping CJ
                  <span className="text-xs font-normal text-gray-500">(sans stock)</span>
                </h3>
                {[
                  { label: '💰 Revenu généré', value: formatAdminPrice(data.dropTotals.total_revenue), color: 'text-white' },
                  { label: '📉 Coût CJ payé', value: formatAdminPrice(data.dropTotals.total_cj_cost), color: 'text-red-400' },
                  { label: '📈 Profit net', value: formatAdminPrice(data.dropTotals.total_profit), color: data.dropTotals.total_profit >= 0 ? 'text-secondary' : 'text-red-400' },
                  { label: '🛍️ Unités vendues', value: data.dropTotals.total_units.toString(), color: 'text-gray-300' },
                  { label: '📊 Produits actifs', value: data.dropTotals.products_count.toString(), color: 'text-gray-300' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{row.label}</span>
                    <span className={`font-black text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}

                {/* Info dropshipping */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2 mt-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0"/>
                  <p className="text-[10px] text-blue-300">
                    Le dropshipping ne nécessite pas d'investissement initial. CJ est payé seulement quand vous vendez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── OWN PRODUCTS TAB ── */}
          {tab === 'own' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-black text-white">Produits Missa Shop <span className="text-gray-500 font-normal text-sm ml-2">({data.ownProducts.length})</span></h3>
                <Link href="/admin/products/new" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  + Nouveau produit <ArrowUpRight className="w-3 h-3"/>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      {['Produit', 'Prix achat', 'Prix vente', 'Marge/unité', 'Vendus', 'Revenu', 'Coût vendu', 'Profit', 'Stock', 'Santé'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.ownProducts.map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors text-sm">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                              {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <Package className="w-4 h-4 text-gray-600 m-auto h-full"/>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold truncate max-w-[150px]">{p.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{p.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold text-red-400">{formatAdminPrice(p.cost_price)}</td>
                        <td className="px-4 py-4 font-bold text-white">{formatAdminPrice(p.sell_price)}</td>
                        <td className="px-4 py-4"><span className={`font-black ${p.unit_margin > 0 ? 'text-secondary' : 'text-red-400'}`}>{formatAdminPrice(p.unit_margin)}</span> <span className="text-[10px] text-gray-500">({p.margin_pct}%)</span></td>
                        <td className="px-4 py-4 font-bold text-gray-300">{p.units_sold}</td>
                        <td className="px-4 py-4 font-bold text-white">{formatAdminPrice(p.total_revenue)}</td>
                        <td className="px-4 py-4 text-red-400">{formatAdminPrice(p.total_cost)}</td>
                        <td className="px-4 py-4"><span className={`font-black ${p.total_profit >= 0 ? 'text-secondary' : 'text-red-400'}`}>{formatAdminPrice(p.total_profit)}</span></td>
                        <td className="px-4 py-4"><span className={`font-bold ${p.current_stock <= 5 ? 'text-red-400' : 'text-gray-300'}`}>{p.current_stock}</span></td>
                        <td className="px-4 py-4"><HealthBadge health={p.health}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DROPSHIPPING TAB ── */}
          {tab === 'drop' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-black text-white">Produits Dropshipping CJ <span className="text-gray-500 font-normal text-sm ml-2">({data.dropProducts.length})</span></h3>
                <Link href="/admin/dropshipping" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  Gérer dropshipping <ArrowUpRight className="w-3 h-3"/>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      {['Produit', 'Coût CJ', 'Prix vente', 'Gain/unité', 'Vendus', 'Revenu', 'Payé CJ', 'Gain net', 'Marge'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.dropProducts.map((p: any) => (
                      <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors text-sm">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                              {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <Package className="w-4 h-4 text-gray-600 m-auto h-full"/>}
                            </div>
                            <p className="text-white font-semibold truncate max-w-[150px]">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold text-red-400">{formatAdminPrice(p.cj_price)}</td>
                        <td className="px-4 py-4 font-bold text-white">{formatAdminPrice(p.selling_price)}</td>
                        <td className="px-4 py-4 font-black text-secondary">{formatAdminPrice(p.unit_margin)}</td>
                        <td className="px-4 py-4 font-bold text-gray-300">{p.units_sold}</td>
                        <td className="px-4 py-4 font-bold text-white">{formatAdminPrice(p.total_revenue)}</td>
                        <td className="px-4 py-4 text-red-400">{formatAdminPrice(p.total_cj_cost)}</td>
                        <td className="px-4 py-4 font-black text-secondary">{formatAdminPrice(p.total_profit)}</td>
                        <td className="px-4 py-4"><span className="bg-secondary/20 text-secondary text-[10px] font-black px-2 py-1 rounded-full">{p.margin_pct}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


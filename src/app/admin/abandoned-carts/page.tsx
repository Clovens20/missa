'use client'
import { useState, useEffect } 
  from 'react'
import { supabase } from '@/lib/supabase'
import {
  Clock, RefreshCw, Eye, ShoppingCart, CheckCircle, TrendingUp, DollarSign, Mail
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'


export default function AbandonedCartsPage() {
  const [carts, setCarts] = 
    useState<any[]>([])
  const [stats, setStats] = 
    useState<any>({})
  const [filter, setFilter] = 
    useState<'all'|'active'|'recovered'>
    ('active')
  const [loading, setLoading] = 
    useState(true)

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    setLoading(true)

    // Load carts
    let query = supabase
      .from('abandoned_carts')
      .select('*')
      .order('created_at', 
        { ascending: false })
      .limit(50)

    if (filter === 'active') {
      query = query.eq('recovered', false)
    } else if (filter === 'recovered') {
      query = query.eq('recovered', true)
    }

    const { data } = await query
    setCarts(data || [])

    // Stats
    const { data: allCarts } = 
      await supabase
        .from('abandoned_carts')
        .select('cart_total, recovered')
    
    const total = allCarts?.length || 0
    const recovered = allCarts?.filter(
      c => c.recovered
    ).length || 0
    const totalValue = allCarts?.reduce(
      (sum, c) => sum + (c.cart_total || 0),
      0
    ) || 0
    const recoveredValue = allCarts
      ?.filter(c => c.recovered)
      .reduce(
        (sum, c) => sum + (c.cart_total || 0),
        0
      ) || 0

    setStats({
      total,
      recovered,
      rate: total > 0 
        ? Math.round((recovered/total)*100) 
        : 0,
      totalValue,
      recoveredValue,
    })

    setLoading(false)
  }

  return (
    <div className="space-y-6 text-white">
      
      <div className="flex items-center 
        justify-between">
        <div>
          <h1 className="text-2xl 
            font-black text-white">
            Paniers Abandonnés
          </h1>
          <p className="text-gray-400 
            text-sm mt-1">
            Récupération automatique 
            par email
          </p>
        </div>
        <button onClick={loadData}
          className="p-2 bg-gray-800 
            rounded-xl text-gray-400 
            hover:text-white 
            transition-colors">
          <RefreshCw className="w-5 h-5"/>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 
        md:grid-cols-4 gap-4">
        {[
          {
            icon: ShoppingCart,
            label: 'Total abandonnés',
            value: stats.total || 0,
            color: 'text-white',
            bg: 'bg-gray-800',
          },
          {
            icon: CheckCircle,
            label: 'Récupérés',
            value: stats.recovered || 0,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
          },
          {
            icon: TrendingUp,
            label: 'Taux récupération',
            value: `${stats.rate || 0}%`,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            icon: DollarSign,
            label: 'Revenu récupéré',
            value: formatPrice(
              stats.recoveredValue || 0
            ),
            color: 'text-secondary',
            bg: 'bg-secondary/10',
          },
        ].map((s, i) => (
          <div key={i}
            className={`${s.bg} rounded-2xl 
              p-5 border border-gray-800`}>
            <s.icon className={`w-6 h-6 
              ${s.color} mb-3`}/>
            <p className={`text-2xl 
              font-black ${s.color}`}>
              {s.value}
            </p>
            <p className="text-gray-500 
              text-xs mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Email sequence info */}
      <div className="bg-gray-900 
        border border-gray-800 
        rounded-2xl p-5">
        <h3 className="font-black 
          text-white mb-4 flex items-center 
          gap-2">
          <Mail className="w-5 h-5 
            text-primary"/>
          Séquence emails automatique
        </h3>
        <div className="grid md:grid-cols-3 
          gap-4">
          {[
            {
              delay: '1 heure',
              subject: 'Votre panier vous attend!',
              desc: 'Rappel simple + articles',
              discount: 'Pas de remise',
              color: 'border-blue-500/30 bg-blue-500/5',
            },
            {
              delay: '24 heures',
              subject: '-10% code promo exclusif',
              desc: 'Code promo généré auto',
              discount: '-10% promo',
              color: 'border-primary/30 bg-primary/5',
            },
            {
              delay: '72 heures',
              subject: 'Dernière chance!',
              desc: 'Urgence + expiration panier',
              discount: 'Rappel code promo',
              color: 'border-red-500/30 bg-red-500/5',
            },
          ].map((email, i) => (
            <div key={i}
              className={`border 
                rounded-2xl p-4 
                ${email.color}`}>
              <div className="flex items-center 
                gap-2 mb-3">
                <div className="w-7 h-7 
                  bg-gray-800 rounded-full 
                  flex items-center 
                  justify-center text-xs 
                  font-black text-white">
                  {i + 1}
                </div>
                <span className="text-xs 
                  font-bold text-gray-400 
                  flex items-center gap-1">
                  <Clock className="w-3 h-3"/>
                  Après {email.delay}
                </span>
              </div>
              <p className="font-bold 
                text-white text-sm mb-1">
                {email.subject}
              </p>
              <p className="text-gray-500 
                text-xs mb-2">
                {email.desc}
              </p>
              <span className="text-[10px] 
                font-black text-primary 
                bg-primary/10 px-2 py-0.5 
                rounded-full">
                {email.discount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Carts table */}
      <div className="bg-gray-900 
        border border-gray-800 
        rounded-2xl overflow-hidden">
        
        <div className="flex items-center 
          gap-3 p-5 border-b 
          border-gray-800">
          {(['all', 'active', 'recovered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 
                rounded-xl text-sm 
                font-bold transition-all
                ${filter === f
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
                }`}>
              {f === 'all' 
                ? 'Tous' 
                : f === 'active' 
                  ? '⏳ Actifs' 
                  : '✅ Récupérés'}
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b 
              border-gray-800">
              {['Client', 'Articles', 
                'Total', 'Emails envoyés', 
                'Statut'].map(h => (
                <th key={h}
                  className="px-5 py-3 
                    text-left text-xs 
                    font-bold text-gray-500 
                    uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}
                  className="px-5 py-12 
                    text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : carts.length === 0 ? (
              <tr>
                <td colSpan={5}
                  className="px-5 py-12 
                    text-center text-gray-500">
                  Aucun panier abandonné
                </td>
              </tr>
            ) : (
              carts.map(cart => (
                <tr key={cart.id}
                  className="border-b 
                    border-gray-800 
                    hover:bg-gray-800/50 
                    transition-colors">
                  
                  <td className="px-5 py-4">
                    <p className="font-semibold 
                      text-white text-sm">
                      {cart.customer_name || 
                        'Anonyme'}
                    </p>
                    <p className="text-gray-500 
                      text-xs">
                      {cart.customer_email}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex 
                      -space-x-2">
                      {(cart.items || [])
                        .slice(0, 3)
                        .map((item: any, i: number) => (
                          <div key={i}
                            className="w-8 h-8 
                              rounded-lg overflow-hidden 
                              border-2 border-gray-800 
                              bg-gray-700 relative">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full 
                                  object-cover"
                              />
                            )}
                          </div>
                        ))}
                    </div>
                    <p className="text-gray-500 
                      text-xs mt-1">
                      {cart.items?.length || 0}
                      {' '}article(s)
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-black 
                      text-white">
                      {formatPrice(
                        cart.cart_total
                      )}
                    </p>
                    {cart.discount_code && (
                      <p className="text-xs 
                        text-primary">
                        Code: {cart.discount_code}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex 
                      gap-1.5">
                      {[
                        cart.email_1_sent_at,
                        cart.email_2_sent_at,
                        cart.email_3_sent_at,
                      ].map((sent, i) => (
                        <div key={i}
                          className={`w-7 h-7 
                            rounded-full 
                            flex items-center 
                            justify-center 
                            text-[10px] 
                            font-black border
                            ${sent
                              ? 'bg-secondary/20 border-secondary/30 text-secondary'
                              : 'bg-gray-800 border-gray-700 text-gray-600'
                            }`}
                          title={sent 
                            ? `Email ${i+1} envoyé` 
                            : `Email ${i+1} en attente`
                          }>
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`
                      px-3 py-1 rounded-full 
                      text-xs font-bold
                      ${cart.recovered
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                      {cart.recovered 
                        ? '✅ Récupéré' 
                        : '⏳ En attente'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Setup note */}
      <div className="bg-blue-500/10 
        border border-blue-500/30 
        rounded-2xl p-5 
        flex gap-3">
        <Mail className="w-5 h-5 
          text-blue-400 flex-shrink-0 
          mt-0.5"/>
        <div className="text-sm 
          text-blue-300 space-y-1">
          <p className="font-bold">
            Configuration requise:
          </p>
          <p>
            Ajouter dans Vercel Cron Jobs:
          </p>
          <code className="bg-blue-500/10 
            px-2 py-1 rounded text-xs 
            block mt-2">
            /api/cron/abandoned-cart
            → toutes les heures
          </code>
          <p className="text-xs text-blue-400 mt-2">
            Et ajouter dans .env: 
            CRON_SECRET=votre_secret
          </p>
        </div>
      </div>
    </div>
  )
}

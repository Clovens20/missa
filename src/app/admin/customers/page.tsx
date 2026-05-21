'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, Search, Mail, Phone, 
  ShoppingBag, Calendar, ArrowUpRight,
  Filter, UserCheck
} from 'lucide-react'
import { formatAdminPrice } from '@/lib/utils'
import Link from 'next/link'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      // On récupère les clients uniques à partir des commandes
      const { data } = await supabase
        .from('guest_orders')
        .select('email, first_name, last_name, phone, total, created_at')
        .order('created_at', { ascending: false })
      
      if (data) {
        // Grouper par email pour avoir des clients uniques
        const customerMap = new Map()
        data.forEach(order => {
          const email = order.email.toLowerCase()
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              email,
              name: `${order.first_name} ${order.last_name}`,
              phone: order.phone,
              totalSpent: order.total,
              orderCount: 1,
              lastOrder: order.created_at
            })
          } else {
            const existing = customerMap.get(email)
            customerMap.set(email, {
              ...existing,
              totalSpent: existing.totalSpent + order.total,
              orderCount: existing.orderCount + 1
            })
          }
        })
        setCustomers(Array.from(customerMap.values()))
      }
      setLoading(false)
    }
    loadCustomers()
  }, [])

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary"/>
            </div>
            Clients
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos clients et leur historique d'achat</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-4">
          <div className="text-right border-r border-gray-800 pr-4">
            <p className="text-xs text-gray-500 uppercase font-black">Total Clients</p>
            <p className="text-xl font-black text-white">{customers.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-black">Clients Fidèles</p>
            <p className="text-xl font-black text-secondary">{customers.filter(c => c.orderCount > 1).length}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/>
        <input 
          type="text" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client par nom ou email..." 
          className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                {['Client', 'Contact', 'Commandes', 'Total Dépensé', 'Dernière Activité', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"/></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 italic">Aucun client trouvé</td>
                </tr>
              ) : (
                filtered.map(customer => (
                  <tr key={customer.email} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                          {customer.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{customer.name}</p>
                          {customer.orderCount > 1 && (
                            <span className="flex items-center gap-1 text-[10px] text-secondary font-black uppercase">
                              <UserCheck className="w-3 h-3"/> Client Fidèle
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Mail className="w-3 h-3"/> {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <Phone className="w-3 h-3"/> {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-600"/>
                        <span className="text-white font-bold">{customer.orderCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-black">{formatAdminPrice(customer.totalSpent)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Calendar className="w-3.5 h-3.5"/>
                        {new Date(customer.lastOrder).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/admin/orders?search=${customer.email}`}
                        className="flex items-center gap-1 text-primary hover:text-primary-dark font-bold text-xs transition-colors"
                      >
                        Voir commandes <ArrowUpRight className="w-3 h-3"/>
                      </Link>
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


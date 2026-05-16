'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Ticket, Plus, Pencil, Trash2, 
  Save, X, Calendar, Megaphone,
  CheckCircle, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '', discount_type: 'percentage', discount_value: 10,
    min_purchase_amount: 0, max_uses: '', is_active: true, expires_at: ''
  })

  useEffect(() => { loadCoupons() }, [])

  async function loadCoupons() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.code) return
    
    const data = { ...formData, code: formData.code.toUpperCase(), max_uses: formData.max_uses ? parseInt(formData.max_uses as any) : null }
    
    try {
      if (editingId) {
        await supabase.from('coupons').update(data).eq('id', editingId)
        toast.success('Coupon mis à jour')
      } else {
        await supabase.from('coupons').insert(data)
        toast.success('Nouveau coupon créé')
      }
      setEditingId(null)
      setFormData({ code: '', discount_type: 'percentage', discount_value: 10, min_purchase_amount: 0, max_uses: '', is_active: true, expires_at: '' })
      loadCoupons()
    } catch (err: any) { toast.error(err.message) }
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Supprimer ce coupon ?')) return
    await supabase.from('coupons').delete().eq('id', id)
    loadCoupons()
    toast.success('Coupon supprimé')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-primary"/>
            Codes Promos & Coupons
          </h1>
          <p className="text-gray-500 text-sm mt-1">Créez des remises pour booster vos ventes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sticky top-24 space-y-4 shadow-xl">
            <h2 className="text-white font-bold flex items-center gap-2">
              {editingId ? <Pencil className="w-4 h-4 text-secondary"/> : <Plus className="w-4 h-4 text-primary"/>}
              {editingId ? 'Modifier coupon' : 'Nouveau coupon'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Code Promo</label>
                <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="EX: SUMMER2026" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white font-black text-center tracking-widest focus:border-primary outline-none uppercase"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Type</label>
                  <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                    <option value="percentage">% Pourcentage</option>
                    <option value="fixed">$ Fixe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Valeur</label>
                  <input type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: +e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Expire le (optionnel)</label>
                <input type="date" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none"/>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-black py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              <Save className="w-4 h-4"/> {editingId ? 'Mettre à jour' : 'Créer le coupon'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-900 border border-gray-800 rounded-3xl animate-pulse"/>)
          ) : coupons.length === 0 ? (
            <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl text-gray-500 italic">Aucun coupon actif</div>
          ) : (
            coupons.map((c) => (
              <div key={c.id} className="group bg-gray-900 border border-gray-800 hover:border-primary/30 rounded-3xl p-5 flex items-center justify-between gap-4 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-6 h-6 text-primary"/>
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-wider">{c.code}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-2 font-bold">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% de remise` : `${formatPrice(c.discount_value)} de remise`}
                      <span className="w-1 h-1 bg-gray-700 rounded-full"/>
                      {c.used_count || 0} utilisations
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className={`text-[10px] font-black uppercase ${c.is_active ? 'text-secondary' : 'text-gray-600'}`}>{c.is_active ? '● Actif' : '○ Inactif'}</p>
                    {c.expires_at && <p className="text-gray-500 text-[10px] mt-0.5 flex items-center gap-1 justify-end"><Clock className="w-3 h-3"/> {new Date(c.expires_at).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => {setEditingId(c.id); setFormData({code:c.code, discount_type:c.discount_type, discount_value:c.discount_value, min_purchase_amount:c.min_purchase_amount, max_uses:c.max_uses || '', is_active:c.is_active, expires_at:c.expires_at ? c.expires_at.split('T')[0] : ''})}} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"><Pencil className="w-4 h-4"/></button>
                    <button onClick={() => deleteCoupon(c.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

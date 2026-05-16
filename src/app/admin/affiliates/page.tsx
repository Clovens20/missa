'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Check, X, DollarSign, TrendingUp } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export default function AffiliatesAdminPage() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [featureOn, setFeatureOn] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [defaultCommission, setDefaultCommission] = useState(8)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [affRes, settingRes, commRes] = await Promise.all([
      supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('value').eq('key', 'feature_affiliates').single(),
      supabase.from('site_settings').select('value').eq('key', 'affiliate_default_commission').single()
    ])
    setAffiliates(affRes.data || [])
    setFeatureOn(settingRes.data?.value === true || settingRes.data?.value === 'true')
    setDefaultCommission(parseInt(commRes.data?.value || '8'))
    setLoading(false)
  }

  async function saveProgramSettings() {
    setSavingSettings(true)
    try {
      await supabase.from('site_settings').upsert({ 
        key: 'affiliate_default_commission', 
        value: String(defaultCommission), 
        label: 'Commission Affilié Défaut', 
        category: 'affiliates' 
      })
      toast.success('✅ Commission mise à jour !')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function toggleFeature() {
    const newVal = !featureOn
    await supabase.from('site_settings').update({ value: String(newVal) }).eq('key', 'feature_affiliates')
    setFeatureOn(newVal)
    toast.success(newVal ? '✅ Programme affiliés activé!' : '⏸️ Programme affiliés désactivé')
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('affiliates').update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null }).eq('id', id)
    await loadData(); toast.success(status === 'approved' ? '✅ Affilié approuvé!' : '❌ Affilié rejeté')
  }

  const filtered = affiliates.filter(a => filter === 'all' || a.status === filter)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-purple-400"/></div>
          Programme Affiliés
        </h1>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${featureOn ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-800 border-gray-700'}`}>
          <span className={`text-sm font-bold ${featureOn ? 'text-secondary' : 'text-gray-400'}`}>{featureOn ? '✅ Activé' : '⏸️ Désactivé'}</span>
          <button onClick={toggleFeature} className={`relative w-12 h-6 rounded-full transition-all ${featureOn ? 'bg-secondary' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${featureOn ? 'left-7' : 'left-1'}`}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-2xl font-black text-white">{affiliates.length}</p>
          <p className="text-gray-500 text-xs mt-0.5">Total Candidatures</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-2xl font-black text-secondary">{affiliates.filter(a => a.status === 'approved').length}</p>
          <p className="text-gray-500 text-xs mt-0.5">Ambassadeurs Actifs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-2xl font-black text-primary">{formatPrice(affiliates.reduce((s, a) => s + (a.total_commission || 0), 0))}</p>
          <p className="text-gray-500 text-xs mt-0.5">Commissions Totales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration du programme */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h2 className="text-white font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary"/>
              Réglages Programme
            </h2>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Commission par défaut (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" value={defaultCommission} onChange={e => setDefaultCommission(parseInt(e.target.value))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary"
                />
                <span className="text-gray-500 font-bold">%</span>
              </div>
            </div>
            <button 
              onClick={saveProgramSettings} disabled={savingSettings}
              className="w-full bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingSettings ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check className="w-4 h-4"/>}
              Enregistrer les réglages
            </button>
            <p className="text-[10px] text-gray-500 italic text-center">Ce taux s'appliquera aux futurs ambassadeurs.</p>
          </div>
        </div>

        {/* Liste des candidatures */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'all'].map(v => (
              <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === v ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? <div className="h-20 bg-gray-900 rounded-2xl animate-pulse"/> : filtered.length === 0 ? (
              <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl text-gray-500 italic text-sm">Aucun affilié trouvé</div>
            ) : filtered.map(aff => (
              <div key={aff.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4 group hover:border-gray-700 transition-all">
                <div>
                  <p className="font-black text-white">{aff.full_name}</p>
                  <p className="text-gray-500 text-sm">{aff.email}</p>
                  <div className="flex gap-3 mt-1 text-xs text-primary font-bold uppercase tracking-tighter">
                    <span>Code: {aff.ref_code}</span>
                    <span>Com: {aff.commission_rate}%</span>
                  </div>
                </div>
                {aff.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(aff.id, 'approved')} className="p-2 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-colors"><Check className="w-5 h-5"/></button>
                    <button onClick={() => updateStatus(aff.id, 'rejected')} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${aff.status === 'approved' ? 'bg-secondary/20 text-secondary' : 'bg-red-500/20 text-red-400'}`}>{aff.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

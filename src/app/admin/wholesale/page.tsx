'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Check, X, Mail, Settings, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function WholesaleAdminPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [featureOn, setFeatureOn] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [settings, setSettings] = useState({
    discount: 30,
    minOrder: 200,
    defaultMoq: 10
  })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [appRes, settingRes, discountRes, minOrderRes, defaultMoqRes] = await Promise.all([
      supabase.from('wholesale_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('value').eq('key', 'feature_wholesale').single(),
      supabase.from('site_settings').select('value').eq('key', 'wholesale_default_discount').single(),
      supabase.from('site_settings').select('value').eq('key', 'wholesale_min_order').single(),
      supabase.from('site_settings').select('value').eq('key', 'wholesale_default_moq').single()
    ])
    setApplications(appRes.data || [])
    setFeatureOn(settingRes.data?.value === true || settingRes.data?.value === 'true')
    setSettings({
      discount: parseInt(discountRes.data?.value || '30'),
      minOrder: parseInt(minOrderRes.data?.value || '200'),
      defaultMoq: parseInt(defaultMoqRes.data?.value || '10')
    })
    setLoading(false)
  }

  async function saveProgramSettings() {
    setSavingSettings(true)
    try {
      await Promise.all([
        supabase.from('site_settings').upsert({ key: 'wholesale_default_discount', value: String(settings.discount), label: 'Remise Wholesale Défaut', category: 'wholesale' }),
        supabase.from('site_settings').upsert({ key: 'wholesale_min_order', value: String(settings.minOrder), label: 'Minimum Commande Wholesale', category: 'wholesale' }),
        supabase.from('site_settings').upsert({ key: 'wholesale_default_moq', value: String(settings.defaultMoq), label: 'MOQ Par Défaut (unités)', category: 'wholesale' })
      ])
      toast.success('✅ Paramètres mis à jour !')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function toggleFeature() {
    const newVal = !featureOn
    await supabase.from('site_settings').update({ value: String(newVal) }).eq('key', 'feature_wholesale')
    setFeatureOn(newVal)
    toast.success(newVal ? '✅ Wholesale activé!' : '⏸️ Wholesale désactivé')
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('wholesale_applications').update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null }).eq('id', id)
    await loadData(); toast.success(status === 'approved' ? '✅ Compte grossiste approuvé!' : '❌ Demande rejetée')
  }

  const filtered = applications.filter(a => filter === 'all' || a.status === filter)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-400"/></div>
          B2B Wholesale
        </h1>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${featureOn ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-800 border-gray-700'}`}>
          <span className={`text-sm font-bold ${featureOn ? 'text-secondary' : 'text-gray-400'}`}>{featureOn ? '✅ Activé' : '⏸️ Désactivé'}</span>
          <button onClick={toggleFeature} className={`relative w-12 h-6 rounded-full transition-all ${featureOn ? 'bg-secondary' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${featureOn ? 'left-7' : 'left-1'}`}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration du programme */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary"/>
              Configuration par défaut
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Remise Grossiste (%)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" value={settings.discount} onChange={e => setSettings({...settings, discount: parseInt(e.target.value)})}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary"
                  />
                  <span className="text-gray-500 font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Minimum de Commande ($)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" value={settings.minOrder} onChange={e => setSettings({...settings, minOrder: parseInt(e.target.value)})}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary"
                  />
                  <span className="text-gray-500 font-bold">$</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Quantité Minimum Par Produit (MOQ Global)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" value={settings.defaultMoq} onChange={e => setSettings({...settings, defaultMoq: parseInt(e.target.value)})}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary"
                  />
                  <span className="text-gray-500 font-bold">unités</span>
                </div>
              </div>
            </div>
            <button 
              onClick={saveProgramSettings} disabled={savingSettings}
              className="w-full bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingSettings ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
              Mettre à jour les règles
            </button>
            <p className="text-[10px] text-gray-500 italic text-center">Ces règles s'appliqueront aux nouvelles candidatures.</p>
          </div>
        </div>

        {/* Liste des candidatures */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            {['pending', 'approved', 'all'].map(v => (
              <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === v ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl text-gray-500 italic text-sm">Aucune demande trouvée</div>
            ) : filtered.map(app => (
              <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-gray-700 transition-all">
                <div>
                  <h3 className="font-black text-white text-lg">{app.business_name}</h3>
                  <p className="text-gray-500 text-sm">{app.contact_name} · {app.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-secondary font-black uppercase">
                    <span>Remise: {app.discount_rate}%</span>
                    <span>Min: ${app.min_order_amount}</span>
                  </div>
                </div>
                {app.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(app.id, 'approved')} className="flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-xl font-bold hover:bg-secondary/20 transition-colors"><Check className="w-4 h-4"/> Approuver</button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-bold hover:bg-red-500/20 transition-colors"><X className="w-4 h-4"/> Rejeter</button>
                  </div>
                ) : (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${app.status === 'approved' ? 'bg-secondary/20 text-secondary' : 'bg-red-500/20 text-red-400'}`}>{app.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

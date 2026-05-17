'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Percent, ToggleLeft, ToggleRight, Save, RefreshCw, ChevronRight, ShieldAlert, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TaxProvince {
  name: string
  rate: number
  enabled: boolean
}

export default function AdminTaxSettingsPage() {
  const [enabled, setEnabled] = useState(false)
  const [rates, setRates] = useState<Record<string, TaxProvince>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/shop/tax-settings')
        if (res.ok) {
          const data = await res.json()
          setEnabled(data.tax_enabled)
          setRates(data.tax_rates || {})
        } else {
          toast.error('Erreur lors du chargement des paramètres de taxe')
        }
      } catch (err) {
        console.error(err)
        toast.error('Erreur réseau lors du chargement des taxes')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/shop/tax-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_enabled: enabled,
          tax_rates: rates
        })
      })

      if (res.ok) {
        toast.success('🎉 Configuration des taxes sauvegardée avec succès !')
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur de connexion serveur')
    } finally {
      setSaving(false)
    }
  }

  function handleProvinceToggle(provKey: string) {
    setRates(prev => {
      const current = prev[provKey]
      if (!current) return prev
      return {
        ...prev,
        [provKey]: {
          ...current,
          enabled: !current.enabled
        }
      }
    })
  }

  function handleProvinceChange(provKey: string, field: 'name' | 'rate', val: any) {
    setRates(prev => {
      const current = prev[provKey]
      if (!current) return prev
      return {
        ...prev,
        [provKey]: {
          ...current,
          [field]: field === 'rate' ? parseFloat(val) || 0 : val
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"/>
          <p className="text-gray-400 font-medium text-sm">Chargement du module de taxes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* ── BREADCRUMB / HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3"/>
            <Link href="/admin/settings" className="hover:text-white transition-colors">Paramètres</Link>
            <ChevronRight className="w-3 h-3"/>
            <span className="text-gray-300">Gestion des Taxes</span>
          </nav>
          
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary"/>
            </div>
            Gestion des Taxes
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-13">
            Activez et configurez les taux de taxe applicables par province
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            Sauvegarder les modifications
          </button>
        </div>
      </div>

      {/* ── GLOBAL TOGGLE BANNER ── */}
      <div className={`p-6 rounded-3xl border transition-all ${enabled ? 'bg-secondary/10 border-secondary/30' : 'bg-gray-900 border-gray-800'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-black text-white text-lg flex items-center gap-2">
              {enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-secondary"/> Calcul des taxes activé
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-gray-400"/> Calcul des taxes désactivé
                </>
              )}
            </h2>
            <p className="text-gray-400 text-sm max-w-xl">
              Si activé, les taxes seront calculées automatiquement au checkout pour les clients résidant au Canada en fonction de leur province.
            </p>
          </div>
          
          <button 
            onClick={() => setEnabled(!enabled)}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-sm transition-all ${
              enabled 
                ? 'bg-secondary text-white shadow-lg shadow-secondary/25' 
                : 'bg-gray-800 text-gray-400 hover:text-white border-2 border-gray-700'
            }`}
          >
            {enabled ? <ToggleRight className="w-6 h-6"/> : <ToggleLeft className="w-6 h-6"/>}
            {enabled ? 'MODULE ACTIF' : 'MODULE INACTIF'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {enabled && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Info Box */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3 text-primary text-sm font-semibold">
              <Info className="w-5 h-5 flex-shrink-0" />
              <p>
                Seules les provinces pour lesquelles vous activez explicitement l'interrupteur verront leurs taxes s'appliquer lors de la commande. Les autres provinces seront taxées à 0%.
              </p>
            </div>

            {/* ── PROVINCE RATES GRID ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-800">
                <h3 className="font-black text-white text-base">📍 Configuration par province (Canada)</h3>
                <p className="text-gray-500 text-xs mt-1">Personnalisez le libellé et le pourcentage appliqué pour chaque province desservie</p>
              </div>

              <div className="divide-y divide-gray-800">
                {Object.entries(rates).map(([key, prov]) => {
                  const provCode = key.replace('CA_', '')
                  return (
                    <div 
                      key={key} 
                      className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${
                        prov.enabled ? 'bg-gray-900/60' : 'bg-transparent opacity-60'
                      }`}
                    >
                      {/* Left Block: Flag/Name/Code */}
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center font-black text-white text-base border border-gray-700">
                          {provCode}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{prov.name || `Taxe ${provCode}`}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Canada (Province)</p>
                        </div>
                      </div>

                      {/* Middle Block: Inputs (Editable Name & Rate) */}
                      <div className="flex-1 max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">Nom de la taxe</label>
                          <input 
                            type="text" 
                            value={prov.name} 
                            disabled={!prov.enabled}
                            onChange={e => handleProvinceChange(key, 'name', e.target.value)}
                            placeholder="TPS + TVQ"
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-primary disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">Taux de taxe (%)</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.001"
                              value={prov.rate} 
                              disabled={!prov.enabled}
                              onChange={e => handleProvinceChange(key, 'rate', e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-4 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-primary disabled:opacity-50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Active toggle */}
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          prov.enabled ? 'bg-secondary/20 text-secondary' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {prov.enabled ? 'Active' : 'Inactive'}
                        </span>
                        
                        <button 
                          onClick={() => handleProvinceToggle(key)}
                          className={`relative w-12 h-6.5 rounded-full transition-all duration-300 ${
                            prov.enabled ? 'bg-secondary' : 'bg-gray-700'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                            prov.enabled ? 'left-6.5' : 'left-0.5'
                          }`}/>
                        </button>
                      </div>

                    </div>
                  )
                })}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

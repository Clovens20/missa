'use client'
import { useState } from 'react'
import { 
  Flame, Clock, Eye, 
  TrendingUp, Zap, Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function UrgencySettings({
  product,
  table = 'products',
  onUpdate,
}: {
  product: any
  table?: 'products' | 'dropship_products'
  onUpdate?: () => void
}) {
  const [settings, setSettings] = useState({
    show_urgency: product.show_urgency || false,
    urgency_stock_limit: product.urgency_stock_limit || 10,
    fake_viewers_min: product.fake_viewers_min || 3,
    fake_viewers_max: product.fake_viewers_max || 18,
    show_sold_count: product.show_sold_count !== false,
    flash_sale_ends_at: product.flash_sale_ends_at || '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from(table)
      .update({
        ...settings,
        flash_sale_ends_at: settings.flash_sale_ends_at || null,
      })
      .eq('id', product.id)
    
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('✅ Paramètres urgence sauvegardés!')
      onUpdate?.()
    }
    setSaving(false)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary"/>
          Urgency & Scarcity
        </h3>

        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${settings.show_urgency ? 'text-secondary' : 'text-gray-500'}`}>
            {settings.show_urgency ? '✅ Activé' : '⏸️ Désactivé'}
          </span>
          <button
            onClick={() => setSettings(p => ({ ...p, show_urgency: !p.show_urgency }))}
            className={`relative w-12 h-6 rounded-full transition-all ${settings.show_urgency ? 'bg-secondary' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.show_urgency ? 'left-7' : 'left-1'}`}/>
          </button>
        </div>
      </div>

      {settings.show_urgency && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3"/> Viewers min
              </label>
              <input
                type="number"
                value={settings.fake_viewers_min}
                onChange={e => setSettings(p => ({ ...p, fake_viewers_min: +e.target.value }))}
                min="1" max="50"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3"/> Viewers max
              </label>
              <input
                type="number"
                value={settings.fake_viewers_max}
                onChange={e => setSettings(p => ({ ...p, fake_viewers_max: +e.target.value }))}
                min="1" max="100"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-400"/> Afficher alerte stock quand stock ≤
            </label>
            <input
              type="number"
              value={settings.urgency_stock_limit}
              onChange={e => setSettings(p => ({ ...p, urgency_stock_limit: +e.target.value }))}
              min="1" max="50"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary"/> Flash sale — Expire le <span className="text-gray-600 font-normal">(optionnel)</span>
            </label>
            <input
              type="datetime-local"
              value={settings.flash_sale_ends_at?.substring(0, 16) || ''}
              onChange={e => setSettings(p => ({ ...p, flash_sale_ends_at: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary"/>
              <span className="text-sm text-gray-300">Afficher compteur vendus</span>
            </div>
            <button
              onClick={() => setSettings(p => ({ ...p, show_sold_count: !p.show_sold_count }))}
              className={`relative w-10 h-5 rounded-full transition-all ${settings.show_sold_count ? 'bg-secondary' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.show_sold_count ? 'left-5' : 'left-0.5'}`}/>
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Aperçu sur le shop:</p>
            <div className="space-y-2 text-xs text-gray-300">
              <p>👀 {settings.fake_viewers_min}-{settings.fake_viewers_max} personnes regardent</p>
              <p>🔥 Plus que X en stock (quand ≤ {settings.urgency_stock_limit})</p>
              {settings.flash_sale_ends_at && <p>⏰ Compte à rebours actif</p>}
              {settings.show_sold_count && <p>📈 X vendus</p>}
              <p>🛒 Popup achats récents (automatique)</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl text-sm transition-all disabled:opacity-50">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Flame className="w-4 h-4"/>}
        Sauvegarder
      </button>
    </div>
  )
}

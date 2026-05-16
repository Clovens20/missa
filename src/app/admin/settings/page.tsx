'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Settings, Globe, Type, Palette, ToggleLeft, FileText, Save, RefreshCw, Eye, Shield, Layers, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const settingsTabs = [
  { id: 'general', icon: Globe, label: 'Général', desc: 'Nom, contact, livraison' },
  { id: 'appearance', icon: Palette, label: 'Apparence', desc: 'Couleurs, thème' },
  { id: 'text', icon: Type, label: 'Textes & Boutons', desc: 'Modifier tous les textes' },
  { id: 'features', icon: ToggleLeft, label: 'Fonctionnalités', desc: 'On/Off sections' },
  { id: 'categories', icon: Layers, label: 'Catégories', desc: 'Gérer les catégories' },
  { id: 'legal', icon: FileText, label: 'Pages Légales', desc: 'Privacy, Terms, etc.' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [categories, setCategories] = useState<any[]>([])
  const [legalPages, setLegalPages] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [settingsRes, catsRes, legalRes] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('legal_pages').select('*'),
    ])
    const settingsMap: Record<string, any> = {}
    settingsRes.data?.forEach(s => { settingsMap[s.key] = s.value })
    setSettings(settingsMap)
    setCategories(catsRes.data || [])
    setLegalPages(legalRes.data || [])
    setLoading(false)
  }

  async function saveSetting(key: string, value: any) {
    const { error } = await supabase.from('site_settings').upsert({ key, value: typeof value === 'string' ? JSON.stringify(value) : value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (!error) setSettings(prev => ({ ...prev, [key]: value }))
    return error
  }

  async function saveAllSettings() {
    setSaving(true); let errors = 0
    for (const [key, value] of Object.entries(settings)) { const err = await saveSetting(key, value); if (err) errors++ }
    setSaving(false)
    if (errors === 0) toast.success('✅ Paramètres sauvegardés!')
    else toast.error(`${errors} erreur(s)`)
  }

  async function saveCategory(cat: any) {
    if (cat.id) await supabase.from('categories').update(cat).eq('id', cat.id)
    else await supabase.from('categories').insert(cat)
    await loadAll(); toast.success('Catégorie sauvegardée!')
  }

  async function toggleCategory(id: string, isActive: boolean) {
    await supabase.from('categories').update({ is_active: isActive }).eq('id', id)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c))
    toast.success(isActive ? 'Catégorie activée' : 'Catégorie désactivée')
  }

  async function saveLegalPage(page: any) {
    await supabase.from('legal_pages').upsert(page, { onConflict: 'slug' })
    toast.success('Page légale sauvegardée!')
  }

  function updateSetting(key: string, value: any) { setSettings(prev => ({ ...prev, [key]: value })) }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white flex items-center gap-3"><div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-primary"/></div>Paramètres du Site</h1><p className="text-gray-500 text-sm mt-1 ml-13">Contrôle total de Missa Shop</p></div>
        <div className="flex gap-3"><a href="/" target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"><Eye className="w-4 h-4"/>Voir le site</a><button onClick={saveAllSettings} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/25 disabled:opacity-50">{saving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}Sauvegarder tout</button></div>
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0"><div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">{settingsTabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 p-4 text-left transition-all border-b border-gray-800 last:border-0 ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><tab.icon className="w-5 h-5 flex-shrink-0"/><div className="min-w-0"><p className="font-bold text-sm leading-none mb-0.5">{tab.label}</p><p className="text-[11px] opacity-60 leading-tight">{tab.desc}</p></div>{activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-60"/>}</button>))}</div></div>
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="font-black text-white text-lg">⚙️ Paramètres Généraux</h2>
              {[ ['site_name', 'Nom du site', 'text'], ['site_tagline', 'Slogan', 'text'], ['contact_email', 'Email de contact', 'email'], ['contact_phone', 'Téléphone', 'text'], ['whatsapp', 'WhatsApp', 'text'], ['social_facebook', 'Facebook URL', 'url'], ['social_instagram', 'Instagram URL', 'url'], ['social_tiktok', 'TikTok URL', 'url'] ].map(([key, label, type]) => (
                <div key={key}><label className="block text-sm font-bold text-gray-300 mb-2">{label}</label><input type={type as string} value={typeof settings[key] === 'string' ? settings[key].replace(/^"|"$/g, '') : settings[key] || ''} onChange={e => updateSetting(key as string, e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-500"/></div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-300 mb-2">Livraison gratuite dès ($)</label><input type="number" value={settings.free_shipping_threshold || 50} onChange={e => updateSetting('free_shipping_threshold', +e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
                <div><label className="block text-sm font-bold text-gray-300 mb-2">Taux de taxe (ex: 0.15)</label><input type="number" step="0.01" value={settings.tax_rate || 0.15} onChange={e => updateSetting('tax_rate', +e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
              </div>
            </div>
          )}
          {activeTab === 'text' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <div><h2 className="font-black text-white text-lg">✏️ Textes & Boutons</h2><p className="text-gray-500 text-sm mt-1">Modifiez tous les textes visibles sur le shop sans toucher au code.</p></div>
              {[ ['hero_title', '🎯 Titre principal (Hero)'], ['hero_subtitle', '📝 Sous-titre hero'], ['hero_cta', '🔘 Bouton hero principal'] ].map(([key, label]) => (
                <div key={key}><label className="block text-sm font-bold text-gray-300 mb-2">{label}</label><input type="text" value={typeof settings[key] === 'string' ? settings[key].replace(/^"|"$/g, '') : settings[key] || ''} onChange={e => updateSetting(key as string, e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
              ))}
              <div className="pt-4 border-t border-gray-800">
                <p className="text-sm font-bold text-gray-400 mb-4">Boutons de navigation</p>
                {[ ['nav.all', 'Menu: Toutes catégories'], ['nav.promotions', 'Menu: Promotions'], ['btn.add_cart', 'Bouton: Ajouter au panier'], ['btn.buy_now', 'Bouton: Commander'], ['btn.view_product', 'Bouton: Voir le produit'], ['section.best_sellers', 'Titre: Meilleures ventes'], ['section.new_arrivals', 'Titre: Nouveautés'], ['flash_sale.title', 'Titre: Ventes flash'], ['newsletter.title', 'Newsletter: Titre'], ['newsletter.subtitle', 'Newsletter: Sous-titre'], ['newsletter.btn', 'Newsletter: Bouton'] ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-4 mb-3"><span className="text-xs text-gray-500 font-mono w-48 flex-shrink-0">{key}</span><input type="text" placeholder={`Valeur pour: ${key}`} defaultValue={settings[key] || ''} onBlur={e => saveSetting(key as string, e.target.value)} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'features' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-black text-white text-lg">⚡ Fonctionnalités On/Off</h2>
              {[ ['maintenance_mode', '🔧 Mode Maintenance', 'Désactiver le shop publiquement', true], ['show_flash_sale', '⚡ Ventes Flash', 'Afficher la section flash sale'], ['show_newsletter', '📧 Newsletter Bar', 'Afficher la barre newsletter'], ['show_promo_bar', '📢 Barre Promotions', 'Barre défilante promotions'], ['show_trust_bar', '🛡️ Barre de confiance', 'Badges: livraison, sécurité...'], ['show_reviews', '⭐ Avis clients', 'Activer les avis sur les produits'], ['allow_guest_checkout', '🛒 Checkout sans compte', 'Commander sans créer un compte'], ['show_compare_price', '💰 Prix barré', 'Afficher prix original barré'], ['show_sold_count', '📦 Compteur vendus', 'Afficher "X vendus"'], ['show_stock_warning', '⚠️ Alerte stock faible', 'Afficher "Plus que X en stock"'] ].map(([key, label, desc, danger]) => (
                <div key={key as string} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings[key as string] === true || settings[key as string] === 'true' ? (danger as any) ? 'bg-red-500/10 border-red-500/30' : 'bg-secondary/10 border-secondary/30' : 'bg-gray-800 border-gray-700'}`}>
                  <div><p className="font-bold text-white text-sm">{label as string}</p><p className="text-xs text-gray-400 mt-0.5">{desc as string}</p></div>
                  <button onClick={() => { const current = settings[key as string] === true || settings[key as string] === 'true'; const newVal = !current; updateSetting(key as string, newVal); saveSetting(key as string, newVal) }} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings[key as string] === true || settings[key as string] === 'true' ? (danger as any) ? 'bg-red-500' : 'bg-secondary' : 'bg-gray-600'}`}><span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${settings[key as string] === true || settings[key as string] === 'true' ? 'left-8' : 'left-1'}`}/></button>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="font-black text-white text-lg">🗂️ Gestion Catégories</h2><button onClick={() => { const name = prompt('Nom de la nouvelle catégorie:'); if (name) saveCategory({ name, slug: name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, ''), sort_order: categories.length + 1, is_active: true }) }} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">+ Nouvelle catégorie</button></div>
              <div className="space-y-2">{categories.map(cat => (
                <div key={cat.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${cat.is_active ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/50 border-gray-700/50 opacity-60'}`}>{cat.image_url && <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"><img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover"/></div>}<div className="flex-1 min-w-0"><input type="text" defaultValue={cat.name} onBlur={e => saveCategory({ ...cat, name: e.target.value })} className="bg-transparent text-white font-bold text-sm focus:outline-none focus:bg-gray-700 rounded-lg px-2 py-1 w-full -mx-2"/><p className="text-xs text-gray-500 mt-0.5 px-2">/{cat.slug}</p></div><div className="flex items-center gap-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cat.is_active ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-500'}`}>{cat.is_active ? 'Active' : 'Inactive'}</span><button onClick={() => toggleCategory(cat.id, !cat.is_active)} className={`relative w-12 h-6 rounded-full transition-all ${cat.is_active ? 'bg-secondary' : 'bg-gray-600'}`}><span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${cat.is_active ? 'left-7' : 'left-1'}`}/></button></div></div>
              ))}</div>
            </div>
          )}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-black text-white text-lg mb-6">📄 Pages Légales</h2>
                {legalPages.map(page => (
                  <div key={page.id} className="mb-8 pb-8 border-b border-gray-800 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary"/><div><h3 className="font-bold text-white">{page.title}</h3><p className="text-xs text-gray-500">/{page.slug}</p></div></div><div className="flex items-center gap-2"><a href={`/${page.slug}`} target="_blank" className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 transition-colors">Voir →</a><span className={`text-xs px-2.5 py-1 rounded-full font-bold ${page.is_active ? 'bg-secondary/20 text-secondary' : 'bg-gray-600/20 text-gray-400'}`}>{page.is_active ? 'Active' : 'Inactive'}</span></div></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-2">TITRE</label><input type="text" defaultValue={page.title} onBlur={e => saveLegalPage({ ...page, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none mb-3"/><label className="block text-xs font-bold text-gray-500 mb-2">CONTENU</label><textarea defaultValue={page.content} onBlur={e => saveLegalPage({ ...page, content: e.target.value })} rows={8} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none resize-y font-mono"/></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'appearance' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
              <h2 className="font-black text-white text-lg">🎨 Apparence</h2>
              <div className="grid grid-cols-2 gap-6">
                {[ ['primary_color', 'Couleur principale (Orange)', '#F97316'], ['secondary_color', 'Couleur secondaire (Vert)', '#22C55E'] ].map(([key, label, def]) => (
                  <div key={key}><label className="block text-sm font-bold text-gray-300 mb-3">{label}</label><div className="flex items-center gap-3"><input type="color" value={typeof settings[key] === 'string' ? settings[key].replace(/^"|"$/g, '') : def} onChange={e => updateSetting(key as string, e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-700 p-0.5"/><input type="text" value={typeof settings[key] === 'string' ? settings[key].replace(/^"|"$/g, '') : def} onChange={e => updateSetting(key as string, e.target.value)} className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm font-mono focus:border-primary focus:outline-none"/></div></div>
                ))}
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4"><p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">⚠️ Après modification des couleurs, vous devrez rebuild le site pour appliquer les changements CSS.</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

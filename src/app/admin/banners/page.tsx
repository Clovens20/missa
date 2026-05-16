'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Image as ImageIcon, Plus, Pencil, Trash2, 
  Save, X, Eye, EyeOff, Link as LinkIcon
} from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_BANNERS = [
  {
    title: 'Collection Été 2026',
    subtitle: 'Jusqu\'à -50% sur toute la mode femme',
    image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1600',
    button_text: 'Découvrir',
    button_link: '/catalog?category=mode-femme',
    is_active: true,
    sort_order: 1
  },
  {
    title: 'Look Homme Premium',
    subtitle: 'Nouveautés et styles incontournables',
    image_url: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1600',
    button_text: 'Acheter',
    button_link: '/catalog?category=mode-homme',
    is_active: true,
    sort_order: 2
  }
]

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '', subtitle: '', image_url: '', 
    button_text: 'Découvrir', button_link: '/', is_active: true
  })

  useEffect(() => { loadBanners() }, [])

  async function loadBanners() {
    // S'assurer que la table existe (Silently fail if it doesn't, we will handle it)
    const { data, error } = await supabase.from('banners').select('*').order('sort_order')
    if (error && error.code === '42P01') {
      toast.error('La table "banners" n\'existe pas encore. Exécutez le SQL.')
      setLoading(false)
      return
    }
    setBanners(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.image_url) { toast.error('L\'image est obligatoire'); return }
    
    try {
      if (editingId) {
        await supabase.from('banners').update(formData).eq('id', editingId)
        toast.success('Bannière mise à jour')
      } else {
        const { count } = await supabase.from('banners').select('*', { count: 'exact', head: true })
        await supabase.from('banners').insert({ ...formData, sort_order: (count || 0) + 1 })
        toast.success('Nouvelle bannière créée')
      }
      setEditingId(null)
      setFormData({ title: '', subtitle: '', image_url: '', button_text: 'Découvrir', button_link: '/', is_active: true })
      loadBanners()
    } catch (err: any) { toast.error(err.message) }
  }

  async function deleteBanner(id: string) {
    if (!confirm('Supprimer cette bannière ?')) return
    await supabase.from('banners').delete().eq('id', id)
    loadBanners()
    toast.success('Bannière supprimée')
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    await supabase.from('banners').update({ is_active: !currentStatus }).eq('id', id)
    loadBanners()
  }

  async function seedBanners() {
    setLoading(true)
    try {
      const { error } = await supabase.from('banners').insert(DEFAULT_BANNERS)
      if (error) throw error
      toast.success('Bannières initialisées !')
      loadBanners()
    } catch (err: any) { toast.error(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-primary"/>
            Bannières Hero
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez le slider principal de votre page d'accueil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-24 space-y-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              {editingId ? <Pencil className="w-4 h-4 text-secondary"/> : <Plus className="w-4 h-4 text-primary"/>}
              {editingId ? 'Modifier la bannière' : 'Nouvelle bannière'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Titre principal</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Promo d'Été" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Sous-titre</label>
                <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="Ex: Jusqu'à -70%" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">URL de l'image</label>
                <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Texte bouton</label>
                  <input type="text" value={formData.button_text} onChange={e => setFormData({...formData, button_text: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs outline-none"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Lien bouton</label>
                  <input type="text" value={formData.button_link} onChange={e => setFormData({...formData, button_link: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs outline-none"/>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-black py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4"/> Enregistrer la bannière
            </button>
            {editingId && <button type="button" onClick={() => setEditingId(null)} className="w-full bg-gray-800 text-gray-400 py-2 rounded-xl text-xs">Annuler</button>}
          </form>
        </div>

        {/* Liste / Aperçu */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            Array(2).fill(0).map((_, i) => <div key={i} className="h-40 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse"/>)
          ) : banners.length === 0 ? (
            <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl space-y-4">
              <p className="text-gray-500 italic">Aucune bannière active</p>
              <button onClick={seedBanners} className="bg-secondary/10 hover:bg-secondary/20 text-secondary font-black px-6 py-3 rounded-xl border border-secondary/30 transition-all text-sm">
                🚀 Générer les bannières par défaut
              </button>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group">
                <div className="aspect-[21/9] relative">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover opacity-60"/>
                  <div className="absolute inset-0 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-black text-white">{banner.title}</h3>
                    <p className="text-gray-300 text-sm">{banner.subtitle}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full">{banner.button_text}</span>
                      <span className="text-gray-500 text-[10px] flex items-center gap-1"><LinkIcon className="w-3 h-3"/> {banner.button_link}</span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleStatus(banner.id, banner.is_active)} className={`p-2 rounded-xl border ${banner.is_active ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                    {banner.is_active ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                  </button>
                  <button onClick={() => {setEditingId(banner.id); setFormData({title:banner.title, subtitle:banner.subtitle, image_url:banner.image_url, button_text:banner.button_text, button_link:banner.button_link, is_active:banner.is_active})}} className="p-2 bg-gray-800 text-white rounded-xl border border-gray-700 hover:bg-gray-700">
                    <Pencil className="w-4 h-4"/>
                  </button>
                  <button onClick={() => deleteBanner(banner.id)} className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/30">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

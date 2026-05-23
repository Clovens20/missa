'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Tag, Plus, Pencil, Trash2, 
  ChevronUp, ChevronDown, Save, X,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { slugify } from '@/lib/utils'

const DEFAULT_CATEGORIES = [
  { name: '👗 Femme', slug: 'femme', image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800' },
  { name: '👔 Homme', slug: 'homme', image_url: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&q=80&w=800' },
  { name: '👶 Enfants', slug: 'enfants', image_url: 'https://images.unsplash.com/photo-1519700202751-039c92284f13?auto=format&fit=crop&q=80&w=800' },
  { name: '👟 Chaussures', slug: 'chaussures', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800' },
  { name: '👜 Sacs', slug: 'sacs', image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800' },
  { name: '💄 Beauté', slug: 'beaute', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=800' },
  { name: '🏠 Maison', slug: 'maison', image_url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=800' },
  { name: '📱 Tech', slug: 'electronique', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800' }
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{name: string, slug: string, image_url: string, is_active: boolean, parent_id: string | null}>({ name: '', slug: '', image_url: '', is_active: true, parent_id: null })

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
    setLoading(false)
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({ ...prev, name, slug: slugify(name) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) return
    
    try {
      if (editingId) {
        await supabase.from('categories').update(formData).eq('id', editingId)
        toast.success('Catégorie mise à jour')
      } else {
        const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true })
        await supabase.from('categories').insert({ ...formData, sort_order: (count || 0) + 1 })
        toast.success('Nouvelle catégorie créée')
      }
      setEditingId(null)
      setFormData({ name: '', slug: '', image_url: '', is_active: true, parent_id: null })
      loadCategories()
    } catch (err: any) { toast.error(err.message) }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Supprimer cette catégorie et toutes ses sous-catégories ?')) return
    // Subcategories should be deleted automatically if DB has ON DELETE CASCADE,
    // otherwise we just delete the category and let the user handle it or delete them here.
    // For safety, let's delete subs first
    await supabase.from('categories').delete().eq('parent_id', id)
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
    toast.success('Catégorie supprimée')
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      await supabase.from('categories').update({ is_active: !currentStatus }).eq('id', id)
      toast.success(currentStatus ? 'Catégorie désactivée' : 'Catégorie activée')
      loadCategories()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function move(id: string, direction: 'up' | 'down') {
    const index = categories.findIndex(c => c.id === id)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return

    const newCategories = [...categories]
    const otherIndex = direction === 'up' ? index - 1 : index + 1
    const [moved] = newCategories.splice(index, 1)
    newCategories.splice(otherIndex, 0, moved)

    // Update orders in DB
    const updates = newCategories.map((c, i) => ({ id: c.id, sort_order: i + 1 }))
    for (const update of updates) {
      await supabase.from('categories').update({ sort_order: update.sort_order }).eq('id', update.id)
    }
    setCategories(newCategories)
  }

  async function seedCategories() {
    setLoading(true)
    try {
      const { error } = await supabase.from('categories').insert(
        DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sort_order: i + 1 }))
      )
      if (error) throw error
      toast.success('🚀 Catégories initialisées !')
      loadCategories()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderCategoryRow = (cat: any, isSub: boolean = false) => (
    <div key={cat.id} className={`group border border-gray-800 hover:border-gray-700 rounded-2xl flex items-center gap-4 transition-all shadow-lg ${isSub ? 'bg-gray-900/50 p-3 ml-12' : 'bg-gray-900 p-4'}`}>
      {!isSub && (
        <div className="w-12 h-12 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
          {cat.image_url ? <img src={cat.image_url} className="w-full h-full object-cover"/> : <ImageIcon className="w-5 h-5 text-gray-600"/>}
        </div>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <div>
          <p className="text-white font-bold text-sm">{cat.name}</p>
          <p className="text-gray-500 text-xs font-mono truncate">{cat.slug}</p>
        </div>
        {!cat.is_active && (
          <span className="bg-gray-800 text-gray-400 text-[10px] font-black px-2 py-1 rounded-md border border-gray-700 uppercase">
            Cachée
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => toggleActive(cat.id, cat.is_active)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider">
          {cat.is_active ? 'Désactiver' : 'Activer'}
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1"/>
        <button onClick={() => move(cat.id, 'up')} className="p-1.5 text-gray-500 hover:text-white disabled:opacity-0"><ChevronUp className="w-4 h-4"/></button>
        <button onClick={() => move(cat.id, 'down')} className="p-1.5 text-gray-500 hover:text-white disabled:opacity-0"><ChevronDown className="w-4 h-4"/></button>
        <div className="w-px h-4 bg-gray-800 mx-1"/>
        <button onClick={() => {setEditingId(cat.id); setFormData({name:cat.name, slug:cat.slug, image_url:cat.image_url || '', is_active:cat.is_active, parent_id: cat.parent_id})}} className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"><Pencil className="w-4 h-4"/></button>
        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Tag className="w-6 h-6 text-primary"/>
            Catégories
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les rayons de votre boutique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sticky top-24 space-y-4 shadow-xl">
            <h2 className="text-white font-bold flex items-center gap-2">
              {editingId ? <Pencil className="w-4 h-4 text-secondary"/> : <Plus className="w-4 h-4 text-primary"/>}
              {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Nom</label>
                <input 
                  type="text" value={formData.name} onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ex: Mode Homme" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Slug</label>
                <input 
                  type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-gray-500 text-xs font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Lien de l'image (URL)</label>
                <input 
                  type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Catégorie Parente</label>
                <select 
                  value={formData.parent_id || ''} 
                  onChange={e => setFormData({...formData, parent_id: e.target.value || null})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary"
                >
                  <option value="">-- Aucune (Principale) --</option>
                  {categories.filter(c => !c.parent_id && c.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {formData.image_url && (
                <div className="aspect-video bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover opacity-50"/>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-primary' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs font-bold text-gray-400">
                  {formData.is_active ? 'Catégorie Active (Visible)' : 'Catégorie Cachée'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white font-black py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4"/> Enregistrer
              </button>
              {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setFormData({name:'', slug:'', image_url:'', is_active:true, parent_id: null})}} className="bg-gray-800 text-gray-400 p-2.5 rounded-xl hover:text-white">
                  <X className="w-5 h-5"/>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse"/>)
          ) : categories.length === 0 ? (
            <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl space-y-4">
              <p className="text-gray-500 italic">Aucune catégorie créée</p>
              <button 
                onClick={seedCategories}
                className="bg-secondary/10 hover:bg-secondary/20 text-secondary font-black px-6 py-3 rounded-xl border border-secondary/30 transition-all text-sm"
              >
                🚀 Initialiser avec les catégories par défaut
              </button>
            </div>
          ) : (
            categories.filter(c => !c.parent_id).map((cat) => (
              <div key={cat.id} className="space-y-2">
                {renderCategoryRow(cat, false)}
                {categories.filter(sub => sub.parent_id === cat.id).map(sub => renderCategoryRow(sub, true))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

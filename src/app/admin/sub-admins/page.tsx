'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserCog, Plus, Trash2, Shield, ShieldCheck, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const ALL_PERMISSIONS = [
  { key: 'products', label: '📦 Produits' },
  { key: 'orders', label: '🛒 Commandes' },
  { key: 'customers', label: '👥 Clients' },
  { key: 'categories', label: '🗂️ Catégories' },
  { key: 'banners', label: '🖼️ Bannières' },
  { key: 'coupons', label: '🏷️ Coupons' },
  { key: 'analytics', label: '📊 Analytique' },
  { key: 'settings', label: '⚙️ Paramètres' },
  { key: 'legal_pages', label: '📄 Pages légales' },
  { key: 'sub_admins', label: '👑 Sous-admins' },
]

export default function SubAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    email: '', full_name: '', password: '', permissions: { products: true, orders: true, customers: false, categories: false, banners: false, coupons: false, analytics: false, settings: false, legal_pages: false, sub_admins: false }
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadAdmins() }, [])

  async function loadAdmins() {
    const { data } = await supabase.from('admin_users').select('*').eq('role', 'sub_admin').order('created_at', { ascending: false })
    setAdmins(data || [])
  }

  async function createSubAdmin() {
    if (!newAdmin.email || !newAdmin.full_name || !newAdmin.password) { toast.error('Remplissez tous les champs'); return }
    setCreating(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email: newAdmin.email, password: newAdmin.password, email_confirm: true })
      if (authError) throw authError
      const { error: adminError } = await supabase.from('admin_users').insert({ user_id: authData.user?.id, email: newAdmin.email, full_name: newAdmin.full_name, role: 'sub_admin', permissions: newAdmin.permissions, is_active: true })
      if (adminError) throw adminError
      toast.success(`✅ ${newAdmin.full_name} créé(e)!`); setShowForm(false)
      setNewAdmin({ email: '', full_name: '', password: '', permissions: { products: true, orders: true, customers: false, categories: false, banners: false, coupons: false, analytics: false, settings: false, legal_pages: false, sub_admins: false } })
      loadAdmins()
    } catch (err: any) { toast.error(err.message) } finally { setCreating(false) }
  }

  async function toggleAdminStatus(id: string, isActive: boolean) {
    await supabase.from('admin_users').update({ is_active: isActive }).eq('id', id)
    await loadAdmins(); toast.success(isActive ? 'Admin activé' : 'Admin désactivé')
  }

  async function updatePermissions(id: string, permissions: any) {
    await supabase.from('admin_users').update({ permissions }).eq('id', id)
    await loadAdmins(); toast.success('Permissions mises à jour')
  }

  async function deleteAdmin(id: string) {
    if (!confirm('Supprimer cet administrateur?')) return
    await supabase.from('admin_users').delete().eq('id', id)
    await loadAdmins(); toast.success('Admin supprimé')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white flex items-center gap-3"><div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><UserCog className="w-5 h-5 text-purple-400"/></div>Sous-Administrateurs</h1><p className="text-gray-500 text-sm mt-1">Gérez les accès de votre équipe</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/25"><Plus className="w-4 h-4"/>Ajouter un admin</button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-primary/30 rounded-2xl p-6">
          <h2 className="font-black text-white mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-primary"/>Créer un sous-administrateur</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div><label className="block text-xs font-bold text-gray-400 mb-2">NOM COMPLET</label><input type="text" value={newAdmin.full_name} onChange={e => setNewAdmin(p => ({ ...p, full_name: e.target.value }))} placeholder="Marie Dupont" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
            <div><label className="block text-xs font-bold text-gray-400 mb-2">EMAIL</label><input type="email" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} placeholder="marie@missashopp.com" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
            <div><label className="block text-xs font-bold text-gray-400 mb-2">MOT DE PASSE TEMPORAIRE</label><input type="password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none"/></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-400 mb-3">PERMISSIONS ACCORDÉES</label><div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">{ALL_PERMISSIONS.map(perm => (<button key={perm.key} onClick={() => setNewAdmin(p => ({ ...p, permissions: { ...p.permissions, [perm.key]: !p.permissions[perm.key as keyof typeof p.permissions] } }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${newAdmin.permissions[perm.key as keyof typeof newAdmin.permissions] ? 'bg-secondary/20 border-secondary/40 text-secondary' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'}`}>{newAdmin.permissions[perm.key as keyof typeof newAdmin.permissions] ? <Check className="w-3 h-3"/> : <X className="w-3 h-3"/>}{perm.label}</button>))}</div></div>
          <div className="flex gap-3"><button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-700 rounded-xl text-gray-400 hover:text-white font-semibold text-sm transition-colors">Annuler</button><button onClick={createSubAdmin} disabled={creating} className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">{creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><ShieldCheck className="w-4 h-4"/>Créer le sous-admin</>}</button></div>
        </motion.div>
      )}

      <div className="space-y-4">{admins.length === 0 ? (<div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center"><UserCog className="w-12 h-12 text-gray-600 mx-auto mb-4"/><p className="text-gray-400 font-semibold mb-2">Aucun sous-admin créé</p><p className="text-gray-600 text-sm">Créez votre première équipe de gestion</p></div>) : (
          admins.map(admin => (
            <div key={admin.id} className={`bg-gray-900 border rounded-2xl p-5 transition-all ${admin.is_active ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4 mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-black text-white">{admin.full_name?.[0] || 'A'}</div><div><p className="font-bold text-white">{admin.full_name}</p><p className="text-gray-500 text-sm">{admin.email}</p>{admin.last_login && <p className="text-gray-600 text-xs mt-0.5">Dernière connexion: {new Date(admin.last_login).toLocaleDateString('fr')}</p>}</div></div><div className="flex items-center gap-2"><button onClick={() => toggleAdminStatus(admin.id, !admin.is_active)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${admin.is_active ? 'bg-secondary/20 text-secondary hover:bg-secondary/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>{admin.is_active ? '✅ Actif' : '❌ Inactif'}</button><button onClick={() => deleteAdmin(admin.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button></div></div>
              <div><p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-2">Permissions</p><div className="flex flex-wrap gap-1.5">{ALL_PERMISSIONS.map(perm => { const hasPerm = admin.permissions?.[perm.key]; return (<button key={perm.key} onClick={async () => { const newPerms = { ...admin.permissions, [perm.key]: !hasPerm }; await updatePermissions(admin.id, newPerms) }} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${hasPerm ? 'bg-secondary/15 border-secondary/30 text-secondary' : 'bg-gray-800 border-gray-700 text-gray-600 hover:border-gray-500'}`}>{hasPerm ? <Check className="w-2.5 h-2.5"/> : <X className="w-2.5 h-2.5"/>}{perm.label}</button>) })}</div></div>
            </div>
          ))
        )}</div>
    </div>
  )
}

'use client'
import { useState, useEffect }
  from 'react'
import { motion, AnimatePresence }
  from 'framer-motion'
import {
  Plus, X, Save, Trash2,
  ExternalLink, Eye, EyeOff, Edit3,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Platform configs ──────────────────
const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    bg: 'bg-blue-600',
    icon: '📘',
    placeholder:
      'https://facebook.com/votrepage',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    icon: '📸',
    placeholder:
      'https://instagram.com/votrecompte',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#010101',
    bg: 'bg-gray-900',
    icon: '🎵',
    placeholder:
      'https://tiktok.com/@votrecompte',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    bg: 'bg-red-600',
    icon: '▶️',
    placeholder:
      'https://youtube.com/@votrechaine',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    color: '#000000',
    bg: 'bg-black',
    icon: '𝕏',
    placeholder:
      'https://twitter.com/votrecompte',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    bg: 'bg-green-500',
    icon: '💬',
    placeholder:
      'https://wa.me/1XXXXXXXXXX',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    color: '#E60023',
    bg: 'bg-red-500',
    icon: '📌',
    placeholder:
      'https://pinterest.com/votrecompte',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    color: '#FFFC00',
    bg: 'bg-yellow-400',
    icon: '👻',
    placeholder:
      'https://snapchat.com/add/votrecompte',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    bg: 'bg-blue-700',
    icon: '💼',
    placeholder:
      'https://linkedin.com/company/votre',
  },
  {
    id: 'threads',
    name: 'Threads',
    color: '#000000',
    bg: 'bg-gray-800',
    icon: '🧵',
    placeholder:
      'https://threads.net/@votrecompte',
  },
]

interface SocialLink {
  id: string
  platform: string
  label: string
  url: string
  is_active: boolean
  display_order: number
}

export default function SocialLinksPage() {

  const [links, setLinks] =
    useState<SocialLink[]>([])
  const [loading, setLoading] =
    useState(true)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [editForm, setEditForm] =
    useState<Partial<SocialLink>>({})
  const [showAddForm, setShowAddForm] =
    useState(false)
  const [addForm, setAddForm] = useState({
    platform: 'facebook',
    label: '',
    url: '',
    is_active: true,
  })
  const [saving, setSaving] =
    useState(false)

  useEffect(() => {
    loadLinks()
  }, [])

  async function loadLinks() {
    setLoading(true)
    try {
      const res = await fetch(
        '/api/admin/social-links'
      )
      const { data } = await res.json()
      setLinks(data || [])
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // Toggle active/inactive
  async function toggleActive(
    link: SocialLink
  ) {
    const optimistic = links.map(l =>
      l.id === link.id
        ? { ...l, is_active: !l.is_active }
        : l
    )
    setLinks(optimistic)

    const res = await fetch(
      '/api/admin/social-links',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: link.id,
          is_active: !link.is_active,
        }),
      }
    )

    if (!res.ok) {
      setLinks(links) // revert
      toast.error('Erreur')
    } else {
      toast.success(
        link.is_active
          ? '🔒 Masqué du footer'
          : '✅ Visible dans le footer'
      )
    }
  }

  // Save edit
  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(
        '/api/admin/social-links',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id, ...editForm
          }),
        }
      )
      const { data } = await res.json()
      setLinks(prev => prev.map(l =>
        l.id === id ? data : l
      ))
      setEditingId(null)
      toast.success('✅ Sauvegardé!')
    } catch {
      toast.error('Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Delete
  async function deleteLink(id: string) {
    if (!confirm(
      'Supprimer ce réseau social?'
    )) return

    const res = await fetch(
      '/api/admin/social-links',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id }),
      }
    )

    if (res.ok) {
      setLinks(prev =>
        prev.filter(l => l.id !== id)
      )
      toast.success('🗑️ Supprimé')
    }
  }

  // Add new
  async function addLink() {
    if (!addForm.url.trim()) {
      toast.error('URL requis')
      return
    }

    setSaving(true)
    try {
      const platform = PLATFORMS.find(
        p => p.id === addForm.platform
      )
      const res = await fetch(
        '/api/admin/social-links',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...addForm,
            label: addForm.label ||
              platform?.name ||
              addForm.platform,
            display_order: links.length + 1,
          }),
        }
      )
      const { data } = await res.json()
      setLinks(prev => [...prev, data])
      setShowAddForm(false)
      setAddForm({
        platform: 'facebook',
        label: '',
        url: '',
        is_active: true,
      })
      toast.success('✅ Réseau ajouté!')
    } catch {
      toast.error('Erreur')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = links.filter(
    l => l.is_active
  ).length

  if (loading) return (
    <div className="flex items-center
      justify-center h-64">
      <div className="w-8 h-8 border-2
        border-primary/30
        border-t-primary rounded-full
        animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl p-6">

      {/* Header */}
      <div className="flex items-center
        justify-between">
        <div>
          <h1 className="text-2xl
            font-black text-white
            flex items-center gap-3">
            <Share2 className="w-6 h-6
              text-primary"/>
            Réseaux Sociaux
          </h1>
          <p className="text-gray-500
            text-sm mt-0.5">
            {activeCount} réseau(x) affiché(s)
            dans le footer
          </p>
        </div>

        <button
          onClick={() =>
            setShowAddForm(!showAddForm)}
          className="flex items-center
            gap-2 bg-primary
            hover:bg-primary-dark
            text-white font-black
            px-4 py-2.5 rounded-xl
            text-sm transition-colors">
          <Plus className="w-4 h-4"/>
          Ajouter
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{
              opacity: 0, height: 0
            }}
            animate={{
              opacity: 1, height: 'auto'
            }}
            exit={{
              opacity: 0, height: 0
            }}
            className="bg-gray-900
              border border-primary/30
              rounded-2xl overflow-hidden">

            <div className="px-5 py-4
              border-b border-gray-800
              flex items-center
              justify-between">
              <h3 className="font-black
                text-white flex items-center
                gap-2">
                <Plus className="w-4 h-4
                  text-primary"/>
                Nouveau réseau social
              </h3>
              <button
                onClick={() =>
                  setShowAddForm(false)}
                className="text-gray-500
                  hover:text-white">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Platform selector */}
              <div>
                <label className="text-xs
                  font-black text-gray-400
                  uppercase tracking-wide
                  block mb-2">
                  Plateforme
                </label>
                <div className="grid
                  grid-cols-5 gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setAddForm(prev => ({
                          ...prev,
                          platform: p.id,
                          label: p.name,
                        }))
                      }
                      className={`
                        flex flex-col
                        items-center gap-1.5
                        p-3 rounded-xl
                        border-2 transition-all
                        text-center
                        ${addForm.platform
                          === p.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 hover:border-gray-600'
                        }`}>
                      <span className="text-xl">
                        {p.icon}
                      </span>
                      <span className="text-[9px]
                        text-gray-400
                        font-bold leading-tight">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL input */}
              <div>
                <label className="text-xs
                  font-black text-gray-400
                  uppercase tracking-wide
                  block mb-2">
                  Lien URL *
                </label>
                <input
                  type="url"
                  value={addForm.url}
                  onChange={e =>
                    setAddForm(prev => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  placeholder={
                    PLATFORMS.find(
                      p => p.id ===
                        addForm.platform
                    )?.placeholder ||
                    'https://...'
                  }
                  className="w-full px-4 py-3
                    bg-gray-800
                    border border-gray-700
                    focus:border-primary
                    rounded-xl text-white
                    text-sm focus:outline-none
                    placeholder:text-gray-600"
                />
              </div>

              {/* Label input */}
              <div>
                <label className="text-xs
                  font-black text-gray-400
                  uppercase tracking-wide
                  block mb-2">
                  Nom affiché (optionnel)
                </label>
                <input
                  type="text"
                  value={addForm.label}
                  onChange={e =>
                    setAddForm(prev => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  placeholder={
                    PLATFORMS.find(
                      p => p.id ===
                        addForm.platform
                    )?.name || 'Nom...'
                  }
                  className="w-full px-4 py-3
                    bg-gray-800
                    border border-gray-700
                    focus:border-primary
                    rounded-xl text-white
                    text-sm focus:outline-none
                    placeholder:text-gray-600"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center
                justify-between
                bg-gray-800 rounded-xl p-4">
                <div>
                  <p className="text-sm
                    font-bold text-white">
                    Visible dans le footer
                  </p>
                  <p className="text-xs
                    text-gray-500">
                    Affiché immédiatement
                    sur le shop
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAddForm(prev => ({
                      ...prev,
                      is_active:
                        !prev.is_active,
                    }))
                  }
                  className={`
                    relative w-12 h-6
                    rounded-full
                    transition-all
                    ${addForm.is_active
                      ? 'bg-secondary'
                      : 'bg-gray-600'
                    }`}>
                  <span className={`
                    absolute top-0.5
                    w-5 h-5 bg-white
                    rounded-full shadow
                    transition-all
                    ${addForm.is_active
                      ? 'left-6'
                      : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={addLink}
                  disabled={
                    saving ||
                    !addForm.url.trim()
                  }
                  className="flex-1
                    flex items-center
                    justify-center gap-2
                    bg-primary
                    hover:bg-primary-dark
                    disabled:opacity-50
                    text-white font-black
                    py-3 rounded-xl
                    text-sm transition-colors">
                  {saving ? (
                    <div className="w-4 h-4
                      border-2
                      border-white/30
                      border-t-white
                      rounded-full
                      animate-spin"/>
                  ) : (
                    <Plus className="w-4 h-4"/>
                  )}
                  Ajouter au footer
                </button>
                <button
                  onClick={() =>
                    setShowAddForm(false)}
                  className="px-5 py-3
                    bg-gray-800
                    hover:bg-gray-700
                    text-gray-400 font-bold
                    rounded-xl text-sm
                    transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social links list */}
      <div className="space-y-3">
        {links.map((link, i) => {
          const platform = PLATFORMS.find(
            p => p.id === link.platform
          )
          const isEditing =
            editingId === link.id

          return (
            <motion.div
              key={link.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.04
              }}
              className={`
                bg-gray-900 rounded-2xl
                border transition-all
                overflow-hidden
                ${link.is_active
                  ? 'border-gray-800'
                  : 'border-gray-800/50 opacity-60'
                }`}>

              {/* Main row */}
              <div className="flex items-center
                gap-4 px-5 py-4">

                {/* Platform icon */}
                <div className={`
                  w-11 h-11 rounded-xl
                  flex items-center
                  justify-center
                  text-xl flex-shrink-0
                  ${link.is_active
                    ? 'bg-gray-800'
                    : 'bg-gray-800/50'
                  }`}>
                  {platform?.icon || '🔗'}
                </div>

                {/* Info */}
                <div className="flex-1
                  min-w-0">
                  <div className="flex
                    items-center gap-2">
                    <p className="font-bold
                      text-white text-sm">
                      {link.label}
                    </p>
                    {link.is_active && (
                      <span className="text-[10px]
                        bg-secondary/20
                        text-secondary
                        font-black px-2 py-0.5
                        rounded-full">
                        ● Visible
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs
                      text-gray-500
                      hover:text-primary
                      transition-colors
                      truncate block
                      max-w-[250px]">
                    {link.url}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex items-center
                  gap-2 flex-shrink-0">

                  {/* Toggle visible */}
                  <button
                    onClick={() =>
                      toggleActive(link)}
                    title={
                      link.is_active
                        ? 'Masquer du footer'
                        : 'Afficher dans le footer'
                    }
                    className={`
                      w-9 h-9 rounded-xl
                      flex items-center
                      justify-center
                      transition-all
                      ${link.is_active
                        ? 'bg-secondary/20 text-secondary hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-gray-800 text-gray-500 hover:bg-secondary/20 hover:text-secondary'
                      }`}>
                    {link.is_active
                      ? <Eye className="w-4 h-4"/>
                      : <EyeOff className="w-4 h-4"/>
                    }
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingId(null)
                      } else {
                        setEditingId(link.id)
                        setEditForm({
                          label: link.label,
                          url: link.url,
                        })
                      }
                    }}
                    className={`
                      w-9 h-9 rounded-xl
                      flex items-center
                      justify-center
                      transition-all
                      ${isEditing
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}>
                    <Edit3
                      className="w-4 h-4"/>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() =>
                      deleteLink(link.id)}
                    className="w-9 h-9
                      rounded-xl
                      bg-gray-800
                      hover:bg-red-500/20
                      text-gray-400
                      hover:text-red-400
                      flex items-center
                      justify-center
                      transition-all">
                    <Trash2
                      className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Edit panel */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{
                      height: 0, opacity: 0
                    }}
                    animate={{
                      height: 'auto',
                      opacity: 1
                    }}
                    exit={{
                      height: 0, opacity: 0
                    }}
                    className="border-t
                      border-gray-800
                      overflow-hidden">
                    <div className="p-5
                      space-y-3">

                      {/* Edit label */}
                      <div>
                        <label className="
                          text-xs font-bold
                          text-gray-500 block
                          mb-1.5">
                          Nom affiché
                        </label>
                        <input
                          type="text"
                          value={
                            editForm.label || ''
                          }
                          onChange={e =>
                            setEditForm(p => ({
                              ...p,
                              label: e.target.value,
                            }))
                          }
                          className="w-full
                            px-4 py-2.5
                            bg-gray-800
                            border border-gray-700
                            focus:border-primary
                            rounded-xl
                            text-white text-sm
                            focus:outline-none"
                        />
                      </div>

                      {/* Edit URL */}
                      <div>
                        <label className="
                          text-xs font-bold
                          text-gray-500 block
                          mb-1.5">
                          Lien URL
                        </label>
                        <input
                          type="url"
                          value={
                            editForm.url || ''
                          }
                          onChange={e =>
                            setEditForm(p => ({
                              ...p,
                              url: e.target.value,
                            }))
                          }
                          className="w-full
                            px-4 py-2.5
                            bg-gray-800
                            border border-gray-700
                            focus:border-primary
                            rounded-xl
                            text-white text-sm
                            focus:outline-none"
                        />
                      </div>

                      {/* Save / Cancel */}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            saveEdit(link.id)}
                          disabled={saving}
                          className="flex items-center
                            gap-2 bg-primary
                            hover:bg-primary-dark
                            text-white font-black
                            px-4 py-2.5
                            rounded-xl text-sm
                            transition-colors
                            disabled:opacity-50">
                          {saving ? (
                            <div className="w-4 h-4
                              border-2
                              border-white/30
                              border-t-white
                              rounded-full
                              animate-spin"/>
                          ) : (
                            <Save
                              className="w-4 h-4"/>
                          )}
                          Sauvegarder
                        </button>
                        <button
                          onClick={() =>
                            setEditingId(null)}
                          className="px-4 py-2.5
                            bg-gray-800
                            hover:bg-gray-700
                            text-gray-400
                            font-bold rounded-xl
                            text-sm
                            transition-colors">
                          Annuler
                        </button>
                        <a
                          href={
                            editForm.url ||
                            link.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto
                            w-9 h-9 flex items-center
                            justify-center
                            bg-gray-800
                            hover:bg-gray-700
                            text-gray-400
                            hover:text-white
                            rounded-xl
                            transition-colors">
                          <ExternalLink
                            className="w-4 h-4"/>
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Footer preview */}
      {activeCount > 0 && (
        <div className="bg-gray-900
          border border-gray-800
          rounded-2xl p-5">
          <p className="text-xs font-black
            text-gray-500 uppercase
            tracking-wide mb-4
            flex items-center gap-2">
            <Eye className="w-3.5 h-3.5"/>
            Aperçu footer
          </p>
          <div className="flex gap-4
            flex-wrap">
            {links
              .filter(l => l.is_active)
              .map(link => {
                const platform =
                  PLATFORMS.find(
                    p => p.id === link.platform
                  )
                return (
                  <div key={link.id}
                    className="flex items-center
                      gap-2 bg-gray-800
                      px-3 py-2 rounded-xl">
                    <span className="text-lg">
                      {platform?.icon || '🔗'}
                    </span>
                    <span className="text-xs
                      text-gray-300 font-bold">
                      {link.label}
                    </span>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect }
  from 'react'
import { motion, AnimatePresence }
  from 'framer-motion'
import {
  Save, Plus, X, Edit3,
  Trash2, Eye, EyeOff,
  Link as LinkIcon, Mail, Phone,
  FileText, Globe, Settings,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import RichTextEditor from '@/components/admin/RichTextEditor'

type Tab = 
  'contact' | 'links' | 
  'brand' | 'legal'

export default function FooterManagerPage() {

  const [activeTab, setActiveTab] =
    useState<Tab>('contact')
  const [footerData, setFooterData] =
    useState<Record<string, any>>({})
  const [legalPages, setLegalPages] =
    useState<any[]>([])
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] = 
    useState(false)
  const [editingPage, setEditingPage] =
    useState<any | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [footerRes, legalRes] =
      await Promise.all([
        fetch('/api/admin/footer'),
        fetch('/api/admin/legal-pages'),
      ])
    const [footerJson, legalJson] =
      await Promise.all([
        footerRes.json(),
        legalRes.json(),
      ])
    setFooterData(footerJson.data || {})
    setLegalPages(legalJson.data || [])
    setLoading(false)
  }

  async function saveFooter(
    key: string,
    value: any
  ) {
    setSaving(true)
    try {
      const res = await fetch(
        '/api/admin/footer',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key, value
          }),
        }
      )
      if (res.ok) {
        setFooterData(prev => ({
          ...prev, [key]: value
        }))
        toast.success('✅ Sauvegardé!')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function saveLegalPage(page: any) {
    setSaving(true)
    try {
      const isNew = !page.id
      const res = await fetch(
        '/api/admin/legal-pages',
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(page),
        }
      )
      const { data } = await res.json()
      if (isNew) {
        setLegalPages(prev => [...prev, data])
      } else {
        setLegalPages(prev =>
          prev.map(p =>
            p.id === data.id ? data : p
          )
        )
      }
      setEditingPage(null)
      toast.success('✅ Page sauvegardée!')
    } catch {
      toast.error('Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLegalPage(id: string) {
    if (!confirm(
      'Supprimer cette page légale?'
    )) return
    await fetch(
      '/api/admin/legal-pages',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id }),
      }
    )
    setLegalPages(prev =>
      prev.filter(p => p.id !== id)
    )
    toast.success('🗑️ Page supprimée')
  }

  const TABS = [
    {
      id: 'contact' as Tab,
      icon: Phone,
      label: 'Contact',
      color: 'text-green-400',
    },
    {
      id: 'links' as Tab,
      icon: LinkIcon,
      label: 'Liens',
      color: 'text-blue-400',
    },
    {
      id: 'brand' as Tab,
      icon: Globe,
      label: 'Marque',
      color: 'text-purple-400',
    },
    {
      id: 'legal' as Tab,
      icon: FileText,
      label: 'Pages Légales',
      color: 'text-orange-400',
    },
  ]

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
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl
          font-black text-white
          flex items-center gap-3">
          <Settings className="w-6 h-6
            text-primary"/>
          Footer & Pages Légales
        </h1>
        <p className="text-gray-500
          text-sm mt-0.5">
          Gérez toutes les sections
          du footer et vos pages légales
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2
        bg-gray-900 border border-gray-800
        rounded-2xl p-1.5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center
              justify-center gap-2
              px-3 py-2.5 rounded-xl
              text-sm font-bold
              transition-all
              ${activeTab === tab.id
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
              }`}>
            <tab.icon className={`w-4 h-4
              ${activeTab === tab.id
                ? tab.color
                : ''}`}
            />
            <span className="hidden
              sm:block">
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ══ TAB: CONTACT ══ */}
      {activeTab === 'contact' && (
        <ContactTab
          data={footerData.contact || {}}
          onSave={(v: any) =>
            saveFooter('contact', v)}
          saving={saving}
        />
      )}

      {/* ══ TAB: LINKS ══ */}
      {activeTab === 'links' && (
        <LinksTab
          boutiqueLinks={
            footerData.boutique_links || []
          }
          aideLinks={
            footerData.aide_links || []
          }
          onSaveBoutique={(v: any) =>
            saveFooter('boutique_links', v)}
          onSaveAide={(v: any) =>
            saveFooter('aide_links', v)}
          saving={saving}
        />
      )}

      {/* ══ TAB: BRAND ══ */}
      {activeTab === 'brand' && (
        <BrandTab
          data={footerData.brand || {}}
          onSave={(v: any) =>
            saveFooter('brand', v)}
          saving={saving}
        />
      )}

      {/* ══ TAB: LEGAL PAGES ══ */}
      {activeTab === 'legal' && (
        <div className="space-y-4">

          <div className="flex items-center
            justify-between">
            <p className="text-sm
              text-gray-400">
              {legalPages.filter(
                p => p.show_in_footer
              ).length} page(s) dans le footer
            </p>
            <button
              onClick={() => {
                setEditingPage({
                  slug: '',
                  title: '',
                  content: '',
                  is_active: true,
                  show_in_footer: true,
                  display_order:
                    legalPages.length + 1,
                })
              }}
              className="flex items-center
                gap-2 bg-primary
                hover:bg-primary-dark
                text-white font-black
                px-4 py-2.5 rounded-xl
                text-sm transition-colors">
              <Plus className="w-4 h-4"/>
              Nouvelle page
            </button>
          </div>

          {/* Legal pages list */}
          <div className="space-y-3">
            {legalPages.map((page, i) => (
              <LegalPageCard
                key={page.id || i}
                page={page}
                onEdit={() =>
                  setEditingPage(page)}
                onDelete={() =>
                  deleteLegalPage(page.id)}
                onToggle={async (field: string, val: boolean) => {
                  const updated = {
                    ...page,
                    [field]: val
                  }
                  await saveLegalPage(updated)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ LEGAL PAGE EDITOR MODAL ══ */}
      <AnimatePresence>
        {editingPage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setEditingPage(null)}
              className="fixed inset-0
                bg-black/60 z-50
                backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0,
                y: 50 }}
              animate={{ opacity: 1,
                y: 0 }}
              exit={{ opacity: 0,
                y: 50 }}
              className="fixed inset-4
                sm:inset-8 z-50
                bg-gray-900 rounded-3xl
                border border-gray-800
                overflow-hidden flex
                flex-col">

              {/* Modal header */}
              <div className="flex items-center
                justify-between px-6 py-4
                border-b border-gray-800
                flex-shrink-0">
                <h3 className="font-black
                  text-white text-lg
                  flex items-center gap-2">
                  <FileText className="w-5 h-5
                    text-orange-400"/>
                  {editingPage.id
                    ? `Modifier: ${editingPage.title}`
                    : 'Nouvelle page légale'
                  }
                </h3>
                <button
                  onClick={() =>
                    setEditingPage(null)}
                  className="w-9 h-9
                    bg-gray-800
                    hover:bg-gray-700
                    rounded-xl flex items-center
                    justify-center
                    text-gray-400">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1
                overflow-y-auto p-6
                space-y-5">

                {/* Title */}
                <div>
                  <label className="text-xs
                    font-black text-gray-400
                    uppercase tracking-wide
                    block mb-2">
                    Titre de la page *
                  </label>
                  <input
                    value={
                      editingPage.title || ''
                    }
                    onChange={e =>
                      setEditingPage(
                        (p: any) => ({
                          ...p,
                          title: e.target.value
                        })
                      )
                    }
                    placeholder="Ex: Conditions Générales de Vente"
                    className="w-full px-4 py-3
                      bg-gray-800
                      border border-gray-700
                      focus:border-primary
                      rounded-xl text-white
                      text-sm focus:outline-none"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-xs
                    font-black text-gray-400
                    uppercase tracking-wide
                    block mb-2">
                    URL (slug) *
                  </label>
                  <div className="flex items-center
                    gap-2 bg-gray-800
                    border border-gray-700
                    focus-within:border-primary
                    rounded-xl px-4 py-3">
                    <span className="text-gray-600
                      text-sm flex-shrink-0">
                      /legal/
                    </span>
                    <input
                      value={
                        editingPage.slug || ''
                      }
                      onChange={e =>
                        setEditingPage(
                          (p: any) => ({
                            ...p,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^a-z0-9-]/g, '')
                          })
                        )
                      }
                      placeholder="cgv"
                      className="flex-1
                        bg-transparent
                        text-white text-sm
                        focus:outline-none"
                    />
                    {editingPage.slug && (
                      <a
                        href={`/legal/${editingPage.slug}`}
                        target="_blank"
                        className="text-primary
                          hover:underline">
                        <ExternalLink
                          className="w-4 h-4"/>
                      </a>
                    )}
                  </div>
                </div>

                {/* Content editor */}
                <div className="flex-1">
                  <div className="flex items-center
                    justify-between mb-2">
                    <label className="text-xs
                      font-black text-gray-400
                      uppercase tracking-wide">
                      Contenu de la page
                    </label>
                    <span className="text-xs
                      text-gray-600">
                    </span>
                  </div>
                  <RichTextEditor
                    value={editingPage.content || ''}
                    onChange={(html) =>
                      setEditingPage((p: any) => ({
                        ...p,
                        content: html,
                      }))
                    }
                    placeholder="Commencez à écrire votre page légale..."
                    minHeight={380}
                  />
                </div>

                {/* Options */}
                <div className="grid
                  grid-cols-2 gap-3">
                  {[
                    {
                      key: 'is_active',
                      label: 'Page active',
                      desc: 'Accessible par les visiteurs',
                      icon: Eye,
                    },
                    {
                      key: 'show_in_footer',
                      label: 'Dans le footer',
                      desc: 'Lien visible en bas du site',
                      icon: Globe,
                    },
                  ].map(opt => (
                    <div key={opt.key}
                      className="bg-gray-800
                        rounded-2xl p-4
                        flex items-center
                        justify-between gap-3">
                      <div>
                        <p className="text-sm
                          font-bold text-white
                          flex items-center
                          gap-1.5">
                          <opt.icon
                            className="w-3.5 h-3.5
                              text-gray-400"/>
                          {opt.label}
                        </p>
                        <p className="text-[10px]
                          text-gray-500 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPage(
                            (p: any) => ({
                              ...p,
                              [opt.key]:
                                !p[opt.key]
                            })
                          )
                        }
                        className={`
                          relative w-11 h-6
                          rounded-full
                          transition-all
                          flex-shrink-0
                          ${(editingPage as any)[opt.key]
                            ? 'bg-secondary'
                            : 'bg-gray-600'
                          }`}>
                        <span className={`
                          absolute top-0.5
                          w-5 h-5 bg-white
                          rounded-full shadow
                          transition-all
                          ${(editingPage as any)[opt.key]
                            ? 'left-5'
                            : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4
                border-t border-gray-800
                flex gap-3 flex-shrink-0">
                <button
                  onClick={() =>
                    saveLegalPage(editingPage)}
                  disabled={
                    saving ||
                    !editingPage.title ||
                    !editingPage.slug
                  }
                  className="flex items-center
                    gap-2 bg-primary
                    hover:bg-primary-dark
                    disabled:opacity-50
                    text-white font-black
                    px-6 py-3 rounded-xl
                    text-sm transition-colors">
                  {saving ? (
                    <div className="w-4 h-4
                      border-2
                      border-white/30
                      border-t-white
                      rounded-full
                      animate-spin"/>
                  ) : (
                    <Save className="w-4 h-4"/>
                  )}
                  Sauvegarder la page
                </button>
                <button
                  onClick={() =>
                    setEditingPage(null)}
                  className="px-5 py-3
                    bg-gray-800
                    hover:bg-gray-700
                    text-gray-400 font-bold
                    rounded-xl text-sm
                    transition-colors">
                  Annuler
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ────────────────────

function ContactTab({ data, onSave, saving }: any) {
  const [form, setForm] = useState(data)
  useEffect(() => { setForm(data) }, [data])

  return (
    <div className="bg-gray-900
      border border-gray-800
      rounded-2xl p-5 space-y-4">
      {[
        { key: 'email', label: 'Email support',
          icon: Mail, placeholder: 'support@...' },
        { key: 'phone', label: 'Téléphone',
          icon: Phone, placeholder: '+1 514...' },
        { key: 'whatsapp', label: 'WhatsApp',
          icon: Phone, placeholder: 'https://wa.me/...' },
        { key: 'address', label: 'Adresse',
          icon: Globe, placeholder: 'Ville, Pays' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-xs font-black
            text-gray-400 uppercase tracking-wide
            block mb-2 flex items-center gap-1.5">
            <f.icon className="w-3.5 h-3.5"/>
            {f.label}
          </label>
          <input
            value={form[f.key] || ''}
            onChange={e => setForm(
              (p: any) => ({
                ...p, [f.key]: e.target.value
              })
            )}
            placeholder={f.placeholder}
            className="w-full px-4 py-3
              bg-gray-800 border border-gray-700
              focus:border-primary rounded-xl
              text-white text-sm
              focus:outline-none"
          />
        </div>
      ))}
      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="flex items-center gap-2
          bg-primary hover:bg-primary-dark
          text-white font-black px-5 py-3
          rounded-xl text-sm transition-colors
          disabled:opacity-50">
        <Save className="w-4 h-4"/>
        Sauvegarder
      </button>
    </div>
  )
}

function BrandTab({ data, onSave, saving }: any) {
  const [form, setForm] = useState(data)
  useEffect(() => { setForm(data) }, [data])

  return (
    <div className="bg-gray-900
      border border-gray-800
      rounded-2xl p-5 space-y-4">
      {[
        { key: 'name', label: 'Nom du shop', placeholder: 'Missa Shop' },
        { key: 'tagline', label: 'Slogan', placeholder: 'Mode & Lifestyle Premium' },
        { key: 'description', label: 'Description footer', placeholder: 'Votre boutique...' },
        { key: 'copyright', label: 'Copyright', placeholder: '© 2025 Missa Shop...' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-xs font-black
            text-gray-400 uppercase tracking-wide
            block mb-2">{f.label}</label>
          {f.key === 'description' ? (
            <textarea
              value={form[f.key] || ''}
              onChange={e => setForm(
                (p: any) => ({
                  ...p, [f.key]: e.target.value
                })
              )}
              rows={3}
              placeholder={f.placeholder}
              className="w-full px-4 py-3
                bg-gray-800 border border-gray-700
                focus:border-primary rounded-xl
                text-white text-sm focus:outline-none
                resize-none"
            />
          ) : (
            <input
              value={form[f.key] || ''}
              onChange={e => setForm(
                (p: any) => ({
                  ...p, [f.key]: e.target.value
                })
              )}
              placeholder={f.placeholder}
              className="w-full px-4 py-3
                bg-gray-800 border border-gray-700
                focus:border-primary rounded-xl
                text-white text-sm focus:outline-none"
            />
          )}
        </div>
      ))}
      <button
        onClick={() => onSave(form)}
        disabled={saving}
        className="flex items-center gap-2
          bg-primary hover:bg-primary-dark
          text-white font-black px-5 py-3
          rounded-xl text-sm transition-colors
          disabled:opacity-50">
        <Save className="w-4 h-4"/>
        Sauvegarder
      </button>
    </div>
  )
}

function LinksTab({
  boutiqueLinks, aideLinks,
  onSaveBoutique, onSaveAide, saving
}: any) {
  const [boutique, setBoutique] = useState(boutiqueLinks)
  const [aide, setAide] = useState(aideLinks)

  useEffect(() => { setBoutique(boutiqueLinks) }, [boutiqueLinks])
  useEffect(() => { setAide(aideLinks) }, [aideLinks])

  function LinkList({ links, setLinks, onSave, title }: any) {
    return (
      <div className="bg-gray-900
        border border-gray-800
        rounded-2xl overflow-hidden">
        <div className="px-5 py-4
          border-b border-gray-800
          flex items-center justify-between">
          <h3 className="font-black text-white
            text-sm">{title}</h3>
          <button
            onClick={() => setLinks(
              (p: any) => [
                ...p,
                { label: 'Nouveau lien', href: '/' }
              ]
            )}
            className="flex items-center gap-1
              text-xs text-primary font-bold
              hover:underline">
            <Plus className="w-3 h-3"/>
            Ajouter
          </button>
        </div>
        <div className="divide-y divide-gray-800">
          {(links || []).map((link: any, i: number) => (
            <div key={i}
              className="flex items-center
                gap-3 px-5 py-3">
              <input
                value={link.label}
                onChange={e => {
                  const n = [...links]
                  n[i] = {
                    ...n[i],
                    label: e.target.value
                  }
                  setLinks(n)
                }}
                className="flex-1 bg-gray-800
                  border border-gray-700
                  focus:border-primary px-3 py-2
                  rounded-xl text-white text-xs
                  focus:outline-none"
                placeholder="Label"
              />
              <input
                value={link.href}
                onChange={e => {
                  const n = [...links]
                  n[i] = {
                    ...n[i],
                    href: e.target.value
                  }
                  setLinks(n)
                }}
                className="flex-1 bg-gray-800
                  border border-gray-700
                  focus:border-primary px-3 py-2
                  rounded-xl text-white text-xs
                  focus:outline-none"
                placeholder="/url"
              />
              <button
                onClick={() =>
                  setLinks((p: any) =>
                    p.filter((_: any, j: number) =>
                      j !== i
                    )
                  )
                }
                className="text-gray-600
                  hover:text-red-400
                  transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-3
          border-t border-gray-800">
          <button
            onClick={() => onSave(links)}
            disabled={saving}
            className="flex items-center gap-2
              bg-primary text-white font-black
              px-4 py-2 rounded-xl text-xs
              hover:bg-primary-dark
              transition-colors
              disabled:opacity-50">
            <Save className="w-3.5 h-3.5"/>
            Sauvegarder
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LinkList
        links={boutique}
        setLinks={setBoutique}
        onSave={onSaveBoutique}
        title="Section Boutique"
      />
      <LinkList
        links={aide}
        setLinks={setAide}
        onSave={onSaveAide}
        title="Section Aide"
      />
    </div>
  )
}

function LegalPageCard({
  page, onEdit, onDelete, onToggle
}: any) {
  return (
    <div className="bg-gray-900
      border border-gray-800
      rounded-2xl overflow-hidden">
      <div className="flex items-center
        gap-4 px-5 py-4">
        <div className="w-10 h-10
          bg-orange-500/10 rounded-xl
          flex items-center justify-center
          flex-shrink-0">
          <FileText className="w-5 h-5
            text-orange-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white
            text-sm">{page.title}</p>
          <p className="text-xs text-gray-500">
            /legal/{page.slug}
            {' · '}
            {page.show_in_footer
              ? '✅ Dans le footer'
              : '🔒 Masquée du footer'
            }
          </p>
        </div>
        <div className="flex items-center
          gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(
              'show_in_footer',
              !page.show_in_footer
            )}
            title={
              page.show_in_footer
                ? 'Masquer du footer'
                : 'Afficher dans le footer'
            }
            className={`w-9 h-9 rounded-xl
              flex items-center justify-center
              transition-all
              ${page.show_in_footer
                ? 'bg-secondary/20 text-secondary'
                : 'bg-gray-800 text-gray-500'
              }`}>
            {page.show_in_footer
              ? <Eye className="w-4 h-4"/>
              : <EyeOff className="w-4 h-4"/>
            }
          </button>
          <button
            onClick={onEdit}
            className="w-9 h-9 rounded-xl
              bg-gray-800 hover:bg-gray-700
              text-gray-400 hover:text-white
              flex items-center justify-center
              transition-all">
            <Edit3 className="w-4 h-4"/>
          </button>
          <a
            href={`/legal/${page.slug}`}
            target="_blank"
            className="w-9 h-9 rounded-xl
              bg-gray-800 hover:bg-gray-700
              text-gray-400 hover:text-white
              flex items-center justify-center
              transition-all">
            <ExternalLink className="w-4 h-4"/>
          </a>
          <button
            onClick={onDelete}
            className="w-9 h-9 rounded-xl
              bg-gray-800 hover:bg-red-500/20
              text-gray-400 hover:text-red-400
              flex items-center justify-center
              transition-all">
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>
  )
}

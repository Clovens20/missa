'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  MessageSquare, Send, ChevronDown,
  ChevronUp, Copy, Check, 
  AlertCircle, RefreshCw,
  FileText, Globe, Sparkles,
  Info, BookTemplate, Plus,
  Trash2, Eye, X
} from 'lucide-react'
import { toast } from 'sonner'

interface SupplierMessagePanelProps {
  cjProductId?: string
  cjOrderId?: string
  productName?: string
  // compact = small inline version
  // full = full panel
  mode?: 'compact' | 'full'
  onMessageSent?: () => void
}

export default function SupplierMessagePanel({
  cjProductId,
  cjOrderId,
  productName,
  mode = 'full',
  onMessageSent,
}: SupplierMessagePanelProps) {
  const [templates, setTemplates] = 
    useState<any[]>([])
  const [sentMessages, setSentMessages] = 
    useState<any[]>([])
  const [activeSection, setActiveSection] = 
    useState<'compose' | 'history' | 'templates'>('compose')
  
  // Compose state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showTemplates, setShowTemplates] = 
    useState(false)
  const [selectedLang, setSelectedLang] = 
    useState<'en' | 'fr'>('en')

  useEffect(() => {
    loadTemplates()
    if (cjProductId || cjOrderId) {
      loadHistory()
    }
  }, [cjProductId, cjOrderId])

  useEffect(() => {
    // Auto-load default template
    loadDefaultTemplate()
  }, [templates, selectedLang])

  async function loadTemplates() {
    const { data } = await supabase
      .from('dropship_templates')
      .select('*')
      .order('is_default', 
        { ascending: false })
    setTemplates(data || [])
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('supplier_messages')
      .select('*')
      .eq('cj_product_id', 
        cjProductId || '')
      .order('created_at', 
        { ascending: false })
      .limit(5)
    setSentMessages(data || [])
  }

  function loadDefaultTemplate() {
    const defaultTemplate = templates.find(
      t => t.is_default && 
        t.language === selectedLang
    ) || templates.find(
      t => t.is_default
    )
    
    if (defaultTemplate) {
      setSubject(defaultTemplate.subject)
      setMessage(defaultTemplate.content)
    }
  }

  function applyTemplate(template: any) {
    setSubject(template.subject)
    setMessage(template.content)
    setShowTemplates(false)
    toast.success('Template appliqué!')
  }

  function copyMessage() {
    navigator.clipboard.writeText(
      `Subject: ${subject}

${message}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(
      '📋 Message copié! ' +
      'Collez-le dans CJ Dashboard.'
    )
  }

  async function sendMessage() {
    if (!subject.trim() || !message.trim()) {
      toast.error(
        'Sujet et message requis'
      )
      return
    }
    setSending(true)
    try {
      const res = await fetch(
        '/api/cj/message',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            cjProductId,
            cjOrderId,
            subject,
            message,
            type: 'dropship_instruction',
          }),
        }
      )
      const data = await res.json()
      
      if (data.error) throw new Error(
        data.error
      )
      
      setSent(true)
      loadHistory()
      onMessageSent?.()
      
      toast.success(
        '✅ Instructions enregistrées!'
      )
      
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  // ── COMPACT MODE ──────────────────
  if (mode === 'compact') {
    return (
      <div className="bg-gray-800 
        border border-gray-700 
        rounded-2xl overflow-hidden">
        
        <button
          onClick={() => 
            setActiveSection(
              activeSection === 'compose' 
                ? 'history' 
                : 'compose'
            )}
          className="w-full flex items-center 
            justify-between px-4 py-3 
            hover:bg-gray-700 
            transition-colors">
          <div className="flex items-center 
            gap-2">
            <MessageSquare className="w-4 h-4 
              text-blue-400"/>
            <span className="text-sm 
              font-bold text-white">
              Message fournisseur CJ
            </span>
            {sentMessages.length > 0 && (
              <span className="bg-secondary 
                text-white text-[10px] 
                font-black px-1.5 
                rounded-full">
                {sentMessages.length}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 
            text-gray-400 transition-transform
            ${activeSection === 'compose' 
              ? 'rotate-180' : ''}`}/>
        </button>

        <AnimatePresence>
          {activeSection === 'compose' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 
                border-t border-gray-700 
                space-y-3">
                <MiniMessageForm
                  subject={subject}
                  message={message}
                  onSubjectChange={setSubject}
                  onMessageChange={setMessage}
                  onSend={sendMessage}
                  onCopy={copyMessage}
                  sending={sending}
                  sent={sent}
                  copied={copied}
                  templates={templates}
                  onApplyTemplate={
                    applyTemplate
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── FULL MODE ─────────────────────
  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center 
        justify-between">
        <div className="flex items-center 
          gap-3">
          <div className="w-10 h-10 
            bg-blue-500/20 rounded-xl 
            flex items-center justify-center">
            <MessageSquare className="w-5 h-5 
              text-blue-400"/>
          </div>
          <div>
            <h3 className="font-black 
              text-white">
              Instructions au Fournisseur
            </h3>
            <p className="text-gray-500 
              text-xs">
              Envoyer les instructions 
              dropshipping à CJ
            </p>
          </div>
        </div>

        {/* Language toggle */}
        <div className="flex gap-1 
          bg-gray-800 rounded-xl p-1">
          {(['en', 'fr'] as const).map(
            lang => (
            <button
              key={lang}
              onClick={() => {
                setSelectedLang(lang)
                // Load template for this lang
                const t = templates.find(
                  x => x.is_default && 
                    x.language === lang
                )
                if (t) {
                  setSubject(t.subject)
                  setMessage(t.content)
                }
              }}
              className={`px-3 py-1.5 
                rounded-lg text-xs font-bold 
                transition-all
                ${selectedLang === lang
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
                }`}>
              {lang === 'en' ? '🇺🇸 EN' : '🇫🇷 FR'}
            </button>
          ))}
        </div>
      </div>

      {/* Important notice */}
      <div className="bg-yellow-500/10 
        border border-yellow-500/30 
        rounded-2xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 
          text-yellow-400 flex-shrink-0 
          mt-0.5"/>
        <div className="text-sm">
          <p className="text-yellow-400 
            font-bold mb-1">
            Pourquoi c'est important?
          </p>
          <ul className="text-gray-300 
            space-y-1 text-xs">
            <li>
              ✗ Sans instruction: CJ peut 
              inclure leur facture avec 
              les vrais prix
            </li>
            <li>
              ✗ Le client voit que vous 
              achetez à $8 et vendez à $25
            </li>
            <li>
              ✓ Avec instruction: package 
              neutre, client ne sait rien
            </li>
            <li>
              ✓ Expérience professionnelle 
              pour vos clients
            </li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 
        border-b border-gray-800">
        {[
          ['compose', '✏️ Composer'],
          ['history', 
            `📋 Historique (${sentMessages.length})`],
          ['templates', 
            `📁 Templates (${templates.length})`],
        ].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => 
              setActiveSection(
                tab as typeof activeSection
              )}
            className={`px-4 py-2.5 
              text-sm font-bold 
              border-b-2 -mb-px 
              transition-all
              ${activeSection === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ── */}
      {activeSection === 'compose' && (
        <div className="space-y-4">
          
          {/* Template selector */}
          <div className="flex items-center 
            justify-between">
            <p className="text-sm text-gray-400">
              Template actif:{' '}
              <span className="text-white 
                font-semibold">
                {templates.find(
                  t => t.is_default && 
                    t.language === selectedLang
                )?.name || 'Personnalisé'}
              </span>
            </p>
            <button
              onClick={() => 
                loadDefaultTemplate()}
              className="flex items-center 
                gap-1.5 text-xs 
                text-gray-500 
                hover:text-white 
                transition-colors">
              <RefreshCw className="w-3 h-3"/>
              Réinitialiser
            </button>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs 
              font-black text-gray-400 
              uppercase tracking-wide mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => 
                setSubject(e.target.value)}
              className="w-full px-4 py-3 
                bg-gray-800 border 
                border-gray-700 rounded-xl 
                text-white text-sm 
                focus:border-primary 
                focus:outline-none"
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center 
              justify-between mb-2">
              <label className="text-xs 
                font-black text-gray-400 
                uppercase tracking-wide">
                Message au fournisseur
              </label>
              <span className="text-xs 
                text-gray-600">
                {message.length} caractères
              </span>
            </div>
            <textarea
              value={message}
              onChange={e => 
                setMessage(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 
                bg-gray-800 border 
                border-gray-700 rounded-xl 
                text-white text-sm 
                focus:border-primary 
                focus:outline-none 
                resize-y font-mono 
                leading-relaxed"
            />
          </div>

          {/* Key instructions preview */}
          <div className="bg-gray-800 
            rounded-2xl p-4">
            <p className="text-xs font-black 
              text-gray-400 uppercase 
              tracking-wide mb-3">
              Ce que vous demandez à CJ:
            </p>
            <div className="grid 
              grid-cols-2 gap-2">
              {[
                { icon: '✗', text: 'Facture/Invoice', color: 'text-red-400' },
                { icon: '✗', text: 'Branding CJ', color: 'text-red-400' },
                { icon: '✗', text: 'Prix visible', color: 'text-red-400' },
                { icon: '✗', text: 'Catalogues', color: 'text-red-400' },
                { icon: '✓', text: 'Emballage neutre', color: 'text-secondary' },
                { icon: '✓', text: 'Blind shipping', color: 'text-secondary' },
              ].map((item, i) => (
                <div key={i}
                  className="flex items-center 
                    gap-2 text-xs">
                  <span className={`font-black 
                    ${item.color}`}>
                    {item.icon}
                  </span>
                  <span className="text-gray-400">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            
            {/* Copy button */}
            <button
              onClick={copyMessage}
              className="flex items-center 
                gap-2 px-5 py-3 
                bg-gray-800 
                hover:bg-gray-700 
                text-gray-300 
                hover:text-white 
                font-bold rounded-xl 
                text-sm transition-all 
                border border-gray-700">
              {copied 
                ? <Check className="w-4 h-4 
                    text-secondary"/> 
                : <Copy className="w-4 h-4"/>}
              {copied 
                ? 'Copié!' 
                : 'Copier le message'}
            </button>

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={sending || 
                !subject || !message}
              className="flex-1 flex 
                items-center justify-center 
                gap-2 bg-blue-600 
                hover:bg-blue-500 
                text-white font-black py-3 
                rounded-xl text-sm 
                transition-all 
                shadow-lg shadow-blue-500/25 
                disabled:opacity-50">
              {sending ? (
                <div className="w-4 h-4 
                  border-2 border-white/30 
                  border-t-white rounded-full 
                  animate-spin"/>
              ) : sent ? (
                <>
                  <Check className="w-4 h-4"/>
                  Instructions enregistrées!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4"/>
                  Envoyer les instructions
                </>
              )}
            </button>
          </div>

          {/* CJ Dashboard tip */}
          <div className="bg-blue-500/10 
            border border-blue-500/30 
            rounded-xl p-4 
            flex gap-3">
            <Info className="w-4 h-4 
              text-blue-400 flex-shrink-0 
              mt-0.5"/>
            <div className="text-xs 
              text-blue-300">
              <p className="font-bold mb-1">
                💡 Méthodes d'envoi:
              </p>
              <p className="mb-1">
                <strong>1. Via API:</strong>
                {' '}Cliquez "Envoyer" 
                — les instructions seront 
                jointes automatiquement 
                à chaque commande.
              </p>
              <p className="mb-1">
                <strong>2. Via Dashboard CJ:
                </strong>
                {' '}Copiez le message et 
                collez-le dans:
                <br/>
                CJ Dashboard → Messages 
                → Supplier → New Message
              </p>
              <p>
                <strong>3. Sur chaque commande:
                </strong>
                {' '}Le champ "Remark" 
                de chaque commande CJ 
                inclura automatiquement 
                "NO INVOICE - NO BRANDING".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeSection === 'history' && (
        <div className="space-y-3">
          {sentMessages.length === 0 ? (
            <div className="text-center py-12 
              bg-gray-800 rounded-2xl">
              <MessageSquare className="w-10 h-10 
                text-gray-600 mx-auto mb-3"/>
              <p className="text-gray-400 
                text-sm">
                Aucun message envoyé
              </p>
              <button
                onClick={() => 
                  setActiveSection('compose')}
                className="text-primary 
                  hover:underline text-sm 
                  mt-2 block mx-auto">
                Composer un message →
              </button>
            </div>
          ) : (
            sentMessages.map(msg => (
              <div key={msg.id}
                className="bg-gray-800 
                  border border-gray-700 
                  rounded-2xl p-4">
                <div className="flex items-start 
                  justify-between mb-2">
                  <p className="font-bold 
                    text-white text-sm">
                    {msg.subject}
                  </p>
                  <span className={`text-xs 
                    px-2.5 py-1 rounded-full 
                    font-bold flex-shrink-0 ml-2
                    ${msg.status === 'sent'
                      ? 'bg-secondary/20 text-secondary'
                      : msg.status === 'draft'
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {msg.status === 'sent' 
                      ? '✅ Envoyé'
                      : msg.status === 'draft'
                        ? '📝 Brouillon'
                        : msg.status}
                  </span>
                </div>
                <p className="text-gray-500 
                  text-xs line-clamp-2 mb-2">
                  {msg.message}
                </p>
                <p className="text-gray-600 
                  text-xs">
                  {new Date(msg.created_at)
                    .toLocaleString('fr-CA')}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeSection === 'templates' && (
        <div className="space-y-3">
          {templates.map(template => (
            <div key={template.id}
              className="bg-gray-800 
                border border-gray-700 
                rounded-2xl p-5 
                hover:border-primary/40 
                transition-all group">
              <div className="flex items-start 
                justify-between mb-3">
                <div>
                  <div className="flex items-center 
                    gap-2">
                    <h4 className="font-bold 
                      text-white">
                      {template.name}
                    </h4>
                    {template.is_default && (
                      <span className="bg-primary/20 
                        text-primary text-[10px] 
                        font-black px-2 py-0.5 
                        rounded-full">
                        DEFAULT
                      </span>
                    )}
                    <span className="bg-gray-700 
                      text-gray-400 text-[10px] 
                      font-bold px-2 py-0.5 
                      rounded-full uppercase">
                      {template.language}
                    </span>
                  </div>
                  <p className="text-gray-500 
                    text-xs mt-1">
                    {template.subject}
                  </p>
                </div>
                <button
                  onClick={() => 
                    applyTemplate(template)}
                  className="flex items-center 
                    gap-1.5 bg-primary/20 
                    hover:bg-primary/30 
                    text-primary font-bold 
                    px-4 py-2 rounded-xl 
                    text-xs transition-colors 
                    flex-shrink-0">
                  Utiliser →
                </button>
              </div>
              <p className="text-gray-500 
                text-xs line-clamp-3 
                font-mono bg-gray-900 
                p-3 rounded-xl">
                {template.content
                  .substring(0, 200)}...
              </p>
            </div>
          ))}
          
          {/* Info */}
          <div className="bg-gray-800 
            border border-gray-700 
            rounded-2xl p-4 text-sm 
            text-gray-500 text-center">
            <p>
              💡 Vous pouvez modifier 
              les templates directement 
              dans Supabase 
              → Table{' '}
              <code className="text-primary 
                font-mono text-xs">
                dropship_templates
              </code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mini form for compact mode ──
function MiniMessageForm({
  subject, message,
  onSubjectChange, onMessageChange,
  onSend, onCopy,
  sending, sent, copied,
  templates, onApplyTemplate,
}: any) {
  return (
    <div className="space-y-3">
      
      {/* Quick template buttons */}
      <div className="flex gap-2 
        overflow-x-auto scrollbar-hide">
        {templates.slice(0, 3).map(
          (t: any) => (
          <button
            key={t.id}
            onClick={() => 
              onApplyTemplate(t)}
            className="flex-shrink-0 
              text-xs bg-gray-700 
              hover:bg-gray-600 
              text-gray-300 px-3 py-1.5 
              rounded-lg font-medium 
              transition-colors">
            📋 {t.name.substring(0, 20)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={subject}
        onChange={e => 
          onSubjectChange(e.target.value)}
        placeholder="Sujet..."
        className="w-full px-3 py-2 
          bg-gray-700 border border-gray-600 
          rounded-xl text-white text-xs 
          focus:border-primary 
          focus:outline-none"
      />
      <textarea
        value={message}
        onChange={e => 
          onMessageChange(e.target.value)}
        rows={5}
        placeholder="Message au fournisseur..."
        className="w-full px-3 py-2 
          bg-gray-700 border border-gray-600 
          rounded-xl text-white text-xs 
          focus:border-primary 
          focus:outline-none resize-none 
          font-mono"
      />
      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex-1 flex items-center 
            justify-center gap-1.5 
            bg-gray-700 hover:bg-gray-600 
            text-gray-300 py-2 rounded-xl 
            text-xs font-bold 
            transition-colors">
          {copied 
            ? <Check className="w-3 h-3 
                text-secondary"/> 
            : <Copy className="w-3 h-3"/>}
          {copied ? 'Copié!' : 'Copier'}
        </button>
        <button
          onClick={onSend}
          disabled={sending}
          className="flex-1 flex items-center 
            justify-center gap-1.5 
            bg-blue-600 hover:bg-blue-500 
            text-white py-2 rounded-xl 
            text-xs font-black 
            transition-colors 
            disabled:opacity-50">
          {sending 
            ? <div className="w-3 h-3 
                border border-white/30 
                border-t-white rounded-full 
                animate-spin"/> 
            : sent 
              ? <Check className="w-3 h-3"/> 
              : <Send className="w-3 h-3"/>}
          {sent ? 'Envoyé!' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Search, Trash2, CheckCircle, 
  Clock, User, MessageSquare, RefreshCw,
  ChevronRight, Filter, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    setLoading(true)
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    if (error) {
      toast.error('Erreur lors du chargement des messages')
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de la mise à jour')
    } else {
      setMessages(messages.map(m => m.id === id ? { ...m, status: 'read' } : m))
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: 'read' })
      }
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm('Supprimer ce message définitivement ?')) return

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de la suppression')
    } else {
      toast.success('Message supprimé')
      setMessages(messages.filter(m => m.id !== id))
      if (selectedMessage?.id === id) setSelectedMessage(null)
    }
  }

  const filteredMessages = messages.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = messages.filter(m => m.status === 'new').length

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary"/>
            Messages Contact
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs px-2.5 py-1 rounded-full font-black animate-pulse">
                {unreadCount} NOUVEAU(X)
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les demandes envoyées via le formulaire de contact.</p>
        </div>
        <button 
          onClick={loadMessages}
          className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-2xl transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Messages List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          {/* Filters */}
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
              <input 
                type="text" 
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none cursor-pointer"
            >
              <option value="all">Tous les messages</option>
              <option value="new">Nouveaux uniquement</option>
              <option value="read">Lus uniquement</option>
            </select>
          </div>

          {/* List */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pr-2 scrollbar-custom">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-24 bg-gray-900/50 rounded-2xl animate-pulse"/>)
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-3xl border border-gray-800 border-dashed">
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3"/>
                <p className="text-gray-500 text-sm">Aucun message trouvé</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg)
                    if (msg.status === 'new') markAsRead(msg.id)
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${
                    selectedMessage?.id === msg.id 
                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                    : msg.status === 'new' 
                      ? 'bg-gray-800 border-gray-700 hover:border-primary/50' 
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {msg.status === 'new' && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-ping"/>
                  )}
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {msg.name?.[0] || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${msg.status === 'new' ? 'text-white' : 'text-gray-400'}`}>
                        {msg.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{msg.email}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-bold truncate mb-1 ${msg.status === 'new' ? 'text-white' : 'text-gray-400'}`}>
                    {msg.subject || 'Pas d\'objet'}
                  </p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3"/>
                    {format(new Date(msg.created_at), 'dd MMM, HH:mm', { locale: fr })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-gray-900 rounded-[32px] border border-gray-800 overflow-hidden flex flex-col h-full sticky top-6">
              
              {/* Message Header */}
              <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                      {selectedMessage.name?.[0] || 'A'}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">{selectedMessage.name}</h2>
                      <p className="text-primary font-bold text-sm">{selectedMessage.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Reçu le</p>
                    <p className="text-xs text-white font-bold">{format(new Date(selectedMessage.created_at), 'PPP p', { locale: fr })}</p>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Statut</p>
                    <div className="flex items-center gap-1.5">
                      {selectedMessage.status === 'new' ? (
                        <><Clock className="w-3.5 h-3.5 text-primary"/><span className="text-xs text-primary font-bold uppercase tracking-wide">Nouveau</span></>
                      ) : (
                        <><CheckCircle className="w-3.5 h-3.5 text-secondary"/><span className="text-xs text-secondary font-bold uppercase tracking-wide">Lu</span></>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 bg-gray-950 p-3 rounded-2xl border border-gray-800">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Objet</p>
                    <p className="text-xs text-white font-bold truncate">{selectedMessage.subject || '(Sans objet)'}</p>
                  </div>
                </div>
              </div>

              {/* Message Content Body */}
              <div className="p-8 flex-1 bg-gray-950/30">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-[1px] flex-1 bg-gray-800"></div>
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Message</span>
                  <div className="h-[1px] flex-1 bg-gray-800"></div>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base font-medium italic">
                    "{selectedMessage.message}"
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-gray-900 border-t border-gray-800">
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Votre message Missa Shop'}`}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Mail className="w-5 h-5"/>
                  Répondre par Email
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 rounded-[40px] border border-gray-800 border-dashed h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <Eye className="w-10 h-10 text-gray-700"/>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun message sélectionné</h3>
              <p className="text-gray-500 max-w-sm">Sélectionnez un message dans la liste de gauche pour voir son contenu et y répondre.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

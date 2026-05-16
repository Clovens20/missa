'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Activity, User, Clock, 
  ExternalLink, Search, Filter,
  ShieldCheck, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      setLogs(data || [])
      setLoading(false)
    }
    loadLogs()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary"/>
            Journal d'Activité
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des actions effectuées par les administrateurs</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
            <input type="text" placeholder="Rechercher une action ou un email..." className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-primary"/>
          </div>
          <button className="flex items-center gap-2 bg-gray-800 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold hover:text-white transition-colors">
            <Filter className="w-4 h-4"/> Filtrer
          </button>
        </div>

        <div className="divide-y divide-gray-800">
          {loading ? (
            Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-900 animate-pulse"/>)
          ) : logs.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-gray-800 mx-auto"/>
              <p className="text-gray-500 italic">Aucun log d'activité pour le moment</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-800/50 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{log.admin_email || 'Système'}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{log.action}</span>
                  </div>
                  <p className="text-gray-500 text-xs truncate mt-0.5">
                    {log.entity_type} {log.entity_id && `#${log.entity_id}`} — {JSON.stringify(log.details || {})}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-mono text-[10px]">{format(new Date(log.created_at), 'HH:mm', { locale: fr })}</p>
                  <p className="text-gray-600 text-[10px]">{format(new Date(log.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-gray-800/30 text-center">
          <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Charger plus d'activité</button>
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-4 items-center">
        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0"/>
        <p className="text-orange-400 text-xs leading-relaxed">
          <strong>Note de sécurité :</strong> Les logs d'activité sont conservés pendant 90 jours. Seuls les Super-Admins peuvent consulter l'intégralité du journal.
        </p>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Globe, Send, CheckCircle, ExternalLink, Loader, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CJOrderButtonProps {
  orderId: string
  orderItems: any[]
}

export default function CJOrderButton({ orderId, orderItems }: CJOrderButtonProps) {
  const [dropshipOrder, setDropshipOrder] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasDropshipItems, setHasDropshipItems] = useState(false)

  useEffect(() => {
    checkDropshipItems()
    loadExistingDropshipOrder()
  }, [orderId, orderItems])

  async function checkDropshipItems() {
    // Check if any items are dropship
    const productIds = orderItems.map(i => i.product_id)
    const { data } = await supabase.from('dropship_products').select('id').in('id', productIds)
    setHasDropshipItems((data?.length || 0) > 0)
  }

  async function loadExistingDropshipOrder() {
    const { data } = await supabase.from('dropship_orders').select('*').eq('guest_order_id', orderId).single()
    if (data) setDropshipOrder(data)
  }

  async function submitToCJ() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/cj/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('✅ Commande envoyée à CJ!')
      loadExistingDropshipOrder()
    } catch (err: any) {
      toast.error('Erreur CJ: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasDropshipItems) return null

  return (
    <div className={`bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5`}>
      <h3 className="font-black text-white flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-400"/>
        Traitement CJDropshipping
      </h3>

      {dropshipOrder ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${dropshipOrder.status === 'shipped' ? 'bg-secondary/20 text-secondary' : dropshipOrder.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {dropshipOrder.status === 'pending' ? '⏳ En attente' : dropshipOrder.status === 'submitted' ? '📤 Soumis à CJ' : dropshipOrder.status === 'processing' ? '📦 CJ prépare' : dropshipOrder.status === 'shipped' ? '🚚 Expédié par CJ' : dropshipOrder.status === 'delivered' ? '✅ Livré' : dropshipOrder.status === 'failed' ? '❌ Échec CJ' : dropshipOrder.status}
            </div>
            {dropshipOrder.cj_order_number && <span className="text-gray-400 text-xs font-mono">CJ# {dropshipOrder.cj_order_number}</span>}
          </div>

          {dropshipOrder.tracking_number && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Tracking:</span>
              <a href={dropshipOrder.tracking_url || `https://t.17track.net/en#nums=${dropshipOrder.tracking_number}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-mono flex items-center gap-1">{dropshipOrder.tracking_number}<ExternalLink className="w-3 h-3"/></a>
            </div>
          )}

          {dropshipOrder.error_message && <div className="flex items-center gap-2 text-red-400 text-xs"><AlertCircle className="w-4 h-4"/>{dropshipOrder.error_message}</div>}

          {dropshipOrder.status === 'failed' && (
            <button onClick={submitToCJ} disabled={submitting} className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold px-4 py-2 rounded-xl text-sm transition-colors">{submitting ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}Réessayer</button>
          )}
        </div>
      ) : (
        <div>
          <p className="text-gray-400 text-sm mb-4">Cette commande contient des produits dropshipping. Envoyez-la à CJDropshipping pour qu'ils préparent et expédient.</p>
          <button onClick={submitToCJ} disabled={submitting} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25">{submitting ? <Loader className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}📤 Envoyer à CJDropshipping</button>
        </div>
      )}
    </div>
  )
}

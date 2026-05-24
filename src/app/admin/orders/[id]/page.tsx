'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Package, Truck, CheckCircle, Printer, Send, ExternalLink, MapPin, Mail, Phone, ShoppingBag, AlertTriangle, QrCode, XCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { formatAdminPrice } from '@/lib/utils'
import { toast } from 'sonner'
import CJOrderButton from '@/components/admin/CJOrderButton'
import SupplierMessagePanel from '@/components/admin/SupplierMessagePanel'

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [dropshipOrder, setDropshipOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [showTrackingInput, setShowTrackingInput] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadOrder() }, [id])

  async function loadOrder() {
    const { data } = await supabase.from('guest_orders').select('*').eq('id', id).single()
    setOrder(data); if (data?.tracking_number) setTrackingNumber(data.tracking_number)

    if (data) {
      const { data: dsData } = await supabase
        .from('dropship_orders')
        .select('*')
        .eq('order_number', data.order_number)
        .single()
      setDropshipOrder(dsData)
    }

    setLoading(false)
  }

  async function markAsProcessing() {
    setProcessing(true)
    try {
      const { error } = await supabase.from('guest_orders').update({ order_status: 'processing', updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setOrder((prev: any) => ({ ...prev, order_status: 'processing' }))
      await supabase.from('admin_logs').insert({ admin_email: 'admin', action: 'ORDER_PROCESSING', entity: 'orders', entity_id: id as string, details: { order_number: order.order_number } })
      toast.success('📦 Commande mise en traitement!')
      setTimeout(() => { printShippingLabel() }, 500)
    } catch (err: any) { toast.error(err.message) } finally { setProcessing(false) }
  }

  async function markAsShipped() {
    if (!trackingNumber.trim()) { toast.error('Entrez le numéro de suivi!'); return }
    setProcessing(true)
    try {
      const { error } = await supabase.from('guest_orders').update({ order_status: 'shipped', tracking_number: trackingNumber, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setOrder((prev: any) => ({ ...prev, order_status: 'shipped', tracking_number: trackingNumber }))
      await fetch('/api/orders/shipped-notification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: order.email, firstName: order.first_name, orderNumber: order.order_number, trackingNumber: trackingNumber, items: order.items, total: order.total, shippingAddress: order.shipping_address }) })
      await supabase.from('admin_logs').insert({ admin_email: 'admin', action: 'ORDER_SHIPPED', entity: 'orders', entity_id: id as string, details: { tracking: trackingNumber, email_sent: order.email } })
      setShowTrackingInput(false); toast.success('🚚 Commande expédiée! Email envoyé au client.')
    } catch (err: any) { toast.error(err.message) } finally { setProcessing(false) }
  }

  async function cancelOrder() {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ? Si elle n\'est pas encore traitée, le client sera remboursé automatiquement via Stripe.')) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setOrder((prev: any) => ({ ...prev, order_status: 'cancelled' }))
      await supabase.from('admin_logs').insert({ admin_email: 'admin', action: 'ORDER_CANCELLED', entity: 'orders', entity_id: id as string, details: { order_number: order.order_number, refunded: data.refundSuccess } })
      toast.success(data.refundSuccess ? '❌ Commande annulée et remboursée avec succès !' : '❌ Commande annulée (sans remboursement auto)')
    } catch (err: any) { toast.error(err.message) } finally { setProcessing(false) }
  }

  function printShippingLabel() {
    if (!order) return
    const labelWindow = window.open('', '_blank', 'width=400,height=600'); if (!labelWindow) return
    const addr = order.shipping_address; const barcodeData = order.order_number
    labelWindow.document.write(`<!DOCTYPE html><html><head><title>Étiquette — ${order.order_number}</title><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { width: 4in; height: 6in; font-family: Arial, sans-serif; font-size: 11px; padding: 0.15in; color: #000; } .border-box { border: 2px solid #000; padding: 8px; border-radius: 4px; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 8px; } .shop-name { font-size: 22px; font-weight: 900; color: #F97316; } .shop-sub { font-size: 9px; color: #666; } .label-section { margin-bottom: 8px; } .label-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 3px; } .address-box { border: 1.5px solid #000; padding: 8px; border-radius: 3px; margin-bottom: 8px; } .to-address { background: #f0f0f0; } .name { font-size: 14px; font-weight: 900; margin-bottom: 3px; } .addr-line { font-size: 12px; line-height: 1.5; } .barcode-section { text-align: center; border-top: 2px solid #000; padding-top: 8px; margin-top: 4px; } .order-num { font-size: 16px; font-weight: 900; letter-spacing: 3px; } .items-section { border: 1px solid #ccc; padding: 6px; border-radius: 3px; margin-bottom: 6px; } .item-line { font-size: 10px; border-bottom: 1px dotted #ccc; padding: 2px 0; } .item-line:last-child { border: none; } .total-line { font-weight: 900; font-size: 12px; text-align: right; padding-top: 4px; } .weight-box { display: flex; gap: 8px; font-size: 10px; } .weight-item { flex: 1; border: 1px solid #000; padding: 4px; text-align: center; border-radius: 3px; } .weight-label { font-size: 8px; text-transform: uppercase; color: #666; } .weight-value { font-size: 14px; font-weight: 900; } @media print { @page { size: 4in 6in; margin: 0; } body { padding: 0.1in; } }</style></head><body><div class="header"><div><div class="shop-name">MissaShop</div><div class="shop-sub">Mode & Lifestyle Premium</div><div class="shop-sub" style="margin-top:2px">contact@missashopp.com</div><div class="shop-sub">missashopp.com</div></div><div style="text-align:right"><div style="font-size:9px; color:#666">Date</div><div style="font-weight:900; font-size:11px">${new Date().toLocaleDateString('fr-CA')}</div><div style="font-size:9px; margin-top:4px; color:#666">Commande</div><div style="font-weight:900">${order.order_number}</div></div></div><div class="label-section"><div class="label-title">Expéditeur</div><div class="address-box"><div class="name">Missa Shop</div><div class="addr-line">123 Rue du Commerce<br/>Montréal, QC H2L 1A1<br/>Canada<br/>Tel: +1 (555) 000-0000</div></div></div><div class="label-section"><div class="label-title">Destinataire</div><div class="address-box to-address"><div class="name">${order.first_name} ${order.last_name}</div><div class="addr-line">${addr?.address || ''}<br/>${addr?.city || ''}, ${addr?.state || ''} ${addr?.zip || ''}<br/>${addr?.country === 'CA' ? 'Canada' : addr?.country === 'US' ? 'États-Unis' : addr?.country === 'HT' ? 'Haïti' : addr?.country || ''}<br/>${order.phone ? `Tel: ${order.phone}` : ''}</div></div></div><div class="items-section"><div class="label-title" style="margin-bottom:4px">Contenu du colis</div>${order.items?.slice(0, 5).map((item: any) => `<div class="item-line">${item.qty}x ${item.name} ${item.variant?.size ? `(${item.variant.size})` : ''} ${item.variant?.color ? `- ${item.variant.color}` : ''}</div>`).join('')}${order.items?.length > 5 ? `<div class="item-line">+ ${order.items.length - 5} autre(s) article(s)</div>` : ''}<div class="total-line">Total: ${formatAdminPrice(order.total)}</div></div><div class="weight-box" style="margin-bottom:8px"><div class="weight-item"><div class="weight-label">Articles</div><div class="weight-value">${order.items?.reduce((s: number, i: any) => s + i.qty, 0)}</div></div><div class="weight-item"><div class="weight-label">Valeur déclarée</div><div class="weight-value">${formatAdminPrice(order.total)}</div></div><div class="weight-item"><div class="weight-label">Livraison</div><div class="weight-value" style="font-size:10px">Standard</div></div></div><div class="barcode-section"><svg id="barcode"></svg><div class="order-num" style="margin-top:4px">${order.order_number}</div><div style="font-size:9px; color:#666; margin-top:2px">Scannez pour voir les détails de la commande</div></div><script>JsBarcode("#barcode", "${barcodeData}", { format: "CODE128", width: 2, height: 60, displayValue: false, margin: 0 }); window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script></body></html>`); labelWindow.document.close()

  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
  if (!order) return <div className="text-center py-20"><p className="text-gray-400">Commande introuvable</p><Link href="/admin/orders" className="text-primary hover:underline mt-2 block">← Retour aux commandes</Link></div>

  const status = order.order_status; const addr = order.shipping_address

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"><Link href="/admin/orders" className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link><div><h1 className="text-xl font-black text-white">{order.order_number}</h1><p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleString('fr-CA')}</p></div></div>
        <div className="flex items-center gap-2">
          {status !== 'cancelled' && status !== 'delivered' && (
            <button
              onClick={cancelOrder}
              disabled={processing}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              <XCircle className="w-4 h-4" />
              Annuler la commande
            </button>
          )}
          <button onClick={printShippingLabel} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"><Printer className="w-4 h-4" />Imprimer étiquette 4×6</button>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-black text-white mb-6 flex items-center gap-2">⚡ Traitement de la commande</h2>
        <div className="flex items-center gap-0 mb-6">{[{ id: 'pending', label: 'Reçue', icon: ShoppingBag }, { id: 'processing', label: '📦 En traitement', icon: Package, desc: 'Préparer, emballer, déposer' }, { id: 'shipped', label: '🚚 Expédiée', icon: Truck, desc: 'Numéro de suivi requis' }, { id: 'delivered', label: '✅ Livrée', icon: CheckCircle }].map((step, i, arr) => { const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']; const currentIdx = statuses.indexOf(status); const stepIdx = statuses.indexOf(step.id); const isDone = currentIdx > stepIdx; const isCurrent = currentIdx === stepIdx || (step.id === 'pending' && currentIdx <= 1); return (<div key={step.id} className="flex items-center flex-1"><div className="flex flex-col items-center flex-shrink-0"><div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-secondary border-secondary' : isCurrent ? 'bg-primary/20 border-primary' : 'bg-gray-800 border-gray-700'}`}>{isDone ? <CheckCircle className="w-5 h-5 text-white fill-white" /> : <step.icon className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-gray-600'}`} />}</div><p className={`text-xs font-bold mt-2 text-center max-w-[80px] ${isDone ? 'text-secondary' : isCurrent ? 'text-white' : 'text-gray-600'}`}>{step.label}</p></div>{i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-all ${isDone ? 'bg-secondary' : 'bg-gray-700'}`} />}</div>) })}</div>
        <div className="space-y-4">
          {(status === 'pending' || status === 'confirmed') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5"><div className="flex items-start gap-4"><div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><Package className="w-6 h-6 text-orange-400" /></div><div className="flex-1"><h3 className="font-black text-white text-lg mb-1">Étape 1 — Mise en traitement</h3><p className="text-gray-400 text-sm mb-4">Cliquez pour commencer à préparer cette commande. L'étiquette d'expédition 4×6 avec code-barre s'imprimera automatiquement.</p><div className="flex items-center gap-3 text-sm text-gray-500 mb-4"><span className="flex items-center gap-1.5"><Package className="w-4 h-4 text-orange-400" />Préparer les articles</span><span>→</span><span className="flex items-center gap-1.5"><span>📦</span>Emballer</span><span>→</span><span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-orange-400" />Déposer chez le livreur</span></div><button onClick={markAsProcessing} disabled={processing} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-orange-500/25">{processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package className="w-4 h-4" />}Mettre en traitement + Imprimer étiquette</button></div></div></motion.div>
          )}
          {status === 'processing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/10 border border-primary/30 rounded-2xl p-5"><div className="flex items-start gap-4"><div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0"><Truck className="w-6 h-6 text-primary" /></div><div className="flex-1"><h3 className="font-black text-white text-lg mb-1">Étape 2 — Marquer comme expédié</h3><p className="text-gray-400 text-sm mb-4">Entrez le numéro de suivi que le bureau d'envoi vous a donné. Le client recevra un email automatique avec son numéro de suivi.</p><div className="flex gap-3"><div className="flex-1"><input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Ex: 1Z999AA10123456784" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:border-primary focus:outline-none font-mono transition-colors" /></div><button onClick={markAsShipped} disabled={processing || !trackingNumber.trim()} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-black px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary/25 whitespace-nowrap">{processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}Expédier + Notifier client</button></div><div className="mt-3 flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3.5 h-3.5 text-secondary" />Un email automatique sera envoyé à <strong className="text-white">{order.email}</strong> avec le numéro de suivi</div></div></div></motion.div>
          )}
          {status === 'shipped' && (
            <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0"><Truck className="w-6 h-6 text-secondary" /></div><div className="flex-1"><h3 className="font-black text-white">✅ Commande expédiée!</h3><p className="text-gray-400 text-sm mt-1">Numéro de suivi: <strong className="text-white font-mono">{order.tracking_number}</strong></p><p className="text-secondary text-sm mt-1">📧 Email de suivi envoyé au client</p></div><a href={`https://t.17track.net/en#nums=${order.tracking_number}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"><ExternalLink className="w-4 h-4" />Suivre</a></div></div>
          )}
          {status === 'delivered' && <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-secondary" /><span className="font-bold text-secondary">✅ Commande livrée avec succès!</span></div>}
          {status === 'cancelled' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400" />
              <span className="font-bold text-red-400">❌ Cette commande a été annulée.</span>
            </div>
          )}
        </div>
      </div>

      <CJOrderButton orderId={id as string} orderItems={order.items || []} />

      {order.items?.some(
        (i: any) => i.is_dropship
      ) && (
          <div className="mt-6">
            <SupplierMessagePanel
              cjOrderId={
                dropshipOrder?.cj_order_id
              }
              mode="compact"
            />
          </div>
        )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6"><h2 className="font-black text-white mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-primary" />Informations client</h2><div className="space-y-3 text-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-black text-white text-lg">{order.first_name?.[0]}</div><div><p className="text-white font-bold">{order.first_name} {order.last_name}</p><p className="text-gray-500">Client invité</p></div></div><div className="flex items-center gap-2 text-gray-300"><Mail className="w-4 h-4 text-gray-500 flex-shrink-0" /><a href={`mailto:${order.email}`} className="hover:text-primary transition-colors">{order.email}</a></div>{order.phone && <div className="flex items-center gap-2 text-gray-300"><Phone className="w-4 h-4 text-gray-500" />{order.phone}</div>}</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6"><h2 className="font-black text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Adresse de livraison</h2>{addr ? <div className="text-sm text-gray-300 space-y-1"><p className="font-bold text-white text-base">{order.first_name} {order.last_name}</p><p>{addr.address}</p><p>{addr.city}, {addr.state} {addr.zip}</p><p>{addr.country === 'CA' ? '🇨🇦 Canada' : addr.country === 'US' ? '🇺🇸 États-Unis' : addr.country === 'HT' ? '🇭🇹 Haïti' : addr.country}</p></div> : <p className="text-gray-500 text-sm">Adresse non disponible</p>}</div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"><div className="px-6 py-4 border-b border-gray-800"><h2 className="font-black text-white">📦 Articles commandés</h2></div><div className="p-6 space-y-4">{order.items?.map((item: any, i: number) => (<div key={i} className="flex items-center gap-4 p-4 bg-gray-800 rounded-2xl"><div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0 flex items-center justify-center">{item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-icon'); }} /> : <div className="text-2xl">📦</div>}<style dangerouslySetInnerHTML={{__html: `.fallback-icon::after { content: '📦'; font-size: 24px; }`}} /></div><div className="flex-1 min-w-0"><p className="font-bold text-white text-sm line-clamp-1">{item.name}</p>{item.variant && <p className="text-gray-500 text-xs mt-0.5">{item.variant.size && `Taille: ${item.variant.size}`}{item.variant.color && ` | Couleur: ${item.variant.color}`}</p>}<p className="text-gray-600 text-xs mt-0.5">SKU: {item.product_id?.substring(0, 8)}...</p></div><div className="text-right flex-shrink-0"><p className="text-white font-black">{formatAdminPrice(item.price * item.qty)}</p><p className="text-gray-500 text-sm">{formatAdminPrice(item.price)} × {item.qty}</p></div></div>))}</div><div className="px-6 pb-6"><div className="border-t border-gray-700 pt-4 space-y-2"><div className="flex justify-between text-sm text-gray-400"><span>Sous-total</span><span>{formatAdminPrice(order.subtotal)}</span></div><div className="flex justify-between text-sm text-gray-400"><span>Livraison</span><span className={order.shipping === 0 ? 'text-secondary font-bold' : ''}>{order.shipping === 0 ? 'GRATUITE' : formatAdminPrice(order.shipping)}</span></div><div className="flex justify-between text-sm text-gray-400"><span>Taxes</span><span>{formatAdminPrice(order.tax)}</span></div><div className="flex justify-between font-black text-xl text-white pt-2 border-t border-gray-700 mt-2"><span>TOTAL</span><span className="text-primary">{formatAdminPrice(order.total)}</span></div></div></div></div>
      {order.notes && <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5"><p className="text-yellow-400 font-bold flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" />Note du client:</p><p className="text-gray-300 text-sm">{order.notes}</p></div>}
    </div>
  )
}

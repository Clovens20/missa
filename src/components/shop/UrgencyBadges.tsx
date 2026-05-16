'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, Flame, Clock, 
  TrendingUp, Zap, Users,
  ShoppingCart, AlertCircle
} from 'lucide-react'

// ── 1. LIVE VIEWERS COUNTER ──────────

export function LiveViewers({ 
  min = 3, 
  max = 18,
  productId,
}: { 
  min?: number
  max?: number
  productId?: string
}) {
  const [count, setCount] = useState(
    Math.floor(Math.random() * (max - min) + min)
  )
  const [trend, setTrend] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        // Random walk between min and max
        const change = Math.random() > 0.5 ? 1 : -1
        const next = Math.max(min, Math.min(max, prev + change))
        setTrend(next > prev ? 'up' : 'down')
        setTimeout(() => setTrend(null), 800)
        return next
      })
    }, 4000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [min, max])

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm">
      <div className="relative">
        <Eye className="w-4 h-4 text-primary"/>
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-ping"/>
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"/>
      </div>
      <span className="text-gray-300">
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ y: trend === 'up' ? 8 : -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: trend === 'up' ? -8 : 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="inline-block font-black text-white">
            {count}
          </motion.span>
        </AnimatePresence>
        {' '}personnes regardent
      </span>
    </motion.div>
  )
}

// ── 2. STOCK SCARCITY ────────────────

export function StockScarcity({ 
  stock,
  threshold = 10,
}: { 
  stock: number
  threshold?: number
}) {
  if (stock > threshold) return null
  if (stock <= 0) return (
    <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0"/>
      <span className="text-red-400 font-bold text-sm">Rupture de stock</span>
    </div>
  )

  const isUrgent = stock <= 3
  const isMedium = stock <= 7

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border
        ${isUrgent
          ? 'bg-red-500/15 border-red-500/30'
          : isMedium
            ? 'bg-orange-500/15 border-orange-500/30'
            : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
      
      <Flame className={`w-4 h-4 flex-shrink-0
        ${isUrgent ? 'text-red-400 animate-pulse' : isMedium ? 'text-orange-400' : 'text-yellow-400'}`}/>
      
      <div>
        <p className={`font-black text-sm
          ${isUrgent ? 'text-red-400' : isMedium ? 'text-orange-400' : 'text-yellow-400'}`}>
          {isUrgent ? `⚡ Plus que ${stock} en stock!` : `🔥 Il ne reste que ${stock} articles`}
        </p>
        {isUrgent && (
          <p className="text-xs text-gray-500 mt-0.5">Commandez maintenant avant rupture</p>
        )}
      </div>
    </motion.div>
  )
}

// ── 3. COUNTDOWN TIMER ───────────────

export function CountdownTimer({ 
  endsAt,
  label = "L'offre expire dans",
  onExpire,
}: { 
  endsAt: Date | string
  label?: string
  onExpire?: () => void
}) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  })

  useEffect(() => {
    function calculate() {
      const end = new Date(endsAt).getTime()
      const now = Date.now()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft(p => ({ ...p, expired: true }))
        onExpire?.()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds, expired: false })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [endsAt])

  if (timeLeft.expired) return null

  function TimeBlock({ value, label }: { value: number, label: string }) {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-12 h-12 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={value}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-black text-xl text-white tabular-nums">
              {String(value).padStart(2, '0')}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">{label}</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary animate-pulse"/>
        <span className="text-primary font-bold text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <TimeBlock value={timeLeft.hours} label="heures" />
        <span className="text-gray-500 font-black text-xl mb-4">:</span>
        <TimeBlock value={timeLeft.minutes} label="min" />
        <span className="text-gray-500 font-black text-xl mb-4">:</span>
        <TimeBlock value={timeLeft.seconds} label="sec" />
      </div>
    </motion.div>
  )
}

// ── 4. RECENT PURCHASE POPUP ─────────

const CITIES = ['Montréal', 'Toronto', 'Québec', 'Ottawa', 'Vancouver', 'Miami', 'New York', 'Port-au-Prince', 'Paris', 'Bruxelles', 'Lyon']
const TIMES = ['il y a 2 min', 'il y a 5 min', 'il y a 12 min', 'il y a 23 min', 'il y a 1h', 'il y a 2h', "aujourd'hui"]

export function RecentPurchasePopup({
  productName,
  productImage,
}: {
  productName: string
  productImage?: string
}) {
  const [visible, setVisible] = useState(false)
  const [purchase, setPurchase] = useState({ city: '', time: '' })

  useEffect(() => {
    const firstTimer = setTimeout(() => showRandomPurchase(), 8000)
    const interval = setInterval(() => showRandomPurchase(), 25000 + Math.random() * 15000)
    return () => { clearTimeout(firstTimer); clearInterval(interval) }
  }, [])

  function showRandomPurchase() {
    setPurchase({
      city: CITIES[Math.floor(Math.random() * CITIES.length)],
      time: TIMES[Math.floor(Math.random() * TIMES.length)],
    })
    setVisible(true)
    setTimeout(() => setVisible(false), 5000)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-6 left-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3 max-w-xs cursor-pointer hover:shadow-3xl transition-shadow"
          onClick={() => setVisible(false)}>
          
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {productImage ? (
              <img src={productImage} alt={productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-gray-400"/>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-xs font-bold line-clamp-1">✅ Quelqu'un à {purchase.city}</p>
            <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">a acheté {productName}</p>
            <p className="text-gray-400 text-[10px] mt-0.5">{purchase.time}</p>
          </div>

          <button onClick={e => { e.stopPropagation(); setVisible(false) }} className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-lg leading-none">×</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── 5. SOLD COUNT BADGE ───────────────

export function SoldCountBadge({ count, className = '' }: { count: number, className?: string }) {
  if (!count || count <= 0) return null
  const display = count >= 1000 ? `${(count/1000).toFixed(1)}k` : count.toString()
  return (
    <div className={`flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
      <TrendingUp className="w-3.5 h-3.5 text-secondary"/>
      <span><strong className="text-white">{display}</strong>{' '}vendus</span>
    </div>
  )
}

// ── 6. FLASH SALE BADGE ───────────────

export function FlashSaleBadge({ discount, className = '' }: { discount: number, className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`flex items-center gap-1 bg-red-500 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-lg shadow-red-500/30 ${className}`}>
      <Zap className="w-3 h-3"/>
      FLASH -{discount}%
    </motion.div>
  )
}

// ── 7. FULL URGENCY BLOCK ─────────────

export function UrgencyBlock({ product }: { product: any }) {
  const stock = product.stock_quantity || product.stock || 999
  const viewers_min = product.fake_viewers_min || 3
  const viewers_max = product.fake_viewers_max || 18
  const soldCount = product.sold_count || product.soldCount || 0
  const flashEnds = product.flash_sale_ends_at

  if (!product.show_urgency) return null

  return (
    <div className="space-y-3 my-4 py-4 border-t border-b border-gray-100">
      <LiveViewers min={viewers_min} max={viewers_max} productId={product.id} />
      {soldCount > 0 && <SoldCountBadge count={soldCount}/>}
      <StockScarcity stock={stock}/>
      {flashEnds && <CountdownTimer endsAt={flashEnds}/>}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Star, TrendingUp, Package,
  Clock, MapPin, ShieldCheck,
  ChevronDown, ChevronUp,
  Award, Zap, AlertCircle,
  CheckCircle, Users, 
  BarChart3, Globe
} from 'lucide-react'

interface SupplierInfo {
  supplierName: string
  countryCode: string
  productSales: number
  productScore: number | string
  supplierScore: number | string
  reviewCount: number
  processingTime: string
  shippingFromUS?: boolean
}

interface SupplierInfoCardProps {
  supplier: SupplierInfo
  productPrice?: number
  // Expanded = show all details
  // collapsed = show summary only
  defaultExpanded?: boolean
  className?: string
}

function ScoreBar({ 
  score, 
  max = 5,
  color = 'primary'
}: { 
  score: number
  max?: number
  color?: string
}) {
  const pct = (score / max) * 100
  const colorClass = 
    color === 'primary' 
      ? 'bg-primary' 
      : color === 'secondary'
        ? 'bg-secondary'
        : 'bg-blue-500'
  
  return (
    <div className="flex items-center 
      gap-2">
      <div className="flex-1 h-1.5 
        bg-gray-700 rounded-full 
        overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ 
            duration: 0.8, 
            ease: 'easeOut' 
          }}
          className={`h-full ${colorClass} 
            rounded-full`}
        />
      </div>
      <span className="text-xs 
        font-bold text-white w-8 
        text-right">
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function PerformanceBadge({ 
  score 
}: { 
  score: number 
}) {
  if (score >= 4.8) return (
    <span className="flex items-center 
      gap-1 bg-secondary/20 
      text-secondary text-[10px] 
      font-black px-2 py-0.5 
      rounded-full">
      <Award className="w-3 h-3"/>
      TOP SUPPLIER
    </span>
  )
  if (score >= 4.5) return (
    <span className="flex items-center 
      gap-1 bg-primary/20 
      text-primary text-[10px] 
      font-black px-2 py-0.5 
      rounded-full">
      <CheckCircle className="w-3 h-3"/>
      FIABLE
    </span>
  )
  if (score >= 4.0) return (
    <span className="flex items-center 
      gap-1 bg-yellow-500/20 
      text-yellow-400 text-[10px] 
      font-black px-2 py-0.5 
      rounded-full">
      <Star className="w-3 h-3"/>
      BON
    </span>
  )
  return (
    <span className="flex items-center 
      gap-1 bg-gray-700 
      text-gray-400 text-[10px] 
      font-black px-2 py-0.5 
      rounded-full">
      <AlertCircle className="w-3 h-3"/>
      NOUVEAU
    </span>
  )
}

export default function SupplierInfoCard({
  supplier,
  productPrice,
  defaultExpanded = false,
  className = '',
}: SupplierInfoCardProps) {
  const [expanded, setExpanded] = 
    useState(defaultExpanded)

  const score = parseFloat(
    supplier.productScore?.toString() || '0'
  )
  const supScore = parseFloat(
    supplier.supplierScore?.toString() || '0'
  )
  const sales = supplier.productSales || 0

  // Format sales number
  function formatSales(n: number): string {
    if (n >= 10000) 
      return `${(n/1000).toFixed(0)}k+`
    if (n >= 1000) 
      return `${(n/1000).toFixed(1)}k`
    return n.toString()
  }

  // Country flag
  function getFlag(code: string): string {
    const flags: Record<string, string> = {
      CN: '🇨🇳', US: '🇺🇸', 
      EU: '🇪🇺', TH: '🇹🇭',
      DE: '🇩🇪', UK: '🇬🇧',
      CA: '🇨🇦',
    }
    return flags[code] || '🌍'
  }

  return (
    <div className={`bg-gray-800/80 
      border border-gray-700 
      rounded-xl overflow-hidden 
      ${className}`}>
      
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center 
          justify-between p-3 
          hover:bg-gray-700/50 
          transition-colors">
        
        <div className="flex items-center 
          gap-2.5 min-w-0">
          {/* Country flag */}
          <span className="text-xl 
            flex-shrink-0">
            {getFlag(supplier.countryCode)}
          </span>
          
          {/* Basic info */}
          <div className="min-w-0">
            <p className="text-white 
              font-bold text-xs 
              truncate">
              {supplier.supplierName}
            </p>
            <div className="flex items-center 
              gap-2 mt-0.5">
              {/* Stars */}
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i}
                    className={`w-2.5 h-2.5 
                      ${i <= Math.round(score)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-600'
                      }`}
                  />
                ))}
              </div>
              <span className="text-[10px] 
                text-gray-400">
                {score.toFixed(1)} 
                ({formatSales(
                  supplier.reviewCount || 0
                )} avis)
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center 
          gap-2 flex-shrink-0 ml-2">
          <PerformanceBadge score={supScore}/>
          <div className="flex items-center 
            gap-1 text-[10px] 
            text-gray-500 
            bg-gray-700 px-2 py-1 
            rounded-lg">
            <TrendingUp className="w-3 h-3"/>
            {formatSales(sales)} vendus
          </div>
          {expanded 
            ? <ChevronUp 
                className="w-4 h-4 
                  text-gray-500"/> 
            : <ChevronDown 
                className="w-4 h-4 
                  text-gray-500"/>
          }
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden">
            
            <div className="px-4 pb-4 
              border-t border-gray-700 
              pt-3 space-y-4">
              
              {/* Location + shipping */}
              <div className="flex items-center 
                gap-4 text-xs text-gray-400">
                <div className="flex items-center 
                  gap-1.5">
                  <MapPin className="w-3.5 h-3.5 
                    text-gray-500"/>
                  {supplier.countryCode === 'US'
                    ? '🇺🇸 Expédié depuis USA'
                    : supplier.countryCode === 'CN'
                      ? '🇨🇳 Expédié depuis Chine'
                      : `Expédié depuis ${supplier.countryCode}`}
                </div>
                <div className="flex items-center 
                  gap-1.5">
                  <Clock className="w-3.5 h-3.5 
                    text-gray-500"/>
                  Traitement: {supplier.processingTime}
                </div>
              </div>

              {/* Scores */}
              <div className="space-y-2.5">
                <p className="text-[10px] 
                  text-gray-500 font-black 
                  uppercase tracking-wide">
                  Performance
                </p>

                <div className="space-y-2">
                  <div>
                    <div className="flex 
                      justify-between 
                      text-xs mb-1">
                      <span className="text-gray-400 
                        flex items-center gap-1">
                        <Star className="w-3 h-3 
                          text-amber-400"/>
                        Qualité produit
                      </span>
                    </div>
                    <ScoreBar 
                      score={score} 
                      color="primary"
                    />
                  </div>
                  
                  <div>
                    <div className="flex 
                      justify-between 
                      text-xs mb-1">
                      <span className="text-gray-400 
                        flex items-center gap-1">
                        <ShieldCheck 
                          className="w-3 h-3 
                            text-secondary"/>
                        Score fournisseur
                      </span>
                    </div>
                    <ScoreBar 
                      score={supScore} 
                      color="secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid 
                grid-cols-3 gap-2">
                {[
                  { 
                    icon: TrendingUp, 
                    label: 'Ventes', 
                    value: formatSales(sales),
                    color: 'text-primary'
                  },
                  { 
                    icon: Users, 
                    label: 'Avis', 
                    value: formatSales(
                      supplier.reviewCount || 0
                    ),
                    color: 'text-amber-400'
                  },
                  { 
                    icon: Zap, 
                    label: 'Délai', 
                    value: supplier.processingTime
                      .split(' ')[0],
                    color: 'text-blue-400'
                  },
                ].map((stat, i) => (
                  <div key={i}
                    className="bg-gray-900 
                      rounded-xl p-2.5 
                      text-center">
                    <stat.icon className={`w-4 h-4 
                      ${stat.color} mx-auto 
                      mb-1`}/>
                    <p className={`font-black 
                      text-sm ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-[9px] 
                      text-gray-600 uppercase 
                      tracking-wide">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className={`rounded-xl p-3 
                text-xs flex items-start gap-2
                ${supScore >= 4.5
                  ? 'bg-secondary/10 border border-secondary/20'
                  : supScore >= 4.0
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-gray-700 border border-gray-600'
                }`}>
                {supScore >= 4.5 ? (
                  <>
                    <CheckCircle className="w-4 h-4 
                      text-secondary 
                      flex-shrink-0 mt-0.5"/>
                    <p className="text-secondary">
                      <strong>Fournisseur recommandé.</strong>
                      {' '}Haute fiabilité, 
                      excellents avis clients.
                    </p>
                  </>
                ) : supScore >= 4.0 ? (
                  <>
                    <Star className="w-4 h-4 
                      text-yellow-400 
                      flex-shrink-0 mt-0.5"/>
                    <p className="text-yellow-300">
                      <strong>Bon fournisseur.</strong>
                      {' '}Commandez un sample 
                      avant de lancer.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 
                      text-gray-400 
                      flex-shrink-0 mt-0.5"/>
                    <p className="text-gray-400">
                      <strong>Nouveau fournisseur.</strong>
                      {' '}Prudence recommandée. 
                      Testez d'abord.
                    </p>
                  </>
                )}
              </div>

              {/* Shipping from US badge */}
              {supplier.shippingFromUS && (
                <div className="flex items-center 
                  gap-2 bg-blue-500/10 
                  border border-blue-500/20 
                  rounded-xl p-2.5 text-xs">
                  <Zap className="w-4 h-4 
                    text-blue-400 
                    flex-shrink-0"/>
                  <p className="text-blue-300">
                    <strong>
                      Entrepôt USA disponible!
                    </strong>
                    {' '}Livraison 5-7 jours 
                    (au lieu de 15-20j).
                    Fortement recommandé.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Share2, Copy, Check,
  X, MessageCircle,
  Facebook, Twitter,
  Mail, Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface ShareProductProps {
  productName: string
  productSlug: string
  productImage?: string
  productPrice?: number
}

export default function ShareProduct({
  productName,
  productSlug,
  productImage,
  productPrice,
}: ShareProductProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const productUrl = 
    `${process.env.NEXT_PUBLIC_SITE_URL}` +
    `/product/${productSlug}`

  const shareText = 
    `Regarde ce produit sur Missa Shop: ` +
    `${productName}` +
    (productPrice 
      ? ` — $${productPrice.toFixed(2)}` 
      : '')

  // Share options
  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=` +
        encodeURIComponent(
          `${shareText}
${productUrl}`
        ),
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=` +
        encodeURIComponent(productUrl),
    },
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-900',
      url: `https://twitter.com/intent/tweet?text=` +
        encodeURIComponent(shareText) +
        `&url=` +
        encodeURIComponent(productUrl),
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=` +
        encodeURIComponent(
          `Regarde ce produit!`
        ) +
        `&body=` +
        encodeURIComponent(
          `${shareText}

${productUrl}`
        ),
    },
  ]

  async function copyLink() {
    try {
      await navigator.clipboard
        .writeText(productUrl)
      setCopied(true)
      toast.success('🔗 Lien copié!')
      setTimeout(() => 
        setCopied(false), 2000
      )
    } catch {
      toast.error('Impossible de copier')
    }
  }

  // Use native share on mobile
  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      setOpen(true)
    }
  }

  return (
    <div className="relative">
      
      {/* Share button */}
      <button
        onClick={nativeShare}
        className="flex items-center 
          gap-2 px-4 py-2.5 
          bg-gray-100 hover:bg-gray-200 
          text-gray-600 hover:text-gray-900
          font-semibold rounded-xl 
          text-sm transition-all
          border border-gray-200">
        <Share2 className="w-4 h-4"/>
        Partager
      </button>

      {/* Desktop share modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 
                bg-black/50 z-40 
                backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.9,
                y: 10,
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.9,
                y: 10,
              }}
              className="fixed left-1/2 
                top-1/2 -translate-x-1/2 
                -translate-y-1/2 
                bg-white rounded-3xl 
                shadow-2xl z-50 
                w-full max-w-sm 
                overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center 
                justify-between p-5 
                border-b border-gray-100">
                <h3 className="font-black 
                  text-gray-900 text-lg">
                  Partager ce produit
                </h3>
                <button
                  onClick={() => 
                    setOpen(false)}
                  className="w-8 h-8 
                    bg-gray-100 rounded-full 
                    flex items-center 
                    justify-center 
                    hover:bg-gray-200 
                    transition-colors">
                  <X className="w-4 h-4 
                    text-gray-500"/>
                </button>
              </div>

              <div className="p-5 space-y-4">
                
                {/* Product preview */}
                <div className="flex gap-3 
                  bg-gray-50 rounded-2xl 
                  p-3">
                  {productImage && (
                    <div className="w-14 h-14 
                      rounded-xl overflow-hidden 
                      bg-gray-200 flex-shrink-0">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full 
                          object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 
                    min-w-0">
                    <p className="font-bold 
                      text-gray-900 text-sm 
                      line-clamp-2">
                      {productName}
                    </p>
                    {productPrice && (
                      <p className="text-primary 
                        font-black mt-1">
                        ${productPrice
                          .toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Copy link */}
                <div className="flex gap-2">
                  <div className="flex-1 
                    bg-gray-100 rounded-xl 
                    px-3 py-2.5 
                    overflow-hidden">
                    <p className="text-xs 
                      text-gray-500 
                      truncate font-mono">
                      {productUrl}
                    </p>
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex items-center 
                      gap-2 px-4 py-2.5 
                      rounded-xl font-bold 
                      text-sm transition-all
                      ${copied
                        ? 'bg-secondary text-white'
                        : 'bg-primary text-white hover:bg-primary-dark'
                      }`}>
                    {copied ? (
                      <Check className="w-4 h-4"/>
                    ) : (
                      <Copy className="w-4 h-4"/>
                    )}
                    {copied ? 'Copié!' : 'Copier'}
                  </button>
                </div>

                {/* Share buttons */}
                <div>
                  <p className="text-xs 
                    font-bold text-gray-400 
                    uppercase tracking-wide 
                    mb-3">
                    Partager via
                  </p>
                  <div className="grid 
                    grid-cols-4 gap-3">
                    {shareLinks.map(s => (
                      <a
                        key={s.name}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => 
                          setOpen(false)}
                        className={`flex 
                          flex-col items-center 
                          gap-2 p-3 rounded-2xl 
                          ${s.color} 
                          transition-all 
                          group`}>
                        <s.icon className="w-6 
                          h-6 text-white"/>
                        <span className="text-[10px] 
                          text-white font-bold">
                          {s.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

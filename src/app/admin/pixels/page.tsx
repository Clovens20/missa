'use client'
import { useState, useEffect } 
  from 'react'
import { motion, AnimatePresence } 
  from 'framer-motion'
import {
  Save, CheckCircle, X,
  AlertCircle, Code, Info,
  ExternalLink, ChevronRight,
  Zap, Globe, Eye,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Platform configs ─────────────────
const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook Pixel',
    subtitle: 'Meta Pixel & API de Conversion',
    logo: '📘',
    color: '#1877F2',
    bgColor: 'bg-blue-600',
    enabledKey: 'facebook_enabled',
    zone1Key: 'facebook_domain_tag',
    zone2Key: 'facebook_pixel_script',
    zone1Label: 
      'Zone 1 — Vérification de Domaine',
    zone1Desc: 
      'Collez ici votre meta tag de vérification de domaine Facebook Business',
    zone1Placeholder: 
      '<meta name="facebook-domain-verification" content="XXXXXXXXXXXXXX" />',
    zone1Help: 
      'Trouvez ce tag dans: Meta Business Suite → Brand Safety → Domaines → Vérifier',
    zone2Label: 
      'Zone 2 — Script de Suivi (Pixel)',
    zone2Desc: 
      'Collez ici le code complet du Facebook Pixel fourni par Meta',
    zone2Placeholder: 
`<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){
n.callMethod?n.callMethod.apply(n,arguments)
:n.queue.push(arguments)};
...
fbq('init', 'VOTRE_PIXEL_ID');
fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->`,
    zone2Help: 
      'Meta Business Suite → Events Manager → Votre Pixel → Configurer → Installer manuellement',
    link: 'https://business.facebook.com/events_manager',
    linkLabel: 'Ouvrir Meta Business Suite',
    events: [
      'PageView', 'ViewContent', 
      'AddToCart', 'InitiateCheckout', 
      'Purchase',
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Pixel',
    subtitle: 'TikTok Ads Tracking',
    logo: '🎵',
    color: '#010101',
    bgColor: 'bg-gray-900',
    enabledKey: 'tiktok_enabled',
    zone1Key: 'tiktok_domain_tag',
    zone2Key: 'tiktok_pixel_script',
    zone1Label: 
      'Zone 1 — Vérification de Domaine',
    zone1Desc: 
      'Meta tag de vérification TikTok (optionnel)',
    zone1Placeholder: 
      '<meta name="tiktok-domain-verification" content="XXXXXX" />',
    zone1Help: 
      'TikTok Ads Manager → Assets → Events → Web Events',
    zone2Label: 
      'Zone 2 — Script de Suivi (Pixel)',
    zone2Desc: 
      'Collez ici le code complet du TikTok Pixel',
    zone2Placeholder: 
`<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;
  var ttq=w[t]=w[t]||[];
  ...
  ttq.load('VOTRE_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>`,
    zone2Help: 
      'TikTok Ads Manager → Assets → Events → Créer Pixel Web',
    link: 'https://ads.tiktok.com',
    linkLabel: 'Ouvrir TikTok Ads Manager',
    events: [
      'PageView', 'AddToCart',
      'PlaceAnOrder', 'CompletePayment',
    ],
  },
  {
    id: 'google',
    name: 'Google Analytics',
    subtitle: 'GA4 + Google Ads',
    logo: '📊',
    color: '#E37400',
    bgColor: 'bg-orange-500',
    enabledKey: 'google_enabled',
    zone1Key: 'google_domain_tag',
    zone2Key: 'google_pixel_script',
    zone1Label: 
      'Zone 1 — Google Search Console',
    zone1Desc: 
      'Meta tag de vérification Google Search Console (optionnel)',
    zone1Placeholder: 
      '<meta name="google-site-verification" content="XXXXXXXXXXXXXX" />',
    zone1Help: 
      'Google Search Console → Paramètres → Propriété → Méthode de vérification HTML',
    zone2Label: 
      'Zone 2 — Script Google Analytics / Ads',
    zone2Desc: 
      'Collez ici le script gtag.js de Google Analytics 4',
    zone2Placeholder: 
`<!-- Google tag (gtag.js) -->
<script async 
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX">
</script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`,
    zone2Help: 
      'Google Analytics → Admin → Data Streams → Votre stream → Instructions de balisage',
    link: 'https://analytics.google.com',
    linkLabel: 'Ouvrir Google Analytics',
    events: [
      'page_view', 'add_to_cart',
      'begin_checkout', 'purchase',
    ],
  },
  {
    id: 'snapchat',
    name: 'Snapchat Pixel',
    subtitle: 'Snapchat Ads Conversion',
    logo: '👻',
    color: '#FFFC00',
    bgColor: 'bg-yellow-400',
    enabledKey: 'snapchat_enabled',
    zone1Key: 'snapchat_domain_tag',
    zone2Key: 'snapchat_pixel_script',
    zone1Label: 
      'Zone 1 — Vérification de Domaine',
    zone1Desc: 
      'Meta tag de vérification Snapchat (si requis)',
    zone1Placeholder: 
      '<meta name="p:domain_verify" content="XXXXXX" />',
    zone1Help: 
      'Snapchat Ads Manager → Assets → Snap Pixel',
    zone2Label: 
      'Zone 2 — Script Snapchat Pixel',
    zone2Desc: 
      'Collez ici le code complet du Snapchat Pixel',
    zone2Placeholder: 
`<script type='text/javascript'>
(function(e,t,n){
  ...
  snaptr('init', 'VOTRE_PIXEL_ID', {});
  snaptr('track','PAGE_VIEW');
})(window,document,'script');
</script>`,
    zone2Help: 
      'Snapchat Ads Manager → Assets → Snap Pixel → Setup Pixel',
    link: 'https://ads.snapchat.com',
    linkLabel: 'Ouvrir Snapchat Ads',
    events: [
      'PAGE_VIEW', 'ADD_CART', 'PURCHASE',
    ],
  },
  {
    id: 'pinterest',
    name: 'Pinterest Tag',
    subtitle: 'Pinterest Ads Conversion',
    logo: '📌',
    color: '#E60023',
    bgColor: 'bg-red-600',
    enabledKey: 'pinterest_enabled',
    zone1Key: 'pinterest_domain_tag',
    zone2Key: 'pinterest_pixel_script',
    zone1Label: 
      'Zone 1 — Vérification de Domaine',
    zone1Desc: 
      'Meta tag de revendication de site Pinterest',
    zone1Placeholder: 
      '<meta name="p:domain_verify" content="XXXXXXXXXXXXXX" />',
    zone1Help: 
      'Pinterest Business → Paramètres → Revendiquer → Site Web',
    zone2Label: 
      'Zone 2 — Pinterest Tag Script',
    zone2Desc: 
      'Collez ici le code complet du Pinterest Tag',
    zone2Placeholder: 
`<script>
!function(e){
  if(!window.pintrk){
    window.pintrk = function () {
      window.pintrk.queue.push(
        Array.prototype.slice.call(arguments)
      )};
    ...
    pintrk('load', 'VOTRE_TAG_ID');
    pintrk('page');
  }
}("https://s.pinimg.com/ct/core.js");
</script>`,
    zone2Help: 
      'Pinterest Ads → Conversions → Pinterest Tag → Installer',
    link: 'https://ads.pinterest.com',
    linkLabel: 'Ouvrir Pinterest Ads',
    events: [
      'pagevisit', 'addtocart', 'checkout',
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter / X Pixel',
    subtitle: 'X Ads Conversion Tracking',
    logo: '𝕏',
    color: '#000000',
    bgColor: 'bg-black',
    enabledKey: 'twitter_enabled',
    zone1Key: 'twitter_domain_tag',
    zone2Key: 'twitter_pixel_script',
    zone1Label: 
      'Zone 1 — Vérification de Domaine',
    zone1Desc: 
      'Meta tag de vérification X/Twitter (optionnel)',
    zone1Placeholder: 
      '<!-- Pas de meta tag requis pour X -->',
    zone1Help: 
      'X Ads Manager → Tools → Conversion Tracking',
    zone2Label: 
      'Zone 2 — X/Twitter Pixel Script',
    zone2Desc: 
      'Collez ici le code complet du X/Twitter Universal Website Tag',
    zone2Placeholder: 
`<script>
!function(e,t,n,s,u,a){
  e.twq||(s=e.twq=function(){
    s.exe?s.exe.apply(s,arguments):
    s.queue.push(arguments)},
    ...
    twq('config','VOTRE_PIXEL_ID'));
}(window,document,'script');
</script>`,
    zone2Help: 
      'X Ads → Tools → Conversion Tracking → Website Tag',
    link: 'https://ads.twitter.com',
    linkLabel: 'Ouvrir X Ads Manager',
    events: ['PageView', 'Purchase'],
  },
]

export default function PixelsPage() {
  const [config, setConfig] = 
    useState<any>({})
  const [loading, setLoading] = 
    useState(true)
  const [saving, setSaving] = 
    useState<string | null>(null)
  const [activePlatform, 
    setActivePlatform] = 
    useState('facebook')

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    try {
      const res = await fetch(
        '/api/admin/pixels'
      )
      const data = await res.json()
      setConfig(data || {})
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  async function savePlatform(
    platformId: string
  ) {
    setSaving(platformId)
    try {
      const res = await fetch(
        '/api/admin/pixels',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 
              'application/json' 
          },
          body: JSON.stringify(config),
        }
      )
      const data = await res.json()
      if (data.success) {
        toast.success(
          '✅ Configuration sauvegardée!'
        )
      } else {
        toast.error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(null)
    }
  }

  function updateConfig(
    key: string, value: any
  ) {
    setConfig((prev: any) => ({
      ...prev, [key]: value
    }))
  }

  const currentPlatform = PLATFORMS.find(
    p => p.id === activePlatform
  )!

  const enabledCount = PLATFORMS.filter(
    p => config[p.enabledKey]
  ).length

  if (loading) return (
    <div className="flex items-center 
      justify-center h-64">
      <div className="w-8 h-8 
        border-2 border-primary/30 
        border-t-primary rounded-full 
        animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center 
        justify-between">
        <div>
          <h1 className="text-2xl 
            font-black text-white 
            flex items-center gap-3">
            <Zap className="w-6 h-6 
              text-primary"/>
            Pixels & Tracking
          </h1>
          <p className="text-gray-500 
            text-sm mt-0.5">
            {enabledCount} pixel(s) actif(s)
          </p>
        </div>
      </div>

      {/* Main layout — 2 columns */}
      <div className="flex gap-5 
        items-start">
        
        {/* LEFT — Platform list */}
        <div className="w-56 flex-shrink-0 
          space-y-1.5 sticky top-4">
          {PLATFORMS.map(platform => {
            const isEnabled = 
              config[platform.enabledKey]
            const isActive = 
              activePlatform === platform.id
            
            return (
              <button
                key={platform.id}
                onClick={() => 
                  setActivePlatform(
                    platform.id
                  )}
                className={`
                  w-full flex items-center 
                  gap-3 px-4 py-3.5 
                  rounded-2xl text-left 
                  transition-all
                  ${isActive
                    ? 'bg-gray-800 border border-gray-700 shadow-lg'
                    : 'hover:bg-gray-800/50 border border-transparent'
                  }`}>
                
                <div className={`
                  w-9 h-9 rounded-xl 
                  flex items-center 
                  justify-center text-base 
                  flex-shrink-0 font-black
                  ${isActive
                    ? platform.bgColor + ' text-white'
                    : 'bg-gray-800 text-gray-400'
                  }`}>
                  {platform.logo}
                </div>

                <div className="flex-1 
                  min-w-0">
                  <p className={`text-sm 
                    font-bold truncate
                    ${isActive 
                      ? 'text-white' 
                      : 'text-gray-400'
                    }`}>
                    {platform.name}
                  </p>
                  <p className={`text-[10px] 
                    font-bold mt-0.5
                    ${isEnabled
                      ? 'text-secondary'
                      : 'text-gray-600'
                    }`}>
                    {isEnabled 
                      ? '● ACTIF' 
                      : '○ INACTIF'}
                  </p>
                </div>

                {isActive && (
                  <ChevronRight 
                    className="w-4 h-4 
                      text-gray-500 
                      flex-shrink-0"/>
                )}
              </button>
            )
          })}
        </div>

        {/* RIGHT — Platform config */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePlatform}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0 
              space-y-4">
            
            {/* Platform header */}
            <div className={`
              ${currentPlatform.bgColor} 
              rounded-3xl p-6 
              flex items-center 
              justify-between`}>
              <div className="flex items-center 
                gap-4">
                <div className="w-14 h-14 
                  bg-white/20 rounded-2xl 
                  flex items-center 
                  justify-center text-3xl">
                  {currentPlatform.logo}
                </div>
                <div>
                  <h2 className="text-2xl 
                    font-black text-white">
                    {currentPlatform.name}
                  </h2>
                  <p className="text-white/70 
                    text-sm">
                    {currentPlatform.subtitle}
                  </p>
                </div>
              </div>

              {/* Enable toggle */}
              <div className="flex items-center 
                gap-3">
                <span className="text-white/80 
                  text-sm font-bold">
                  {config[
                    currentPlatform.enabledKey
                  ] ? 'Activé' : 'Désactivé'}
                </span>
                <button
                  onClick={() => 
                    updateConfig(
                      currentPlatform.enabledKey,
                      !config[
                        currentPlatform.enabledKey
                      ]
                    )}
                  className={`
                    relative w-14 h-7 
                    rounded-full 
                    transition-all duration-300
                    ${config[
                        currentPlatform.enabledKey
                      ]
                      ? 'bg-secondary'
                      : 'bg-black/30'
                    }`}>
                  <span className={`
                    absolute top-1 
                    w-5 h-5 bg-white 
                    rounded-full shadow-md 
                    transition-all duration-300
                    ${config[
                        currentPlatform.enabledKey
                      ]
                      ? 'left-8' 
                      : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ZONE 1 */}
            <div className="bg-gray-900 
              border border-gray-800 
              rounded-2xl overflow-hidden">
              
              <div className="px-5 py-4 
                border-b border-gray-800 
                flex items-center 
                justify-between">
                <div>
                  <h3 className="font-black 
                    text-white flex items-center 
                    gap-2">
                    <div className="w-6 h-6 
                      bg-primary rounded-lg 
                      flex items-center 
                      justify-center text-xs 
                      font-black text-white">
                      1
                    </div>
                    {currentPlatform.zone1Label}
                  </h3>
                  <p className="text-gray-500 
                    text-xs mt-1">
                    {currentPlatform.zone1Desc}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <textarea
                  value={
                    config[
                      currentPlatform.zone1Key
                    ] || ''
                  }
                  onChange={e => 
                    updateConfig(
                      currentPlatform.zone1Key,
                      e.target.value
                    )}
                  placeholder={
                    currentPlatform
                      .zone1Placeholder
                  }
                  rows={3}
                  className="w-full px-4 py-3 
                    bg-gray-800 border 
                    border-gray-700 rounded-xl 
                    text-green-400 text-xs 
                    font-mono focus:outline-none 
                    focus:border-primary 
                    resize-none 
                    placeholder:text-gray-700 
                    leading-relaxed"
                />
                <div className="flex items-center 
                  justify-between">
                  <p className="text-[10px] 
                    text-gray-600 
                    flex items-center gap-1.5">
                    <Info className="w-3 h-3"/>
                    {currentPlatform.zone1Help}
                  </p>
                  {currentPlatform.link && (
                    <a
                      href={currentPlatform.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center 
                        gap-1 text-[10px] 
                        text-primary font-bold 
                        hover:underline 
                        flex-shrink-0 ml-4">
                      {currentPlatform.linkLabel}
                      <ExternalLink 
                        className="w-3 h-3"/>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ZONE 2 */}
            <div className="bg-gray-900 
              border border-gray-800 
              rounded-2xl overflow-hidden">
              
              <div className="px-5 py-4 
                border-b border-gray-800">
                <h3 className="font-black 
                  text-white flex items-center 
                  gap-2">
                  <div className="w-6 h-6 
                    bg-secondary rounded-lg 
                    flex items-center 
                    justify-center text-xs 
                    font-black text-white">
                    2
                  </div>
                  {currentPlatform.zone2Label}
                </h3>
                <p className="text-gray-500 
                  text-xs mt-1">
                  {currentPlatform.zone2Desc}
                </p>
              </div>

              <div className="p-5 space-y-3">
                <textarea
                  value={
                    config[
                      currentPlatform.zone2Key
                    ] || ''
                  }
                  onChange={e => 
                    updateConfig(
                      currentPlatform.zone2Key,
                      e.target.value
                    )}
                  placeholder={
                    currentPlatform
                      .zone2Placeholder
                  }
                  rows={10}
                  className="w-full px-4 py-3 
                    bg-gray-800 border 
                    border-gray-700 rounded-xl 
                    text-green-400 text-xs 
                    font-mono focus:outline-none 
                    focus:border-secondary 
                    resize-none 
                    placeholder:text-gray-700 
                    leading-relaxed"
                />
                <p className="text-[10px] 
                  text-gray-600 
                  flex items-center gap-1.5">
                  <Code className="w-3 h-3"/>
                  {currentPlatform.zone2Help}
                </p>
              </div>
            </div>

            {/* Events tracked */}
            <div className="bg-gray-900/50 
              border border-gray-800/50 
              rounded-2xl p-4">
              <p className="text-xs 
                font-black text-gray-500 
                uppercase tracking-wide mb-3 
                flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 
                  text-primary"/>
                Événements trackés automatiquement
              </p>
              <div className="flex flex-wrap 
                gap-2">
                {currentPlatform.events
                  .map(ev => (
                  <span key={ev}
                    className="text-xs 
                      bg-gray-800 
                      text-secondary 
                      font-mono font-bold 
                      px-3 py-1.5 rounded-xl">
                    {ev}
                  </span>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 
              border border-blue-500/20 
              rounded-2xl p-4 
              flex gap-3">
              <Info className="w-4 h-4 
                text-blue-400 flex-shrink-0 
                mt-0.5"/>
              <p className="text-xs 
                text-blue-300 leading-relaxed">
                Le contenu de la Zone 1 sera 
                injecté dans le{' '}
                <code className="bg-blue-500/20 
                  px-1 rounded">
                  &lt;head&gt;
                </code>{' '}
                de toutes les pages. 
                Le contenu de la Zone 2 
                (script pixel) sera aussi 
                chargé dans le{' '}
                <code className="bg-blue-500/20 
                  px-1 rounded">
                  &lt;head&gt;
                </code>{' '}
                automatiquement sur tout 
                le shop.
              </p>
            </div>

            {/* Save + Cancel buttons */}
            <div className="flex gap-3 pb-6">
              <button
                onClick={() => 
                  savePlatform(
                    activePlatform
                  )}
                disabled={
                  saving === activePlatform
                }
                className="flex-1 flex 
                  items-center justify-center 
                  gap-2 bg-primary 
                  hover:bg-primary-dark 
                  text-white font-black 
                  py-4 rounded-2xl 
                  text-base transition-all 
                  shadow-lg shadow-primary/20 
                  disabled:opacity-50">
                {saving === activePlatform ? (
                  <div className="w-5 h-5 
                    border-2 border-white/30 
                    border-t-white rounded-full 
                    animate-spin"/>
                ) : (
                  <Save className="w-5 h-5"/>
                )}
                Enregistrer Configuration
              </button>
              <button
                onClick={loadConfig}
                className="px-6 py-4 
                  bg-gray-800 
                  hover:bg-gray-700 
                  text-gray-300 font-bold 
                  rounded-2xl text-base 
                  transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, Heart, ShoppingCart, 
  User, Menu, X, MapPin,
  ChevronDown, Shield, Truck,
  Star, Phone, Package, ArrowRight
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useCurrency, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext'
import { supabase } from '@/lib/supabase'
import { formatPrice, getSafeImageUrl } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types'
import SmartSearchBar from '@/components/shop/SmartSearchBar'

export default function Header() {
  const { count, toggleCart, total } = useCart()
  const { count: wishCount } = useWishlist()
  const { getSetting } = useSettings()
  const { currency, setCurrency } = useCurrency()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const router = useRouter()

  const [categories, setCategories] = useState<any[]>([
    { slug: 'femme', label: '👗 Femme', subs: ['Robes', 'Hauts', 'Pantalons', 'Vestes', 'Maillots de bain'] },
    { slug: 'homme', label: '👔 Homme', subs: ['Chemises', 'Pantalons', 'T-shirts', 'Vestes', 'Costumes'] },
    { slug: 'enfants', label: '👶 Enfants', subs: ['Bébé 0-2 ans', 'Fille 3-12 ans', 'Garçon 3-12 ans', 'Jouets', 'École'] },
    { slug: 'chaussures', label: '👟 Chaussures', subs: ['Sneakers', 'Talons', 'Sandales', 'Bottes', 'Sport'] },
    { slug: 'sacs', label: '👜 Sacs', subs: ['Sacs à main', 'Sacs à dos', 'Portefeuilles', 'Valises'] },
    { slug: 'beaute', label: '💄 Beauté', subs: ['Maquillage', 'Soins visage', 'Parfums', 'Cheveux'] },
    { slug: 'maison', label: '🏠 Maison', subs: ['Décoration', 'Cuisine', 'Linge', 'Rangement'] },
    { slug: 'electronique', label: '📱 Tech', subs: ['Smartphones', 'Écouteurs', 'Accessoires', 'Gadgets'] },
    { slug: 'bijoux', label: '💍 Bijoux', subs: ['Colliers', 'Boucles', 'Bracelets', 'Montres'] },
    { slug: 'sport', label: '🏃 Sport', subs: ['Vêtements sport', 'Équipements', 'Chaussures sport'] },
  ])

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (data && data.length > 0) {
        // Map DB categories to the format expected by the menu
        // and keep sub-categories from hardcoded if they match by slug
        const hardcoded = [
          { slug: 'femme', label: '👗 Femme', subs: ['Robes', 'Hauts', 'Pantalons', 'Vestes', 'Maillots de bain'] },
          { slug: 'homme', label: '👔 Homme', subs: ['Chemises', 'Pantalons', 'T-shirts', 'Vestes', 'Costumes'] },
          { slug: 'enfants', label: '👶 Enfants', subs: ['Bébé 0-2 ans', 'Fille 3-12 ans', 'Garçon 3-12 ans', 'Jouets', 'École'] },
          { slug: 'chaussures', label: '👟 Chaussures', subs: ['Sneakers', 'Talons', 'Sandales', 'Bottes', 'Sport'] },
          { slug: 'sacs', label: '👜 Sacs', subs: ['Sacs à main', 'Sacs à dos', 'Portefeuilles', 'Valises'] },
          { slug: 'beaute', label: '💄 Beauté', subs: ['Maquillage', 'Soins visage', 'Parfums', 'Cheveux'] },
          { slug: 'maison', label: '🏠 Maison', subs: ['Décoration', 'Cuisine', 'Linge', 'Rangement'] },
          { slug: 'electronique', label: '📱 Tech', subs: ['Smartphones', 'Écouteurs', 'Accessoires', 'Gadgets'] },
          { slug: 'bijoux', label: '💍 Bijoux', subs: ['Colliers', 'Boucles', 'Bracelets', 'Montres'] },
          { slug: 'sport', label: '🏃 Sport', subs: ['Vêtements sport', 'Équipements', 'Chaussures sport'] },
        ]

        const merged = data.map(dbCat => {
          const h = hardcoded.find(x => x.slug === dbCat.slug)
          return {
            slug: dbCat.slug,
            label: dbCat.name, // Use DB name (which might have emoji already)
            subs: h ? h.subs : []
          }
        })
        setCategories(merged)
      }
    }
    loadCategories()
  }, [])


  return (
    <header className="relative md:sticky top-0 z-50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      {/* ── TOP BAR (Trust signals) ── */}
      <div className="bg-gray-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 hidden md:flex">
            <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-secondary"/><span>🚚 Livraison gratuite dès {getSetting('free_shipping_threshold', 100)}$</span></div>
            <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-secondary"/><span>🔒 Paiement 100% sécurisé</span></div>
            <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-secondary"/><span>📦 Retours faciles 30 jours</span></div>
          </div>
          <div className="md:hidden text-center w-full text-[10px] sm:text-xs px-2 truncate sm:whitespace-normal">🚚 Livraison gratuite +{getSetting('free_shipping_threshold', 100)}$ | 🔒 Paiement sécurisé</div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-secondary"/><span>Support 24/7</span></div>
            <Link href="/track" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors ml-2 border-l border-gray-700 pl-4">
              <Truck className="w-3.5 h-3.5 text-primary"/>
              <span>Suivre commande</span>
            </Link>
            
            {/* Devise active */}
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 text-gray-200 text-[11px] font-bold rounded-lg px-2 py-1 focus-within:border-primary focus-within:text-white transition-all ml-2">
              <span className="text-xs">{SUPPORTED_CURRENCIES.find(c => c.code === currency)?.flag || '🇺🇸'}</span>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-gray-200 font-bold focus:outline-none cursor-pointer pr-1 text-[11px]"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code} className="bg-gray-900 text-white font-bold">
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-4">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group order-1">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Missa Shop Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="leading-none">
                <span className="font-black text-lg md:text-xl text-primary">
                  {getSetting('site_name', 'Missa Shop').split(' ')[0]}
                </span>
                <span className="font-black text-lg md:text-xl text-secondary">
                  {getSetting('site_name', 'Missa Shop').split(' ')[1] || ''}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                {getSetting('site_tagline', 'MODE & LIFESTYLE PREMIUM')}
              </p>
            </div>
          </Link>

          <div className="w-full md:w-auto md:flex-1 max-w-2xl order-3 md:order-2">
            <SmartSearchBar
              placeholder="Rechercher des produits, catégories..."
            />
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 order-2 md:order-3">
            <Link href="/wishlist" className="hidden md:flex flex-col items-center p-2 hover:bg-gray-50 rounded-xl transition-colors relative group"><div className="relative"><Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors"/>{wishCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">{wishCount}</span>}</div><span className="text-[10px] text-gray-500 mt-0.5 font-medium">Favoris</span></Link>
            
            {/* Cart Button with label on desktop, icon only on mobile (since we have bottom nav) */}
            <button onClick={toggleCart} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white p-2 md:px-4 md:py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 active:scale-95 group">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 md:w-5 md:h-5"/>
                {count > 0 && <span className="absolute -top-2.5 -right-2.5 w-4 h-4 md:w-5 md:h-5 bg-yellow-400 text-gray-900 text-[10px] md:text-xs font-black rounded-full flex items-center justify-center border-2 border-primary">{count > 9 ? '9+' : count}</span>}
              </div>
              <div className="hidden md:block text-left"><p className="text-[10px] leading-none opacity-80">Mon panier</p><p className="font-black text-sm leading-tight">{formatPrice(total)}</p></div>
            </button>
            
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-gray-50 rounded-xl text-gray-700">{menuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}</button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile Grid (hidden on desktop) */}
          <div className="md:hidden grid grid-cols-2 gap-2 py-3">
            {categories.slice(0, 6).map(cat => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-primary/5 hover:text-primary rounded-xl text-[10px] font-black text-gray-700 transition-colors border border-transparent active:border-primary/20"
              >
                <span className="text-sm">{cat.label.split(' ')[0]}</span>
                <span className="truncate">{cat.label.replace(/^.\s/, '')}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Nav (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-0.5 relative flex-wrap py-1">
            <Link href="/catalog" className="flex items-center gap-2 px-3 py-2 bg-primary text-white font-black text-[10px] uppercase rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0 mr-1 shadow-sm">
              <Menu className="w-3.5 h-3.5"/>
              Toutes
            </Link>
            
            {/* Top 7 Main Categories */}
            {categories.slice(0, 7).map(cat => (
              <div key={cat.slug} className="relative group" onMouseEnter={() => setActiveCategory(cat.slug)} onMouseLeave={() => setActiveCategory(null)}>
                <Link 
                  href={`/category/${cat.slug}`} 
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-gray-700 hover:text-primary hover:bg-primary/5 transition-all whitespace-nowrap rounded-lg border-b-2 border-transparent hover:border-primary/30"
                >
                  {cat.label}<ChevronDown className="w-3 h-3 opacity-50"/>
                </Link>
                {activeCategory === cat.slug && (
                  <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 min-w-[220px] z-50 mt-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-3">Sous-catégories</p>
                    {cat.subs.map((sub: string) => (
                      <Link 
                        key={sub} 
                        href={`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`} 
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors font-medium"
                      >
                        {sub}
                      </Link>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <Link href={`/category/${cat.slug}`} className="block px-3 py-2 text-sm text-primary font-black hover:bg-primary/5 rounded-xl">
                        Tout explorer →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* "Plus" Dropdown for the rest */}
            {categories.length > 7 && (
              <div className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors whitespace-nowrap">
                  Plus
                  <ChevronDown className="w-3 h-3"/>
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-4 py-1">Autres Rayons</p>
                  {categories.slice(7).map(cat => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link href="/catalog?sale=true" className="ml-auto px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap flex items-center gap-1 rounded-lg">
              🔥 Promotions
            </Link>
          </nav>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg max-h-96 overflow-y-auto">
          <div className="p-4 space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">Catalogue Complet</p>
            {categories.map(cat => (
              <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-3.5 px-4 text-gray-800 hover:text-primary hover:bg-primary/5 rounded-2xl font-bold border-b border-gray-50 last:border-0 transition-all">
                <span className="flex items-center gap-3">
                  <span className="text-xl">{cat.label.split(' ')[0]}</span>
                  {cat.label.replace(/^.\s/, '')}
                </span>
                <ChevronDown className="w-4 h-4 opacity-30 -rotate-90"/>
              </Link>
            ))}
            <Link href="/catalog?sale=true" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 px-4 text-red-600 font-black bg-red-50 rounded-2xl mt-4 shadow-sm">
              <span>🔥 Promotions du jour</span>
              <ArrowRight className="w-4 h-4"/>
            </Link>

            {/* Currency Selector inside Mobile Menu */}
            <div className="pt-4 mt-4 border-t border-gray-100 px-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Devise et Région</p>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span>{SUPPORTED_CURRENCIES.find(c => c.code === currency)?.flag || '🇺🇸'}</span>
                  <span>Devise active : {currency}</span>
                </span>
                <select 
                  value={currency} 
                  onChange={(e) => { setCurrency(e.target.value); setMenuOpen(false) }}
                  className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary cursor-pointer shadow-sm"
                >
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

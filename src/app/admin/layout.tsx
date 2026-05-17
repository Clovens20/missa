'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Image, BarChart3, Settings, LogOut, Menu, X, ChevronRight, Shield, Bell, ExternalLink, Megaphone, FileText, UserCog, Activity, Building2, Globe, Star, Zap, Share2, Mail
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [notifications, setNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingReviews, setPendingReviews] = useState(0)

  useEffect(() => {
    loadAdmin()
    loadNotifications()
  }, [])

  async function loadAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      if (pathname !== '/admin/login') {
        router.push('/admin/login')
      }
      return
    }

    // Rediriger vers le dashboard si déjà connecté et sur la page de login
    if (pathname === '/admin/login') {
      router.push('/admin')
      return
    }
    const { data } = await supabase.from('admin_users').select('*').eq('email', user.email).single()
    if (!data) {
      router.push('/admin/login')
      return
    }
    setAdmin(data)
  }

  async function loadNotifications() {
    const { count: orderCount } = await supabase
      .from('guest_orders')
      .select('*', { count: 'exact', head: true })
      .in('order_status', ['pending', 'confirmed'])
    setNotifications(orderCount || 0)

    const { count: reviewCount } = await supabase
      .from('product_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingReviews(reviewCount || 0)

    const { count: messageCount } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
    setUnreadMessages(messageCount || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    document.cookie = 'missa-admin-token=; max-age=0; path=/'
    router.push('/admin/login')
  }

  const isSuperAdmin = admin?.role === 'super_admin'

  const navSections = [
    {
      title: 'Principal',
      items: [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', permission: null },
        { href: '/admin/orders', icon: ShoppingCart, label: 'Commandes', badge: notifications, permission: 'orders' },
        { href: '/admin/products', icon: Package, label: 'Produits', permission: 'products' },
        { href: '/admin/inventaire', icon: Package, label: 'Inventaire', permission: 'products' },
        { href: '/admin/abandoned-carts', icon: ShoppingCart, label: 'Paniers abandonnés', permission: 'orders' },
        { href: '/admin/customers', icon: Users, label: 'Clients', permission: 'customers' },
        { href: '/admin/messages', icon: Mail, label: 'Messages Contact', badge: unreadMessages, permission: null },
        { href: '/admin/subscribers', icon: Bell, label: 'Abonnés & Alertes', permission: 'products' },
      ]
    },
    {
      title: 'Boutique',
      items: [
        { href: '/admin/categories', icon: Tag, label: 'Catégories', permission: 'categories' },
        { href: '/admin/bundles', icon: Package, label: 'Bundles', permission: 'products' },
        { href: '/admin/banners', icon: Image, label: 'Bannières', permission: 'banners' },
        { href: '/admin/coupons', icon: Megaphone, label: 'Coupons', permission: 'coupons' },
        { href: '/admin/dropshipping', icon: Globe, label: 'Dropshipping CJ', permission: 'products' },
        { href: '/admin/products/stock', icon: Package, label: 'Stock CJ', permission: 'products' },
        { href: '/admin/reviews', icon: Star, label: 'Avis clients', badge: pendingReviews, permission: 'products' },
        { href: '/admin/analytics', icon: BarChart3, label: 'Analytique', permission: 'analytics' },
        { href: '/admin/pixels', icon: Zap, label: 'Pixels & Tracking', permission: 'analytics' },
      ]
    },
    {
      title: 'Revenue+',
      items: [
        { href: '/admin/affiliates', icon: Users, label: 'Affiliés', permission: 'analytics' },
        { href: '/admin/wholesale', icon: Building2, label: 'Wholesale B2B', permission: 'analytics' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { href: '/admin/sub-admins', icon: UserCog, label: 'Sous-admins', permission: 'sub_admins', superOnly: true },
        { href: '/admin/activity', icon: Activity, label: 'Activité', permission: null, superOnly: true },
        { href: '/admin/settings/social-links', icon: Share2, label: 'Réseaux Sociaux', permission: 'settings' },
        { href: '/admin/settings/footer', icon: Settings, label: 'Footer & Légal', permission: 'settings' },
        { href: '/admin/settings', icon: Settings, label: 'Paramètres', permission: 'settings', highlight: true },
      ]
    }
  ]

  function canAccess(item: any) {
    if (item.superOnly && !isSuperAdmin) return false
    if (!item.permission) return true
    if (isSuperAdmin) return true
    return admin?.permissions?.[item.permission] === true
  }

  if (!admin) {
    if (pathname === '/admin/login') {
      return <div className="min-h-screen bg-gray-950">{children}</div>
    }
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
  }

  // Si on est sur la page de login mais déjà "admin", on ne rend rien (la redirection va s'opérer)
  if (pathname === '/admin/login') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 z-50 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-800 h-16">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30"><Shield className="w-5 h-5 text-white"/></div>
          {sidebarOpen && <div className="min-w-0"><p className="font-black text-white text-sm leading-none"><span className="text-primary">Missa</span><span className="text-secondary">Shop</span></p><p className="text-gray-500 text-[10px] mt-0.5">Administration</p></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-gray-500 hover:text-white transition-colors flex-shrink-0">{sidebarOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}</button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-custom">
          {navSections.map(section => (
            <div key={section.title} className="mb-6">
              {sidebarOpen && <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4 mb-2">{section.title}</p>}
              <div className="space-y-0.5 px-2">
                {section.items.filter(canAccess).map(item => {
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  const highlight = (item as any).highlight
                  const badge = (item as any).badge
                  return (
                    <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${highlight ? active ? 'bg-primary/20 text-primary' : 'text-primary hover:bg-primary/10' : active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${highlight ? 'text-primary' : ''}`}/>
                      {sidebarOpen && <><span className="font-medium text-sm flex-1">{item.label}</span>{badge && badge > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>}{active && <ChevronRight className="w-4 h-4 opacity-50"/>}</>}
                      {!sidebarOpen && <div className="absolute left-full ml-2 bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">{item.label}</div>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm">{admin?.full_name?.[0] || admin?.email?.[0] || 'A'}</div>
            {sidebarOpen && <div className="min-w-0 flex-1"><p className="text-white font-bold text-xs truncate">{admin?.full_name || 'Administrateur'}</p><p className={`text-[10px] font-semibold ${isSuperAdmin ? 'text-primary' : 'text-gray-500'}`}>{isSuperAdmin ? '👑 Super Admin' : '🔑 Sub Admin'}</p></div>}
          </div>
          {sidebarOpen && <div className="flex gap-2"><a href="/" target="_blank" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs font-medium transition-colors"><ExternalLink className="w-3.5 h-3.5"/>Voir le site</a><button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"><LogOut className="w-3.5 h-3.5"/>Déconnexion</button></div>}
          {!sidebarOpen && <button onClick={handleLogout} className="w-full p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center"><LogOut className="w-5 h-5"/></button>}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">Admin</span><ChevronRight className="w-4 h-4 text-gray-600"/><span className="text-white font-semibold capitalize">{pathname.split('/admin')[1]?.split('/')[1] || 'Dashboard'}</span></div>
          <div className="flex items-center gap-3">
            {notifications > 0 && <Link href="/admin/orders" className="relative p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"><Bell className="w-5 h-5 text-gray-400"/><span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{notifications}</span></Link>}
            <Link href="/admin/settings" className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-xl text-sm font-bold transition-colors"><Settings className="w-4 h-4"/>Paramètres</Link>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-gray-950">{children}</div>
      </main>
    </div>
  )
}

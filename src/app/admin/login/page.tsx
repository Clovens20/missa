'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 1. Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // 2. Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()
      
      if (!adminUser) {
        await supabase.auth.signOut()
        throw new Error('Accès admin non autorisé')
      }

      // 3. Set admin cookie
      document.cookie = `missa-admin-token=${data.session?.access_token}; path=/; max-age=86400; SameSite=Strict`

      // 4. Update last login
      await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('email', email)

      // 5. Log the action
      await supabase.from('admin_logs').insert({
        admin_email: email,
        action: 'LOGIN',
        details: { role: adminUser.role }
      })

      toast.success(`Bienvenue ${adminUser.full_name}!`)
      router.push('/admin')
      
    } catch (err: any) {
      toast.error(err.message || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/40">
            <ShieldCheck className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-2xl font-black text-white">Missa Shop Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Accès réservé aux administrateurs</p>
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Email administrateur</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@missashopp.com" className="w-full pl-12 pr-4 py-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" required/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" required/>
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPwd ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black text-base rounded-xl transition-all shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><ShieldCheck className="w-5 h-5"/>Accéder au panneau admin</>}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-800 text-center">
            <a href="/" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← Retour au site</a>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">🔒 Connexion sécurisée SSL</p>
      </motion.div>
    </div>
  )
}

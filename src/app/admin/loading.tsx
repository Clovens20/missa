import { 
  Loader2, Activity, 
  ShieldCheck, Database 
} from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="min-h-[80vh] flex 
      flex-col items-center justify-center 
      gap-6">
      
      <div className="relative">
        <div className="w-20 h-20 border-4 
          border-gray-800 border-t-primary 
          rounded-2xl animate-spin"/>
        <div className="absolute inset-0 
          flex items-center justify-center">
          <Activity className="w-8 h-8 
            text-primary animate-pulse"/>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-black 
          text-white tracking-tight">
          Admin Dashboard
        </h2>
        <p className="text-gray-500 text-sm 
          font-medium mt-1">
          Synchronisation des données...
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 
        mt-4">
        <div className="bg-gray-900 
          border border-gray-800 
          px-4 py-2 rounded-xl 
          flex items-center gap-2">
          <Database className="w-4 h-4 
            text-blue-400"/>
          <span className="text-[10px] 
            font-bold text-gray-400">
            SUPABASE CONNECTED
          </span>
        </div>
        <div className="bg-gray-900 
          border border-gray-800 
          px-4 py-2 rounded-xl 
          flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 
            text-emerald-400"/>
          <span className="text-[10px] 
            font-bold text-gray-400">
            SECURE ACCESS
          </span>
        </div>
      </div>
    </div>
  )
}

import { 
  Loader2, ShoppingBag, 
  BarChart3, Zap 
} from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed bottom-4 right-4 bg-white/90 
      backdrop-blur-md shadow-2xl rounded-2xl p-4 z-[100] 
      flex flex-col items-center justify-center gap-3 
      border border-gray-100 max-w-[200px] scale-75 origin-bottom-right">
      
      {/* Animated logo/loader */}
      <div className="relative">
        <div className="w-16 h-16 border-4 
          border-primary/20 border-t-primary 
          rounded-full animate-spin"/>
        <div className="absolute inset-0 
          flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 
            text-primary animate-bounce"/>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-black 
          text-gray-900 tracking-tight">
          Missa<span className="text-primary">Shop</span>
        </h2>
        <p className="text-gray-500 text-xs 
          font-bold uppercase tracking-widest 
          mt-1 animate-pulse">
          Chargement ultra-rapide...
        </p>
      </div>

      {/* Speed signals */}
      <div className="flex gap-8 mt-8 
        text-gray-400">
        <div className="flex items-center 
          gap-2">
          <Zap className="w-4 h-4 text-orange-400"/>
          <span className="text-[10px] font-bold">
            TURBO ENGINE
          </span>
        </div>
        <div className="flex items-center 
          gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400"/>
          <span className="text-[10px] font-bold">
            DATA STREAMING
          </span>
        </div>
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // On essaie d'upsert la donnée en contournant la politique de sécurité (RLS)
    const { error } = await supabase.from('abandoned_carts').upsert(data, {
      onConflict: 'session_id'
    })

    if (error) {
      console.error('Failed to upsert with session_id, fallback to customer_email...', error)
      // Si onConflict session_id échoue (par exemple si la table n'a pas cette contrainte unique)
      // on tente avec l'autre contrainte connue
      const { error: fallbackErr } = await supabase.from('abandoned_carts').upsert(data, {
        onConflict: 'customer_email,recovered'
      })
      
      if (fallbackErr) {
         // Si ça échoue encore, on fait un simple update s'il existe, sinon insert
         console.error('Fallback failed too:', fallbackErr)
         return NextResponse.json({ error: fallbackErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API abandoned cart error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

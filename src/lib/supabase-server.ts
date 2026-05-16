import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Service Role Client for server-side operations (bypasses RLS)
// USE WITH CAUTION: Only in API routes or server actions
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

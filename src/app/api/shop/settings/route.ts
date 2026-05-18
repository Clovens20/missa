import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
  
  const settings: Record<string, any> = {}
  data?.forEach(row => {
    // Values are stored as JSON strings in some cases, or just strings
    try {
      settings[row.key] = JSON.parse(row.value)
    } catch {
      settings[row.key] = row.value
    }
  })

  return NextResponse.json(
    { data: settings },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    }
  )
}

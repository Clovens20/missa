import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('footer_settings')
    .select('*')
  
  const map: Record<string, any> = {}
  data?.forEach(row => {
    map[row.key] = row.value
  })

  return NextResponse.json(
    { data: map },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    }
  )
}

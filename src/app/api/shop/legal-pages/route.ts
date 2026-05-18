import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('legal_pages')
    .select('slug, title, show_in_footer')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return NextResponse.json(
    { data: data || [] },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    }
  )
}

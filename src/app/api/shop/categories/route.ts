import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null)

  const categories = [
    ...new Set(
      data?.map(p => p.category)
        .filter(Boolean)
    )
  ].sort()

  return NextResponse.json({ categories })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'Baskets en toile'

  const { data: products } = await supabase
    .from('products')
    .select('name, colors, sizes, variants')
    .ilike('name', `%${query}%`)
    .limit(1)

  return NextResponse.json(products)
}

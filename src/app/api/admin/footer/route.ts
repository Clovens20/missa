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
  return NextResponse.json({ data: map })
}

export async function PATCH(req: Request) {
  const { key, value } = await req.json()
  const { data, error } = await supabase
    .from('footer_settings')
    .upsert({
      key, value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
    .select().single()
  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )
  return NextResponse.json({ data })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PIXEL_ROW_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const { data } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('id', PIXEL_ROW_ID)
    .single()
  
  return NextResponse.json(data || {})
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const { error } = await supabase
      .from('tracking_pixels')
      .upsert({
        id: PIXEL_ROW_ID,
        ...body,
        updated_at: new Date().toISOString(),
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

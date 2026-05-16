import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('legal_pages')
    .select('*')
    .order('display_order', { ascending: true })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('legal_pages')
    .insert(body)
    .select().single()
  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json()
  const { data, error } = await supabase
    .from('legal_pages')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select().single()
  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )
  return NextResponse.json({ data })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await supabase
    .from('legal_pages')
    .delete().eq('id', id)
  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all social links
export async function GET() {
  const { data, error } = await supabase
    .from('social_links')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )

  return NextResponse.json({ data })
}

// POST create new
export async function POST(req: Request) {
  const body = await req.json()
  const { platform, label, url, is_active, display_order } = body

  if (!platform || !url) {
    return NextResponse.json(
      { error: 'platform and url required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('social_links')
    .insert({
      platform: platform.toLowerCase(),
      label: label || platform,
      url,
      is_active: is_active ?? true,
      display_order: display_order || 99,
    })
    .select()
    .single()

  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )

  return NextResponse.json({ data }, { status: 201 })
}

// PATCH update
export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json(
    { error: 'id required' },
    { status: 400 }
  )

  const { data, error } = await supabase
    .from('social_links')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )

  return NextResponse.json({ data })
}

// DELETE
export async function DELETE(req: Request) {
  const { id } = await req.json()

  if (!id) return NextResponse.json(
    { error: 'id required' },
    { status: 400 }
  )

  const { error } = await supabase
    .from('social_links')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json(
    { error: error.message },
    { status: 500 }
  )

  return NextResponse.json({ success: true })
}

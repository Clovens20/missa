import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: Request) {
  try {
    const { bucket, filename } = await req.json()

    if (!bucket || !filename) {
      return NextResponse.json(
        { error: 'Missing params' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([filename])

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

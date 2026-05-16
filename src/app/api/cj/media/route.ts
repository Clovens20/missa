import { NextResponse } from 'next/server'
import { getCJProductMedia, getAllProductVariants } 
  from '@/lib/cj-api'

export async function GET(
  request: Request
) {
  try {
    const { searchParams } = 
      new URL(request.url)
    const pid = searchParams.get('pid')
    
    if (!pid) {
      return NextResponse.json(
        { error: 'pid required' },
        { status: 400 }
      )
    }

    const [media, variants] = await Promise.all([
      getCJProductMedia(pid),
      getAllProductVariants(pid)
    ])
    
    return NextResponse.json({
      ...media,
      variants
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

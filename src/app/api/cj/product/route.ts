import { NextResponse } from 'next/server'
import { getCJProductDetail } from '@/lib/cj-api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pid = searchParams.get('pid')
    
    if (!pid) {
      return NextResponse.json(
        { error: 'pid required' },
        { status: 400 }
      )
    }

    const product = await getCJProductDetail(pid)
    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

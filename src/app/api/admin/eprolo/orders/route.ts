import { NextResponse } from 'next/server'
import { getEproloOrders, createEproloOrder } from '@/lib/eprolo'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = parseInt(searchParams.get('status') || '0')
    const page = parseInt(searchParams.get('page') || '1')
    const page_size = parseInt(searchParams.get('page_size') || '20')

    const data = await getEproloOrders(status, page, page_size)
    
    if (data.code !== '0' && data.code !== 0) {
      throw new Error(data.msg || 'Failed to fetch Eprolo orders')
    }

    return NextResponse.json({
      success: true,
      data: data.data
    })
  } catch (error: any) {
    console.error('Eprolo Orders GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // We assume the body matches the orderData format expected by createEproloOrder
    const data = await createEproloOrder(body)
    
    if (data.code !== '0' && data.code !== 0) {
      throw new Error(data.msg || 'Failed to create Eprolo order')
    }

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Commande Eprolo créée avec succès'
    })
  } catch (error: any) {
    console.error('Eprolo Orders POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

// MOCK SEARCH FOR EPROLO
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const mockProducts = [
      {
        id: 'ep_' + Math.random().toString(36).substring(7),
        name: `${q} - Eco Eprolo Source`,
        price: 9.90,
        stock: 300,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
        supplier: 'eprolo'
      }
    ]

    return NextResponse.json({
      success: true,
      products: mockProducts
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

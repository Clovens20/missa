import { NextResponse } from 'next/server'

// MOCK SEARCH FOR HYPERSKU
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const mockProducts = [
      {
        id: 'hyper_' + Math.random().toString(36).substring(7),
        name: `${q} - Global HyperSKU`,
        price: 11.20,
        stock: 1200,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        supplier: 'hypersku'
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

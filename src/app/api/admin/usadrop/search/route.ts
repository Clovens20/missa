import { NextResponse } from 'next/server'

// MOCK SEARCH FOR USADROP
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    // In a real app, this would call USAdrop API
    // Here we return mock results for demonstration
    const mockProducts = [
      {
        id: 'usa_' + Math.random().toString(36).substring(7),
        name: `${q} - Premium USAdrop`,
        price: 12.50,
        stock: 500,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
        supplier: 'usadrop'
      },
      {
        id: 'usa_' + Math.random().toString(36).substring(7),
        name: `${q} - Fast Shipping USA`,
        price: 14.00,
        stock: 250,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80',
        supplier: 'usadrop'
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

import { NextResponse } from 'next/server'
import { getEproloProductList } from '@/lib/eprolo'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    // Eprolo documentation says page starts at 0 or 1, we map it accordingly
    const page_index = page > 0 ? page - 1 : 0
    const page_size = 20

    const data = await getEproloProductList(page_index, page_size)
    
    if (data.code !== '0' && data.code !== 0) {
      throw new Error(data.msg || 'Failed to fetch Eprolo catalog')
    }

    const rawList = data.data || []
    
    const mappedList = rawList.map((prod: any) => ({
      pid: prod.id,
      productName: prod.title,
      productImage: prod.imagefirst,
      productPrice: parseFloat(prod.variantlist?.[0]?.cost || '0'),
      supplier: 'eprolo',
      // We pass the raw data so UI can show it if needed
      _eproloData: prod
    }))

    return NextResponse.json({
      success: true,
      list: mappedList,
      total: mappedList.length === page_size ? page * page_size + 1 : page * page_size // Mocking total since API doesn't seem to provide total count in root
    })
  } catch (error: any) {
    console.error('Eprolo Catalog Route Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

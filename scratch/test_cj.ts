import { searchCJProducts } from '../src/lib/cj-api'

async function testSearch() {
  console.log('Testing CJ Search...')
  try {
    const results = await searchCJProducts({
      productName: '', 
      pageSize: 1
    })
    
    console.log('Results count:', results?.list?.length || 0)
    if (results?.list?.length > 0) {
      console.log('Full First product:', JSON.stringify(results.list[0], null, 2))
    } else {
      console.log('No results found.')
    }
  } catch (err) {
    console.error('Search failed:', err)
  }
}

testSearch()

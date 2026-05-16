const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRoutes() {
  console.log('--- CATEGORIES ---')
  const { data: categories } = await supabase.from('categories').select('id, name, slug')
  console.table(categories)

  console.log('--- PRODUCTS ---')
  const { data: products } = await supabase.from('products').select('id, name, slug').limit(10)
  console.table(products)

  console.log('--- DROPSHIP PRODUCTS ---')
  const { data: dropship } = await supabase.from('dropship_products').select('id, name, slug').limit(10)
  console.table(dropship)
}

checkRoutes()

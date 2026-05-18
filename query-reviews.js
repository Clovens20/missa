const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const productId = 'f218a9cb-8ac6-4a07-a344-cc9752877bf6';
  
  // 1. Fetch product
  const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
  console.log('PRODUCT IN products:', JSON.stringify(product));

  // 2. Fetch reviews
  const { data: reviews } = await supabase.from('product_reviews').select('*').eq('product_id', productId);
  console.log(`REVIEWS COUNT: ${reviews.length}`);
  console.log('REVIEWS:', JSON.stringify(reviews.slice(0, 3), null, 2));
}

run();

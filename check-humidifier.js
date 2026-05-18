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
  const { data: prod } = await supabase.from('products').select('id, name, rating, review_count, review_avg').eq('id', productId).single();
  console.log('PRODUCT STATS IN products:', prod);

  const { data: drop } = await supabase.from('dropship_products').select('id, name, rating, review_count').eq('id', productId).single();
  console.log('PRODUCT STATS IN dropship_products:', drop);
}

run();

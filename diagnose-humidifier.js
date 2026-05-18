const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const pid = 'f218a9cb-8ac6-4a07-a344-cc9752877bf6';

  const { data: p } = await supabase.from('products').select('*').eq('id', pid).single();
  console.log('1. Product exists:', !!p);

  const { count, error } = await supabase
    .from('product_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', pid);

  console.log('2. Review count in DB:', count, 'Error:', error);

  const { data: allReviews } = await supabase
    .from('product_reviews')
    .select('id, product_id, body');
  
  console.log('3. All product reviews count:', allReviews.length);
  
  const matches = allReviews.filter(r => r.product_id === pid);
  console.log('4. Matching reviews for pid:', matches.length);
}

run();

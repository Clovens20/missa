const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: reviews, error } = await supabase.from('product_reviews').select('product_id, status');
  if (error) {
    console.error('Database Error:', error);
    return;
  }
  console.log(`TOTAL REVIEWS IN product_reviews: ${reviews.length}`);
  
  // Group by product_id
  const groups = {};
  for (const r of reviews) {
    groups[r.product_id] = (groups[r.product_id] || 0) + 1;
  }
  
  for (const pid in groups) {
    const { data: prod } = await supabase.from('products').select('name').eq('id', pid).single();
    console.log(`- Product: ${prod ? prod.name : 'Unknown'} (ID: ${pid}) has ${groups[pid]} reviews`);
  }
}

run();

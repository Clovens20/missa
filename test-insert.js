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

  const reviewsToInsert = [
    {
      product_id: pid,
      customer_name: "Test Customer",
      rating: 5,
      title: "Test Review",
      body: "This is a test review body.",
      status: 'approved',
      is_verified: true,
      helpful_count: 0
    }
  ];

  const { data, error } = await supabase.from('product_reviews').insert(reviewsToInsert).select();
  console.log('Insert Result:', data, 'Error:', error);
}

run();

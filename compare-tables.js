const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: prods } = await supabase.from('products').select('id');
  const prodIds = new Set(prods.map(p => p.id));

  const { data: drops } = await supabase.from('dropship_products').select('id, name');
  console.log(`Checking ${drops.length} dropship products...`);

  let missingCount = 0;
  for (const d of drops) {
    if (!prodIds.has(d.id)) {
      console.log(`MISSING PRODUCT IN products TABLE: ID: ${d.id}, Name: ${d.name}`);
      missingCount++;
    }
  }

  if (missingCount === 0) {
    console.log('ALL dropship products are already present in the products table! Perfect synchronization.');
  } else {
    console.log(`Found ${missingCount} missing products.`);
  }
}

run();

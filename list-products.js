const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: products } = await supabase.from('products').select('id, name, description');
  console.log(`TOTAL PRODUCTS IN products: ${products.length}`);
  for (const p of products) {
    console.log(`- ID: ${p.id}, NAME: ${p.name}`);
    console.log(`  DESC: ${p.description ? p.description.substring(0, 100) : 'null'}`);
  }

  const { data: dropship } = await supabase.from('dropship_products').select('id, name, description');
  console.log(`TOTAL PRODUCTS IN dropship_products: ${dropship.length}`);
  for (const p of dropship) {
    console.log(`- ID: ${p.id}, NAME: ${p.name}`);
    console.log(`  DESC: ${p.description ? p.description.substring(0, 100) : 'null'}`);
  }
}

run();

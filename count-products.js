const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: prods } = await supabase.from('products').select('id, name, is_dropship, price');
  console.log(`TOTAL IN products: ${prods.length}`);
  prods.forEach(p => console.log(`- products ID: ${p.id}, name: ${p.name.substring(0, 30)}, is_dropship: ${p.is_dropship}, price: ${p.price}`));

  const { data: drops } = await supabase.from('dropship_products').select('id, name, is_dropship, price');
  console.log(`TOTAL IN dropship_products: ${drops.length}`);
  drops.forEach(d => console.log(`- dropship_products ID: ${d.id}, name: ${d.name.substring(0, 30)}, is_dropship: ${d.is_dropship}, price: ${d.price}`));
}

run();

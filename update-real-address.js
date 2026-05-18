const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const realAddress = {
    address: '12 Rue Santoire, Apt 4',
    city: 'Salaberry-de-Valleyfield',
    state: 'QC',
    zip: 'J6S 2X2',
    country: 'CA'
  };

  // Update in guest_orders
  const { data: gData, error: gErr } = await supabase
    .from('guest_orders')
    .update({ shipping_address: realAddress })
    .eq('order_number', 'MS-75775957')
    .select('*');
  console.log('Update guest_orders:', gData, gErr);

  // Update in legacy orders table
  const { data: oData, error: oErr } = await supabase
    .from('orders')
    .update({ shipping_address: realAddress })
    .eq('order_number', 'MS-75775957')
    .select('*');
  console.log('Update orders:', oData, oErr);
}

run();

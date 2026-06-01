const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envStr = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envStr.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, colors, sizes, variants')
    .ilike('name', '%Baskets en toile%')
    .limit(1);
    
  if (error) {
    console.error(error);
  } else {
    fs.writeFileSync('debug-product-output.json', JSON.stringify(data, null, 2));
    console.log("WROTE TO debug-product-output.json");
  }
}

run();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: prods, error: err } = await supabase.from('products').select('*').limit(1);
  if (err) console.error(err);
  else console.log('Products columns:', Object.keys(prods[0] || {}));
}

check();

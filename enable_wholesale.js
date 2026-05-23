const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function enableWholesale() {
  const { error } = await supabase.from('site_settings').update({ value: 'true' }).eq('key', 'feature_wholesale');
  if (error) console.error('Error:', error.message);
  else console.log('feature_wholesale updated successfully');
}

enableWholesale();

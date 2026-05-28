import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email, source, product } = await req.json();
  
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

  // Save lead to Supabase
  const { error } = await supabase.from('leads').upsert({
    email: email.toLowerCase().trim(),
    source: source || 'unknown',
    product_interest: product,
    captured_at: new Date().toISOString(),
  }, { onConflict: 'email' });

  if (error) {
    console.error('Error saving lead:', error);
    return Response.json({ error: 'Failed to save lead' }, { status: 500 });
  }

  return Response.json({ success: true });
}

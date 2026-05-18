const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fdoiideysifrcvchtqdn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lpZGV5c2lmcmN2Y2h0cWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2MjU2MSwiZXhwIjoyMDg2ODM4NTYxfQ.zzKiN7hrb-exwxqZW43uzjGJO8CJkJWY5MT74vaMBv0'
);

async function check() {
  const prodId = '75242223-a5f1-4555-8a55-64f5b8bd1141';
  console.log(`Attempting to insert a review for product_id: ${prodId}`);
  
  const testReview = {
    product_id: prodId,
    customer_name: "Test User",
    rating: 5,
    title: "Super",
    body: "Excellent produit et tres rapide !",
    status: 'approved',
    is_verified: true,
    helpful_count: 0
  };

  const { data, error } = await supabase
    .from('product_reviews')
    .insert([testReview])
    .select();

  if (error) {
    console.error("❌ Review insertion failed:", error);
  } else {
    console.log("✅ Review inserted successfully:", data);
  }
}

check();

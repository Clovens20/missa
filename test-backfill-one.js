const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { generateFakeReviewsForProduct } = require('./src/lib/fake-reviews');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const productId = 'f218a9cb-8ac6-4a07-a344-cc9752877bf6';

  const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
  console.log('Product details:', product.name);

  const { count, error } = await supabase
    .from('product_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);
    
  console.log(`Reviews count in DB: ${count}, error:`, error);

  if (count === 0 || count === null) {
    console.log('Generating reviews...');
    const contextStr = `${product.name} humidifier`;
    const fakeReviewsData = generateFakeReviewsForProduct(productId, contextStr);
    
    console.log(`Generated ${fakeReviewsData.reviews.length} reviews`);
    
    const { error: insertError } = await supabase.from('product_reviews').insert(fakeReviewsData.reviews);
    console.log('Insert error:', insertError);

    const { error: updateError } = await supabase.from('products').update({
      rating: fakeReviewsData.reviewAvg,
      review_avg: fakeReviewsData.reviewAvg,
      review_count: fakeReviewsData.reviewCount
    }).eq('id', productId);
    console.log('Update products error:', updateError);

    const { error: updateDropError } = await supabase.from('dropship_products').update({
      rating: fakeReviewsData.reviewAvg,
      review_count: fakeReviewsData.reviewCount
    }).eq('id', productId);
    console.log('Update dropship_products error:', updateDropError);
  } else {
    console.log('Product already has reviews in DB. Skiping...');
  }
}

run();

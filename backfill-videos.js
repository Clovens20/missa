const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read env variables from .env.local
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value.length) acc[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const CJ_API_KEY = env.CJ_API_KEY;

if (!CJ_API_KEY) {
  console.error('❌ Error: CJ_API_KEY is missing in .env.local');
  process.exit(1);
}

// Helper delay to respect rate limit
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 2. Fetch CJ access token
async function getCJToken() {
  console.log('🔑 Authenticating with CJ Dropshipping...');
  try {
    const res = await fetch(
      'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: CJ_API_KEY })
      }
    );
    const data = await res.json();
    if (data.code === 200 && data.data) {
      console.log('✅ Connected! CJ token obtained.');
      return data.data.accessToken;
    }
    throw new Error(data.message || 'Unknown authentication error');
  } catch (err) {
    console.error('💥 Failed to authenticate with CJ:', err.message);
    process.exit(1);
  }
}

// 3. Query CJ product details to find video
async function fetchProductVideo(pid, token) {
  // Retry up to 3 times in case of transient rate limit or network issues
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token
          }
        }
      );
      const data = await res.json();
      if (data.code === 200 && data.data) {
        const detail = data.data;
        return detail.productVideo || detail.video || null;
      }
      if (data.code === 1600200 || data.message?.includes('Limit') || data.message?.includes('Too Many')) {
        console.warn(`⏳ Rate limit reached. Waiting 2s before retry (Attempt ${attempt}/3)...`);
        await delay(2000);
        continue;
      }
      console.warn(`⚠️ CJ API returned code ${data.code} for pid ${pid}: ${data.message}`);
      return null;
    } catch (err) {
      console.error(`💥 Error fetching media for pid ${pid} (Attempt ${attempt}/3):`, err.message);
      if (attempt < 3) await delay(2000);
    }
  }
  return null;
}

async function run() {
  console.log('🚀 --- Starting CJ Video Backfill Script ---');

  // Obtain the CJ access token
  const token = await getCJToken();

  // Fetch all dropship products from local database
  console.log('\n📥 Querying dropship products from Supabase...');
  const { data: products, error: dbError } = await supabase
    .from('products')
    .select('id, name, cj_product_id, video_url')
    .eq('is_dropship', true)
    .not('cj_product_id', 'is', null);

  if (dbError) {
    console.error('❌ Failed to fetch products from Supabase:', dbError);
    process.exit(1);
  }

  console.log(`📊 Found ${products.length} dropship products in database.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let noVideoCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const pid = product.cj_product_id;
    console.log(`\n🔄 [${i + 1}/${products.length}] Processing product: "${product.name}" (ID: ${product.id}, CJ PID: ${pid})`);

    // If it already has video_url in products, skip calling CJ
    if (product.video_url) {
      console.log(`➡️ Skipped: Already has a video URL: ${product.video_url}`);
      skippedCount++;
      // Sync it to dropship_products table just in case it is missing there
      await supabase.from('dropship_products').update({ video_url: product.video_url }).eq('id', product.id);
      continue;
    }

    // Call CJ API
    const videoUrl = await fetchProductVideo(pid, token);

    if (videoUrl) {
      console.log(`🎥 Video found! URL: ${videoUrl}`);
      
      // Update both tables
      const { error: dsError } = await supabase
        .from('dropship_products')
        .update({ video_url: videoUrl })
        .eq('id', product.id);

      const { error: pError } = await supabase
        .from('products')
        .update({ video_url: videoUrl })
        .eq('id', product.id);

      if (dsError || pError) {
        console.error(`❌ Database update failed for "${product.name}":`, dsError || pError);
        errorCount++;
      } else {
        console.log(`✅ Successfully backfilled video for "${product.name}"!`);
        updatedCount++;
      }
    } else {
      console.log('ℹ️ No video found on CJ for this product.');
      noVideoCount++;
    }

    // Respectful delay to prevent CJ API blockages (minimum 1.2s)
    await delay(1200);
  }

  console.log('\n======================================');
  console.log('📊 --- BACKFILL COMPLETION REPORT ---');
  console.log(`Total dropship products processed : ${products.length}`);
  console.log(`Videos successfully backfilled   : ${updatedCount}`);
  console.log(`Already had video (skipped)       : ${skippedCount}`);
  console.log(`No video found on CJ             : ${noVideoCount}`);
  console.log(`Errors encountered               : ${errorCount}`);
  console.log('======================================');
  console.log('🎉 Done!');
}

run();

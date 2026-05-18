const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fdoiideysifrcvchtqdn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lpZGV5c2lmcmN2Y2h0cWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2MjU2MSwiZXhwIjoyMDg2ODM4NTYxfQ.zzKiN7hrb-exwxqZW43uzjGJO8CJkJWY5MT74vaMBv0'
);

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function translateToFr(text) {
  if (!text || text.length < 3) return text;
  
  // Clean first
  const cleaned = cleanHtml(text);

  const translateChunk = async (chunk) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url);
      const data = await res.json();
      let translated = '';
      if (data && data[0]) {
        data[0].forEach((item) => { if (item[0]) translated += item[0]; });
      }
      return translated || chunk;
    } catch (err) {
      console.error("Translation error on chunk:", err);
      return chunk;
    }
  };

  if (cleaned.length <= 1500) {
    return await translateChunk(cleaned);
  }

  // Split very long text
  const chunks = cleaned.match(/.{1,1500}(?:\s|$)/g) || [cleaned];
  const translatedChunks = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk));
  }

  return translatedChunks.join(' ');
}

// Simple test to see if string contains English characteristics
function isEnglish(text) {
  if (!text) return false;
  const lowercase = text.toLowerCase();
  // English stop words
  const englishWords = ['with', 'for', 'home', 'usb', 'air', 'purifier', 'humidifier', 'projection', 'lights', 'ultrasonic', 'mist', 'maker', 'car', 'portable', 'original', 'charging', 'smart', 'wireless', 'sensor'];
  
  let matches = 0;
  englishWords.forEach(w => {
    if (lowercase.includes(w)) matches++;
  });
  
  // If it contains "et", "avec", "pour", "de", "maison" (French stop words), it's probably already French
  const frenchWords = ['avec', 'pour', 'maison', 'diffuseur', 'humidificateur', 'voiture', 'portable', 'veilleuse', 'ultrasonique', 'purificateur'];
  let frMatches = 0;
  frenchWords.forEach(w => {
    if (lowercase.includes(w)) frMatches++;
  });

  return matches > frMatches || (matches > 0 && frMatches === 0);
}

async function run() {
  console.log("🚀 Démarrage du script de traduction rétroactive des produits...");

  // 1. Fetch all products from products table
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, description, slug, is_dropship, cj_product_id');

  if (prodErr) {
    console.error("Erreur lors de la récupération des produits :", prodErr);
    return;
  }

  console.log(`🔍 Analyse de ${products.length} produits trouvés...`);

  let translatedCount = 0;

  for (const product of products) {
    const nameIsEng = isEnglish(product.name);
    const descIsEng = isEnglish(product.description);

    if (nameIsEng || descIsEng) {
      console.log(`\n📝 Traduction du produit : "${product.name}" (ID: ${product.id})`);
      
      const translatedName = nameIsEng ? await translateToFr(product.name) : product.name;
      const translatedDesc = descIsEng ? await translateToFr(product.description) : product.description;
      const translatedShortDesc = translatedDesc.substring(0, 150) + '...';

      console.log(`   -> Ancien nom : "${product.name}"`);
      console.log(`   -> Nouveau nom : "${translatedName}"`);

      // Update products table
      const { error: updProdErr } = await supabase
        .from('products')
        .update({
          name: translatedName,
          description: translatedDesc,
          short_description: translatedShortDesc
        })
        .eq('id', product.id);

      if (updProdErr) {
        console.error(`❌ Échec de mise à jour dans 'products' :`, updProdErr);
        continue;
      }

      // Update dropship_products table if it exists
      const { error: updDropErr } = await supabase
        .from('dropship_products')
        .update({
          name: translatedName,
          description: translatedDesc,
          short_description: translatedShortDesc
        })
        .eq('id', product.id);

      if (updDropErr) {
        console.warn(`⚠️ Échec de mise à jour facultative dans 'dropship_products' :`, updDropErr);
      }

      console.log(`✅ Produit "${translatedName}" traduit et mis à jour avec succès dans la base de données !`);
      translatedCount++;
    }
  }

  console.log(`\n🎉 Traduction terminée ! ${translatedCount} produits traduits avec succès.`);
}

run();

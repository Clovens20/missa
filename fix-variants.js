const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: products } = await supabase.from('products').select('id, name, variants').eq('is_dropship', true);
  
  let updatedCount = 0;

  for (const product of products) {
    if (!product.variants || !Array.isArray(product.variants)) continue;

    const updatedVariants = product.variants.map((v) => {
      let { color, size, properties } = v;

      // Extract colors and sizes if missing, from properties or string parsing
      if (!color && properties && Array.isArray(properties)) {
        const cProp = properties.find(p => p.name && p.name.toLowerCase().includes('color') || p.name.toLowerCase().includes('couleur'));
        if (cProp) color = cProp.value || cProp.name;
        else if (properties.length > 0 && !size) color = properties[0].value || properties[0].name;
      }
      if (!size && properties && Array.isArray(properties)) {
        const sProp = properties.find(p => p.name && p.name.toLowerCase().includes('size') || p.name.toLowerCase().includes('taille'));
        if (sProp) size = sProp.value || sProp.name;
        else if (properties.length > 1) size = properties[1].value || properties[1].name;
        else if (properties.length === 1 && color) size = properties[0].value || properties[0].name; // if color is already set, the only prop might be size
      }
      
      // Eprolo fallback: sometimes color/size are in 'option1', 'option2'
      if (!color && v.option1) color = v.option1;
      if (!size && (v.option2 || v.option3)) size = v.option2 || v.option3;

      return { ...v, color: color || null, size: size || null };
    });

    const colors = [...new Set(updatedVariants.map(v => v.color).filter(Boolean))];
    const sizes = [...new Set(updatedVariants.map(v => v.size).filter(Boolean))];

    if (colors.length > 0 || sizes.length > 0) {
      await supabase.from('products').update({ variants: updatedVariants, colors, sizes }).eq('id', product.id);
      await supabase.from('dropship_products').update({ variants: updatedVariants, cj_variants: updatedVariants }).eq('id', product.id);
      updatedCount++;
      console.log(`Updated product ${product.name}: colors=${colors.length}, sizes=${sizes.length}`);
    } else {
      console.log(`Product ${product.name} still has no colors/sizes. Variants: ${JSON.stringify(updatedVariants)}`);
    }
  }
  
  console.log(`Done. Updated ${updatedCount} products.`);
}

run().catch(console.error);

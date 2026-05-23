const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function classify() {
  console.log('Fetching products...');
  const { data: products, error: prodErr } = await supabase.from('products').select('id, name, tags, category_id');
  if (prodErr) throw prodErr;

  console.log('Fetching categories...');
  const { data: categories, error: catErr } = await supabase.from('categories').select('*');
  if (catErr) throw catErr;

  const parentCats = categories.filter(c => !c.parent_id);
  const subCats = categories.filter(c => c.parent_id);

  let updatedCount = 0;

  for (const product of products) {
    let newCategoryId = product.category_id;
    let newSubcategoryId = null;

    // Check if the current category_id is actually a subcategory
    const isSub = subCats.find(s => s.id === product.category_id);
    if (isSub) {
      newCategoryId = isSub.parent_id;
      newSubcategoryId = isSub.id;
    } else {
      // It's a parent category (or null). Try to find a matching subcategory based on name or tags
      const parent = parentCats.find(p => p.id === product.category_id);
      if (parent) {
        const availableSubs = subCats.filter(s => s.parent_id === parent.id);
        
        const searchText = (product.name + ' ' + (product.tags || []).join(' ')).toLowerCase();
        
        let matchedSub = availableSubs.find(s => searchText.includes(s.name.toLowerCase()));
        
        if (matchedSub) {
          newSubcategoryId = matchedSub.id;
        } else {
          // Create 'Autres' subcategory if it doesn't exist
          let autresSub = availableSubs.find(s => s.name.toLowerCase() === 'autres');
          if (!autresSub) {
            const { data: newSub, error: insertErr } = await supabase.from('categories').insert({
              name: 'Autres',
              slug: slugify(parent.slug + '-autres'),
              parent_id: parent.id,
              is_active: true,
              sort_order: 99
            }).select().single();
            if (insertErr) throw insertErr;
            autresSub = newSub;
            subCats.push(autresSub); // Add to cache
          }
          newSubcategoryId = autresSub.id;
        }
      }
    }

    if (newCategoryId !== product.category_id || newSubcategoryId !== null) {
      // Only update if something changed
      const { error: updateErr } = await supabase.from('products').update({
        category_id: newCategoryId,
        subcategory_id: newSubcategoryId
      }).eq('id', product.id);
      
      if (updateErr) console.error(`Failed to update product ${product.id}`, updateErr);
      else updatedCount++;
    }
  }

  console.log(`Classification complete! Updated ${updatedCount} products.`);
}

classify().catch(console.error);

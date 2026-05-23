const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const hardcoded = [
  { slug: 'femme', subs: ['Robes', 'Hauts', 'Pantalons', 'Vestes', 'Maillots de bain'] },
  { slug: 'homme', subs: ['Chemises', 'Pantalons', 'T-shirts', 'Vestes', 'Costumes'] },
  { slug: 'enfants', subs: ['Bébé 0-2 ans', 'Fille 3-12 ans', 'Garçon 3-12 ans', 'Jouets', 'École'] },
  { slug: 'chaussures', subs: ['Sneakers', 'Talons', 'Sandales', 'Bottes', 'Sport'] },
  { slug: 'sacs', subs: ['Sacs à main', 'Sacs à dos', 'Portefeuilles', 'Valises'] },
  { slug: 'beaute', subs: ['Maquillage', 'Soins visage', 'Parfums', 'Cheveux'] },
  { slug: 'maison', subs: ['Décoration', 'Cuisine', 'Linge', 'Rangement'] },
  { slug: 'electronique', subs: ['Smartphones', 'Écouteurs', 'Accessoires', 'Gadgets'] },
  { slug: 'bijoux', subs: ['Colliers', 'Boucles', 'Bracelets', 'Montres'] },
  { slug: 'sport', subs: ['Vêtements sport', 'Équipements', 'Chaussures sport'] },
];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function seed() {
  const { data: parentCats } = await supabase.from('categories').select('id, slug').is('parent_id', null);
  
  if (!parentCats) return;

  for (const parent of parentCats) {
    const h = hardcoded.find(x => x.slug === parent.slug);
    if (h) {
      for (let i = 0; i < h.subs.length; i++) {
        const subName = h.subs[i];
        const subSlug = slugify(subName);
        
        // check if sub exists
        const { data: existing } = await supabase.from('categories')
          .select('id')
          .eq('parent_id', parent.id)
          .eq('name', subName)
          .limit(1);
          
        if (!existing || existing.length === 0) {
          await supabase.from('categories').insert({
            name: subName,
            slug: subSlug,
            parent_id: parent.id,
            is_active: true,
            sort_order: i + 1
          });
          console.log(`Inserted subcategory: ${subName} under ${parent.slug}`);
        }
      }
    }
  }
}

seed().catch(console.error);

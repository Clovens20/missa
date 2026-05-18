const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fdoiideysifrcvchtqdn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lpZGV5c2lmcmN2Y2h0cWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2MjU2MSwiZXhwIjoyMDg2ODM4NTYxfQ.zzKiN7hrb-exwxqZW43uzjGJO8CJkJWY5MT74vaMBv0'
);

// Copie locale de l'algorithme de génération d'avis en JS natif pour une exécution immédiate
const REVIEW_TITLES = [
  "Parfait, je suis ravie !", "Un achat que je ne regrette pas", "Exactement ce que je voulais",
  "Livraison ultra rapide !", "Qualité au rendez-vous", "Je suis bluffée", "Super produit !",
  "Rien à redire, c'est top", "J'adore !", "Très bonne surprise", "Conforme à la description",
  "Je recommande vivement", "5 étoiles amplement méritées", "Vraiment satisfaite",
  "Excellent rapport qualité/prix", "Coup de cœur !"
];

const COMMENTS_GENERAL = [
  "Super produit, la qualité est vraiment au rendez-vous. Je suis très satisfaite et je n'hésiterai pas à recommander.",
  "Livraison très rapide, produit bien emballé et conforme à la description. Vraiment contente !",
  "Excellent rapport qualité/prix. Le produit est exactement comme sur les photos.",
  "Très belle qualité, je suis agréablement surprise. La livraison a été rapide.",
  "Je recommande vivement ! Parfait, la qualité est là et le prix est raisonnable.",
  "Produit reçu rapidement, conforme à mes attentes. La qualité est bonne.",
  "Très content de mon achat. Le produit est bien fait et correspond exactement à ce qui est décrit."
];

const FRENCH_NAMES = [
  "Camille", "Léa", "Chloé", "Marie", "Juliette", "Alice", "Emma", "Sarah", "Manon", "Mathilde",
  "Laura", "Clara", "Pauline", "Charlotte", "Anaïs", "Inès", "Mélissa", "Elodie", "Amandine", "Sophie",
  "Thomas", "Lucas", "Hugo", "Maxime", "Antoine", "Alexandre", "Nicolas", "Julien", "Clément", "Mathieu"
];

const LAST_INITIALS = ["A.", "B.", "C.", "D.", "F.", "G.", "L.", "M.", "P.", "R.", "S.", "T.", "V."];

function generateReviews(productId) {
  const count = Math.floor(Math.random() * 8) + 8; // 8 to 15 reviews
  const reviews = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const rating = Math.random() < 0.8 ? 5 : 4;
    const name = FRENCH_NAMES[Math.floor(Math.random() * FRENCH_NAMES.length)] + " " + LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
    const title = REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)];
    const body = COMMENTS_GENERAL[Math.floor(Math.random() * COMMENTS_GENERAL.length)];
    const daysAgo = Math.floor(Math.random() * 45);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    reviews.push({
      product_id: productId,
      customer_name: name,
      rating: rating,
      title: title,
      body: body,
      status: 'approved',
      is_verified: Math.random() > 0.3,
      helpful_count: Math.floor(Math.random() * 5),
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    });
  }

  return reviews;
}

async function run() {
  console.log("🚀 Démarrage du script de rattrapage rétroactif des avis...");

  // 1. Récupérer tous les produits de la boutique
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, is_dropship');

  if (prodErr) {
    console.error("Erreur lors de la récupération des produits :", prodErr);
    return;
  }

  console.log(`🔍 Analyse de ${products.length} produits trouvés...`);

  let fixedCount = 0;

  for (const product of products) {
    // 2. Vérifier s'il y a déjà des avis pour ce produit
    const { data: existingReviews, error: revErr } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', product.id);

    if (revErr) {
      console.error(`Erreur pour le produit ${product.name} :`, revErr);
      continue;
    }

    if (existingReviews.length === 0) {
      console.log(`⚠️ Le produit "${product.name}" (ID: ${product.id}) n'a aucun avis. Génération...`);
      
      const newReviews = generateReviews(product.id);
      
      const { error: insertErr } = await supabase
        .from('product_reviews')
        .insert(newReviews);

      if (insertErr) {
        console.error(`❌ Échec de la génération des avis pour "${product.name}" :`, insertErr);
      } else {
        console.log(`✅ ${newReviews.length} avis générés et enregistrés avec succès pour "${product.name}" !`);
        fixedCount++;
      }
    }
  }

  console.log(`\n🎉 Rattrapage terminé ! ${fixedCount} produits réparés avec succès.`);
}

run();

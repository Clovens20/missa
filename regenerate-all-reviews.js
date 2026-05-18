const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fdoiideysifrcvchtqdn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkb2lpZGV5c2lmcmN2Y2h0cWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2MjU2MSwiZXhwIjoyMDg2ODM4NTYxfQ.zzKiN7hrb-exwxqZW43uzjGJO8CJkJWY5MT74vaMBv0'
);

const FRENCH_NAMES = [
  "Camille", "Léa", "Chloé", "Marie", "Juliette", "Alice", "Emma", "Sarah", "Manon", "Mathilde",
  "Laura", "Clara", "Pauline", "Charlotte", "Anaïs", "Océane", "Inès", "Mélissa", "Margaux", "Célia",
  "Elodie", "Amandine", "Sophie", "Lucie", "Marion", "Justine", "Morgane", "Céline", "Audrey", "Coralie",
  "Thomas", "Lucas", "Hugo", "Maxime", "Antoine", "Alexandre", "Nicolas", "Julien", "Clément", "Mathieu",
  "Romain", "Guillaume", "Pierre", "Paul", "Arthur", "Valentin", "Baptiste", "Louis", "Vincent", "Benoît",
  "Louise", "Ambre", "Alba", "Jade", "Mia", "Rose", "Anna", "Julia", "Lina", "Lou",
  "Iris", "Romane", "Agathe", "Léonie", "Mila", "Jeanne", "Inaya", "Zoe", "Eva", "Lola",
  "Léo", "Gabriel", "Raphaël", "Maël", "Louis", "Noah", "Jules", "Adam", "Arthur", "Hugo",
  "Gabin", "Isaac", "Léon", "Eden", "Paul", "Naël", "Aaron", "Liam", "Malo", "Noé"
];

const LAST_INITIALS = ["A.", "B.", "C.", "D.", "F.", "G.", "L.", "M.", "P.", "R.", "S.", "T.", "V."];

const REVIEW_TITLES = [
  "Parfait, je suis ravie !", "Un achat que je ne regrette pas", "Exactement ce que je voulais",
  "Livraison ultra rapide !", "Qualité au rendez-vous", "Je suis bluffée", "Super produit !",
  "Rien à redire, c'est top", "J'adore !", "Très bonne surprise", "Conforme à la description",
  "Je recommande vivement", "5 étoiles amplement méritées", "Vraiment satisfaite",
  "Excellent rapport qualité/prix", "Coup de cœur !"
];

const PRODUCT_AWARE_TEMPLATES = [
  "Super ravi de mon achat ! {ce} {product} est d'une excellente qualité et correspond parfaitement aux photos.",
  "Je recommande vivement {ce} {product}. Il est très pratique au quotidien et la livraison a été ultra rapide.",
  "Excellent rapport qualité/prix pour {ce} {product}. Rien à redire, c'est conforme à la description.",
  "Très satisfaite de mon {product}, la matière est agréable et les finitions sont soignées.",
  "Un très bel achat. {ce} {product} est magnifique et fonctionne à merveille.",
  "Je l'ai reçu en seulement 3 jours. {ce} {product} est d'une grande qualité pour ce tarif !",
  "Produit conforme et bien emballé. {ce} {product} est exactement ce que je cherchais.",
  "J'adore mon nouveau {product} ! Je ne regrette pas du tout mon choix et je repasserai commande.",
  "Très bon produit, {ce} {product} répond parfaitement à mes attentes. Service de livraison impeccable.",
  "Parfait ! La qualité de {ce} {product} dépasse mes espérances pour le prix."
];

const COMMENTS_LIVRAISON = [
  "La livraison a été ultra rapide ! Reçu en 2 jours seulement. Et le produit est parfait.",
  "Emballage très soigné, produit bien protégé. La livraison a été rapide. Merci !",
  "Commande passée vendredi, reçue lundi. Super service !",
  "Livraison en avance sur le délai prévu. Très agréable.",
  "Le colis était bien emballé et le produit en parfait état à la livraison.",
  "Service client réactif et livraison rapide. Je recommande."
];

const COMMENTS_GENERAL = [
  "Super produit, la qualité est vraiment au rendez-vous. Je suis très satisfaite et je n'hésiterai pas à recommander.",
  "Livraison très rapide, produit bien emballé et conforme à la description. Vraiment contente !",
  "Excellent rapport qualité/prix. Le produit est exactement comme sur les photos.",
  "Très belle qualité, je suis agréablement surprise. La livraison a été rapide.",
  "Je recommande vivement ! Parfait, la qualité est là et le prix est raisonnable.",
  "Produit reçu rapidement, conforme à mes attentes. La qualité est bonne."
];

function getDemonstrativePronoun(word) {
  if (!word) return "ce";
  const firstChar = word.trim().charAt(0).toLowerCase();
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'à', 'â', 'ê', 'î', 'ô', 'û', 'h'];
  if (vowels.includes(firstChar)) {
    return "cet";
  }
  return "ce";
}

function cleanProductNameForReview(name) {
  if (!name) return "produit";
  let cleaned = name.split('—')[0].split('|')[0].trim();
  const words = cleaned.split(' ');
  if (words.length > 5) {
    cleaned = words.slice(0, 5).join(' ');
  }
  return cleaned.toLowerCase();
}

function generateReviews(productId, productName) {
  const count = Math.floor(Math.random() * 8) + 8; // 8 to 15 reviews
  const reviews = [];
  const now = new Date();

  const cleanName = cleanProductNameForReview(productName);
  const cePronoun = getDemonstrativePronoun(cleanName);

  for (let i = 0; i < count; i++) {
    const rating = Math.random() < 0.8 ? 5 : 4;
    const firstName = FRENCH_NAMES[Math.floor(Math.random() * FRENCH_NAMES.length)];
    const lastInitial = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
    const customerName = `${firstName} ${lastInitial}`;
    const title = REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)];
    
    // Choose comment pool
    let commentPool;
    const poolRoll = Math.random();
    if (poolRoll < 0.6) {
      commentPool = PRODUCT_AWARE_TEMPLATES;
    } else if (poolRoll < 0.85) {
      commentPool = COMMENTS_GENERAL;
    } else {
      commentPool = COMMENTS_LIVRAISON;
    }

    const rawComment = commentPool[Math.floor(Math.random() * commentPool.length)];
    const body = rawComment
      .replace(/{product}/g, cleanName)
      .replace(/{ce}/g, cePronoun);

    const daysAgo = Math.floor(Math.random() * 45);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    reviews.push({
      product_id: productId,
      customer_name: customerName,
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
  console.log("🔥 Suppression de tous les anciens avis...");
  
  // Supprimer tous les avis pour les regénérer proprement
  const { error: delAllErr } = await supabase
    .from('product_reviews')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (delAllErr) {
    console.error("Erreur critique lors de la purge :", delAllErr);
    return;
  }

  console.log("✅ Base de données nettoyée avec succès.");

  // 1. Récupérer tous les produits de la boutique
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name');

  if (prodErr) {
    console.error("Erreur lors de la récupération des produits :", prodErr);
    return;
  }

  console.log(`🔍 Régénération de ${products.length} produits avec des avis contextualisés et uniques...`);

  let updatedCount = 0;

  for (const product of products) {
    const newReviews = generateReviews(product.id, product.name);
    
    const { error: insertErr } = await supabase
      .from('product_reviews')
      .insert(newReviews);

    if (insertErr) {
      console.error(`❌ Échec de la génération pour "${product.name}" :`, insertErr);
    } else {
      const reviewCount = newReviews.length;
      const totalRating = newReviews.reduce((sum, r) => sum + r.rating, 0);
      const reviewAvg = Number((totalRating / reviewCount).toFixed(1));

      // Mettre également à jour dropship_products pour rester synchronisé
      await supabase
        .from('dropship_products')
        .update({
          review_count: reviewCount,
          rating: reviewAvg
        })
        .eq('id', product.id);

      console.log(`✨ "${product.name}" : ${reviewCount} avis insérés (Moyenne : ${reviewAvg}/5)`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 SUCCÈS ! ${updatedCount} produits ont été régénérés avec des avis 100% uniques et personnalisés !`);
}

run();

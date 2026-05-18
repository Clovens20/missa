import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Détection de la langue française pour éviter les appels API inutiles
function isFrench(text: string): boolean {
  if (!text) return true;
  const frenchIndicator = /\b(le|la|les|pour|dans|avec|est|une|cette|produit|informations|aperçu|maison|décoration|chambre|couleur|taille|matière|professionnel|baskets|hommes|femmes)\b/i;
  const frenchChars = /[éàèùçêâîôûœÉÀÈÙÇÊÂÎÔÛŒ]/;
  return frenchIndicator.test(text) || frenchChars.test(text);
}

// Fonction utilitaire pour faire une pause
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utilitaire de traduction Google (Gratuit) avec découpage et gestion d'erreurs
async function translateToFr(text: string) {
  if (!text || text.length < 3) return text;
  if (isFrench(text)) return text; // Déjà en français !
  
  const translateChunk = async (chunk: string) => {
    try {
      await sleep(1000); // 1 seconde de pause avant chaque appel API pour éviter les blocages IP
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `q=${encodeURIComponent(chunk)}`
      });
      const data = await res.json();
      let translated = '';
      if (data && data[0]) {
        data[0].forEach((item: any) => { if (item[0]) translated += item[0]; });
      }
      return translated || chunk;
    } catch (err) {
      console.error("Translation error on chunk:", err);
      return chunk;
    }
  };

  if (text.length <= 1500) {
    return await translateChunk(text);
  }

  // Découpage par morceaux de 1500 caractères
  const chunks = text.match(/.{1,1500}(?:\s|$)/g) || [text];
  const translatedChunks = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk));
  }

  return translatedChunks.join(' ');
}

export async function GET(req: Request) {
  try {
    // 1. Récupérer tous les produits
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, description, short_description')

    if (error) throw error

    let totalUpdated = 0

    for (const product of products) {
      const nameNeedsTranslation = !isFrench(product.name);
      const descNeedsTranslation = product.description && !isFrench(product.description);
      const shortDescNeedsTranslation = product.short_description && !isFrench(product.short_description);

      if (!nameNeedsTranslation && !descNeedsTranslation && !shortDescNeedsTranslation) {
        continue; // Tout est déjà en français !
      }

      console.log(`Translating product: "${product.name}" (ID: ${product.id})...`);

      // Traduire le nom
      const translatedName = nameNeedsTranslation 
        ? await translateToFr(product.name) 
        : product.name;
      
      // Traduire la description longue
      let translatedDescription = product.description;
      if (product.description && descNeedsTranslation) {
        translatedDescription = await translateToFr(product.description);
      }
      
      // Traduire la description courte
      let translatedShortDescription = product.short_description;
      if (product.short_description && shortDescNeedsTranslation) {
        translatedShortDescription = await translateToFr(product.short_description);
      }

      // Si au moins un élément a changé (la traduction a fonctionné et modifié le texte)
      if (
        translatedName !== product.name || 
        translatedDescription !== product.description ||
        translatedShortDescription !== product.short_description
      ) {
        console.log(`Updating translation for "${product.name}"...`);
        
        // Mettre à jour la table 'products'
        await supabase.from('products').update({
          name: translatedName,
          description: translatedDescription,
          short_description: translatedShortDescription
        }).eq('id', product.id)
        
        // Mettre à jour la table 'dropship_products' au cas où c'est un produit CJ
        await supabase.from('dropship_products').update({
          name: translatedName,
          description: translatedDescription,
          short_description: translatedShortDescription
        }).eq('id', product.id)

        totalUpdated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Traduction complète : ${totalUpdated} produits traduits en français avec succès.`,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

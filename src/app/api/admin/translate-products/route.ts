import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Utilitaire de traduction Google (Gratuit)
async function translateToFr(text: string) {
  if (!text || text.length < 3) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `q=${encodeURIComponent(text)}`
    });
    const data = await res.json();
    let translated = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => { if (item[0]) translated += item[0]; });
    }
    return translated || text;
  } catch (err) {
    return text;
  }
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
      // Traduire le nom
      const translatedName = await translateToFr(product.name);
      
      // Traduire la description longue
      let translatedDescription = product.description;
      if (product.description) {
        translatedDescription = await translateToFr(product.description);
      }
      
      // Traduire la description courte
      let translatedShortDescription = product.short_description;
      if (product.short_description) {
        translatedShortDescription = await translateToFr(product.short_description);
      }

      // Si au moins un élément a changé (la traduction a fonctionné et modifié le texte)
      if (
        translatedName !== product.name || 
        translatedDescription !== product.description ||
        translatedShortDescription !== product.short_description
      ) {
        
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

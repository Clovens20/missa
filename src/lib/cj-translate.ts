// French → English fashion/product
// dictionary for CJ search

const FASHION_DICT: Record<string, string> = {
  // ── Vêtements généraux ────────────
  'robe': 'dress',
  'robes': 'dress',
  'jupe': 'skirt',
  'jupes': 'skirt',
  'pantalon': 'pants',
  'pantalons': 'pants',
  'jean': 'jeans',
  'jeans': 'jeans',
  'short': 'shorts',
  'shorts': 'shorts',
  'legging': 'leggings',
  'leggings': 'leggings',
  'blouse': 'blouse',
  'chemise': 'shirt',
  'chemisier': 'blouse',
  't-shirt': 't-shirt',
  'tshirt': 't-shirt',
  'haut': 'top',
  'top': 'top',
  'pull': 'sweater',
  'pullover': 'sweater',
  'sweat': 'sweatshirt',
  'hoodie': 'hoodie',
  'veste': 'jacket',
  'manteau': 'coat',
  'blazer': 'blazer',
  'tailleur': 'suit',
  'combinaison': 'jumpsuit',
  'combishort': 'romper',
  'ensemble': 'set',
  'survêtement': 'tracksuit',
  'survetement': 'tracksuit',
  'pyjama': 'pajamas',
  'lingerie': 'lingerie',
  'soutien': 'bra',
  'sous-vêtement': 'underwear',
  'maillot': 'swimsuit',
  'bikini': 'bikini',
  'bain': 'swimwear',

  // ── Médical ───────────────────────
  'uniforme': 'uniform',
  'uniforme médical': 'medical scrubs',
  'médical': 'medical',
  'medical': 'medical',
  'infirmière': 'nurse',
  'infirmier': 'nurse',
  'scrubs': 'scrubs',
  'blouse médicale': 'medical coat',
  'blouse blanche': 'lab coat',
  'dentiste': 'dentist',
  'chirurgien': 'surgeon',
  'clinique': 'clinic',

  // ── Style & coupe ─────────────────
  'maxi': 'maxi',
  'mini': 'mini',
  'midi': 'midi',
  'floral': 'floral',
  'fleuri': 'floral',
  'imprimé': 'printed',
  'uni': 'solid',
  'rayé': 'striped',
  'a carreaux': 'plaid',
  'dentelle': 'lace',
  'satin': 'satin',
  'velours': 'velvet',
  'soie': 'silk',
  'coton': 'cotton',
  'lin': 'linen',
  'évasé': 'flared',
  'evase': 'flared',
  'moulant': 'bodycon',
  'fluide': 'flowy',
  'large': 'oversized',
  'oversize': 'oversized',
  'taille haute': 'high waist',
  'taille basse': 'low waist',
  'dos nu': 'backless',
  'décolleté': 'v-neck',
  'col v': 'v-neck',
  'col rond': 'round neck',
  'manches longues': 'long sleeve',
  'manches courtes': 'short sleeve',
  'sans manches': 'sleeveless',
  'bretelles': 'spaghetti strap',

  // ── Chaussures ────────────────────
  'chaussures': 'shoes',
  'chaussure': 'shoes',
  'basket': 'sneakers',
  'baskets': 'sneakers',
  'sneakers': 'sneakers',
  'tennis': 'sneakers',
  'talon': 'heels',
  'talons': 'heels',
  'escarpins': 'pumps',
  'sandales': 'sandals',
  'sandale': 'sandals',
  'bottes': 'boots',
  'botte': 'boots',
  'bottines': 'ankle boots',
  'mocassins': 'loafers',
  'ballerines': 'flats',
  'plateforme': 'platform',

  // ── Accessoires ───────────────────
  'sac': 'bag',
  'sacs': 'bag',
  'sac à main': 'handbag',
  'sac main': 'handbag',
  'sac à dos': 'backpack',
  'sac dos': 'backpack',
  'sac bandoulière': 'shoulder bag',
  'sac bandouliere': 'shoulder bag',
  'pochette': 'clutch',
  'portefeuille': 'wallet',
  'ceinture': 'belt',
  'ceintures': 'belt',
  'chapeau': 'hat',
  'bonnet': 'beanie',
  'casquette': 'cap',
  'écharpe': 'scarf',
  'echarpe': 'scarf',
  'gants': 'gloves',
  'collier': 'necklace',
  'bracelet': 'bracelet',
  'bague': 'ring',
  'boucles': 'earrings',
  'lunettes': 'sunglasses',
  'montre': 'watch',

  // ── Beauté ────────────────────────
  'beauté': 'beauty',
  'beaute': 'beauty',
  'maquillage': 'makeup',
  'fond de teint': 'foundation',
  'rouge à lèvres': 'lipstick',
  'mascara': 'mascara',
  'soin': 'skincare',
  'crème': 'cream',
  'creme': 'cream',
  'sérum': 'serum',
  'serum': 'serum',
  'hydratant': 'moisturizer',
  'nettoyant': 'cleanser',
  'masque': 'mask',
  'parfum': 'perfume',
  'huile': 'oil',

  // ── Maison & Déco ─────────────────
  'lampe': 'lamp',
  'champignon': 'mushroom',
  'déco': 'decoration',
  'deco': 'decoration',
  'décoration': 'decoration',
  'coussin': 'pillow',
  'couverture': 'blanket',
  'tapis': 'rug',
  'rideau': 'curtain',
  'miroir': 'mirror',
  'bougie': 'candle',
  'vase': 'vase',
  'cadre': 'frame photo',
  'horloge': 'clock',

  // ── Sport & Fitness ───────────────
  'sport': 'sport',
  'fitness': 'fitness',
  'yoga': 'yoga',
  'gym': 'gym',
  'course': 'running',
  'natation': 'swimming',
  'vélo': 'cycling',

  // ── Couleurs ──────────────────────
  'noir': 'black',
  'blanc': 'white',
  'rouge': 'red',
  'bleu': 'blue',
  'vert': 'green',
  'jaune': 'yellow',
  'rose': 'pink',
  'violet': 'purple',
  'orange': 'orange',
  'gris': 'gray',
  'beige': 'beige',
  'marron': 'brown',
  'marine': 'navy',
  'bordeaux': 'burgundy',
  'corail': 'coral',
  'menthe': 'mint',
  'lavande': 'lavender',
  'caramel': 'caramel',
  'kaki': 'khaki',

  // ── Tailles ───────────────────────
  'grande taille': 'plus size',
  'grande': 'large',
  'petite': 'small',

  // ── Occasions ─────────────────────
  'soirée': 'evening party',
  'soiree': 'party',
  'mariage': 'wedding',
  'bureau': 'office',
  'casual': 'casual',
  'cocktail': 'cocktail',
  'plage': 'beach',
  'été': 'summer',
  'ete': 'summer',
  'hiver': 'winter',
  'automne': 'autumn fall',
  'printemps': 'spring',

  // ── Femme/Homme/Enfant ────────────
  'femme': 'women',
  'homme': 'men',
  'enfant': 'kids',
  'bébé': 'baby',
  'bebe': 'baby',
  'fille': 'girl',
  'garçon': 'boy',
  'garcon': 'boy',
}

export function translateToCJ(frenchQuery: string): {
  translated: string
  wasTranslated: boolean
} {
  if (!frenchQuery.trim()) {
    return {
      translated: frenchQuery,
      wasTranslated: false,
    }
  }

  let query = frenchQuery.toLowerCase().trim()
  let translated = query
  let wasTranslated = false

  // ── Step 1: Try multi-word phrases
  // (longer phrases first for accuracy)
  const sortedPhrases = Object.keys(FASHION_DICT).sort((a, b) => b.length - a.length)

  for (const phrase of sortedPhrases) {
    // Check if the phrase is present in the query
    // Use word boundaries to avoid partial matches like 'top' in 'stopper'
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    
    if (regex.test(translated)) {
      translated = translated.replace(regex, FASHION_DICT[phrase])
      wasTranslated = true
    }
  }

  // ── Step 2: Clean up result
  translated = translated.replace(/\s+/g, ' ').trim()

  // ── Step 3: If nothing changed,
  // keep original (might be English)
  if (!wasTranslated) {
    return {
      translated: frenchQuery,
      wasTranslated: false,
    }
  }

  return {
    translated,
    wasTranslated: true,
  }
}

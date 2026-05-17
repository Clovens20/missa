/**
 * Centralized color mapping for CJ Dropshipping
 * Supports French + English names and converts them to HEX codes.
 */

export function getColorHex(colorName: string): string {
  if (!colorName) return '#888888'
  
  const name = colorName
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // removes accents
  
  const colorMap: Record<string, string> = {
    // Noir / Black
    'noir': '#1a1a1a',
    'black': '#1a1a1a',
    'noir profond': '#000000',
    
    // Blanc / White
    'blanc': '#f5f5f5',
    'white': '#f5f5f5',
    'blanc casse': '#f0ece4',
    'creme': '#fffdd0',
    'ivoire': '#fffff0',
    
    // Gris / Grey
    'gris': '#9e9e9e',
    'grey': '#9e9e9e',
    'gray': '#9e9e9e',
    'gris clair': '#d4d4d4',
    'light grey': '#d4d4d4',
    'gris fonce': '#616161',
    'dark grey': '#616161',
    'gris anthracite': '#424242',
    'charcoal': '#36454f',
    
    // Rose / Pink
    'rose': '#f48fb1',
    'pink': '#f48fb1',
    'rose clair': '#ffc0cb',
    'light pink': '#ffc0cb',
    'rose fonce': '#e91e8c',
    'hot pink': '#ff69b4',
    'rose bebe': '#ffb6c1',
    'baby pink': '#ffb6c1',
    'rose poudre': '#d4a5a5',
    'dusty rose': '#dcb4b4',
    'fuchsia': '#ff00ff',
    'mauve': '#e0b0ff',
    'rose corail': '#ff7f7f',
    
    // Rouge / Red
    'rouge': '#f44336',
    'red': '#f44336',
    'rouge vin': '#722f37',
    'wine': '#722f37',
    'bordeaux': '#800020',
    'burgundy': '#800020',
    'grenat': '#7b1818',
    'maroon': '#800000',
    'rouge fonce': '#c62828',
    'dark red': '#c62828',
    'rouge vif': '#ff1744',
    'cerise': '#de3163',
    'cherry': '#de3163',
    'tomate': '#ff6347',
    'corail': '#ff6b6b',
    'coral': '#ff6b6b',
    'saumon': '#fa8072',
    'salmon': '#fa8072',
    
    // Orange
    'orange': '#ff9800',
    'orange brule': '#bf5700',
    'peche': '#ffcba4',
    'peach': '#ffcba4',
    'abricot': '#fbceb1',
    'apricot': '#fbceb1',
    
    // Jaune / Yellow
    'jaune': '#ffd600',
    'yellow': '#ffd600',
    'jaune clair': '#fff176',
    'light yellow': '#fff176',
    'moutarde': '#ffdb58',
    'mustard': '#ffdb58',
    'dore': '#ffd700',
    'gold': '#ffd700',
    'champagne': '#f7e7ce',
    'beige': '#f5f0e8',
    
    // Vert / Green
    'vert': '#4caf50',
    'green': '#4caf50',
    'vert clair': '#81c784',
    'light green': '#81c784',
    'vert fonce': '#2e7d32',
    'dark green': '#2e7d32',
    'vert olive': '#808000',
    'olive': '#808000',
    'vert militaire': '#4a5240',
    'army green': '#4a5240',
    'menthe': '#98ff98',
    'mint': '#98ff98',
    'turquoise': '#40e0d0',
    'emeraude': '#50c878',
    'emerald': '#50c878',
    'sage': '#b2ac88',
    'kaki': '#c3b091',
    'khaki': '#c3b091',
    
    // Bleu / Blue
    'bleu': '#2196f3',
    'blue': '#2196f3',
    'bleu clair': '#87ceeb',
    'light blue': '#87ceeb',
    'bleu fonce': '#0d47a1',
    'dark blue': '#0d47a1',
    'bleu marine': '#001f54',
    'navy': '#001f54',
    'marine': '#001f54',
    'bleu roi': '#4169e1',
    'royal blue': '#4169e1',
    'bleu ciel': '#87ceeb',
    'sky blue': '#87ceeb',
    'bleu nuit': '#191970',
    'midnight blue': '#191970',
    'cobalt': '#0047ab',
    'indigo': '#3f51b5',
    'cyan': '#00bcd4',
    'teal': '#009688',
    'petrole': '#006374',
    
    // Violet / Purple
    'violet': '#9c27b0',
    'purple': '#9c27b0',
    'violet clair': '#ce93d8',
    'light purple': '#ce93d8',
    'violet fonce': '#6a0dad',
    'dark purple': '#6a0dad',
    'lavande': '#e6e6fa',
    'lavender': '#e6e6fa',
    'lilas': '#c8a2c8',
    'lilac': '#c8a2c8',
    'prune': '#701c1c',
    'plum': '#8e4585',
    'aubergine': '#614051',
    'eggplant': '#614051',
    
    // Marron / Brown
    'marron': '#795548',
    'brown': '#795548',
    'chocolat': '#7b3f00',
    'chocolate': '#7b3f00',
    'caramel': '#c68642',
    'cafe': '#6f4e37',
    'coffee': '#6f4e37',
    'brun': '#964b00',
    'taupe': '#483c32',
    'tan': '#d2b48c',
    'camel': '#c19a6b',
    'noisette': '#8b6914',
    'terre': '#a0522d',
    'sienna': '#a0522d',
    
    // Multicolore
    'multicolore': 
      'linear-gradient(135deg, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0)',
    'multicolor': 
      'linear-gradient(135deg, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0)',
    'arc en ciel': 
      'linear-gradient(135deg, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0)',
    'rainbow': 
      'linear-gradient(135deg, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0)',
    
    // Transparence
    'transparent': 'transparent',
  }
  
  // Direct match
  if (colorMap[name]) return colorMap[name]
  
  // Partial match - Check longest keys first for better precision
  const sortedKeys = Object.keys(colorMap).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (name.includes(key)) {
      return colorMap[key]
    }
  }
  
  return colorName // Fallback to original name (might be valid CSS)
}

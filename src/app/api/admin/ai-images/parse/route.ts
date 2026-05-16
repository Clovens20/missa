import { NextResponse } from 'next/server'

// Parse natural language instructions
// into structured color/count data
function parseInstructions(
  text: string
): {
  colors: { color: string; count: number }[]
  background: string
  angle: string
  style: string
} {
  const colors: { 
    color: string; count: number 
  }[] = []
  
  // Color keywords in FR/EN
  const colorPatterns = [
    // "3 en Rouge" or "3 Rouge" 
    // or "Rouge x3"
    /(\d+)\s+(?:en\s+)?([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/gi,
    // "Rouge: 3" or "Rouge - 3"
    /([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)\s*[:\-]\s*(\d+)/gi,
    // "Rouge x3"
    /([A-Za-zÀ-ÿ]+)\s*[xX]\s*(\d+)/gi,
  ]

  // Known color list
  const knownColors = [
    'Rouge', 'Red', 'Bleu', 'Blue', 
    'Vert', 'Green', 'Noir', 'Black',
    'Blanc', 'White', 'Rose', 'Pink',
    'Jaune', 'Yellow', 'Violet', 'Purple',
    'Orange', 'Gris', 'Gray', 'Grey',
    'Beige', 'Marron', 'Brown', 
    'Bordeaux', 'Marine', 'Turquoise',
    'Corail', 'Coral', 'Kaki', 'Khaki',
    'Lavande', 'Lavender', 'Doré', 'Gold',
    'Argenté', 'Silver',
  ]

  // Try to extract color+count pairs
  for (const pattern of colorPatterns) {
    let match
    const regex = new RegExp(
      pattern.source, 'gi'
    )
    while ((match = regex.exec(text)) !== null) {
      const [, a, b] = match
      
      // Determine which is number, which is color
      const num = parseInt(a) || parseInt(b)
      const colorCandidate = isNaN(parseInt(a)) 
        ? a : b
      
      // Check if it's a known color
      const isColor = knownColors.some(
        c => c.toLowerCase() === 
          colorCandidate?.toLowerCase()
      )
      
      if (num && colorCandidate && 
        (isColor || 
          colorCandidate.length > 2)
      ) {
        const existing = colors.find(
          c => c.color.toLowerCase() === 
            colorCandidate.toLowerCase()
        )
        if (existing) {
          existing.count = num
        } else {
          colors.push({
            color: colorCandidate
              .charAt(0).toUpperCase() + 
              colorCandidate.slice(1),
            count: num,
          })
        }
      }
    }
  }

  // If no structured colors found,
  // look for mentioned colors without count
  if (colors.length === 0) {
    for (const color of knownColors) {
      if (text.toLowerCase().includes(
        color.toLowerCase()
      )) {
        colors.push({ color, count: 1 })
      }
    }
  }

  // Detect background preference
  let background = 'white'
  if (text.toLowerCase().includes('transparent') ||
    text.toLowerCase().includes('fond transparent')) {
    background = 'transparent'
  } else if (
    text.toLowerCase().includes('lifestyle') ||
    text.toLowerCase().includes('ambiance')) {
    background = 'lifestyle'
  } else if (
    text.toLowerCase().includes('gradient') ||
    text.toLowerCase().includes('dégradé')) {
    background = 'gradient'
  }

  // Detect angle preference
  let angle = 'front'
  if (text.toLowerCase().includes('côté') ||
    text.toLowerCase().includes('profil') ||
    text.toLowerCase().includes('side')) {
    angle = 'side'
  } else if (
    text.toLowerCase().includes('détail') ||
    text.toLowerCase().includes('gros plan') ||
    text.toLowerCase().includes('close')) {
    angle = 'detail'
  } else if (
    text.toLowerCase().includes('flat lay') ||
    text.toLowerCase().includes('dessus') ||
    text.toLowerCase().includes('overhead')) {
    angle = 'flat'
  } else if (
    text.toLowerCase().includes('angle') ||
    text.toLowerCase().includes('3/4')) {
    angle = 'angle'
  }

  // Extract style keywords
  const styleKeywords: string[] = []
  if (text.toLowerCase().includes('élégant') ||
    text.toLowerCase().includes('elegant')) {
    styleKeywords.push('elegant, luxurious')
  }
  if (text.toLowerCase().includes('casual') ||
    text.toLowerCase().includes('décontracté')) {
    styleKeywords.push('casual, relaxed')
  }
  if (text.toLowerCase().includes('sport')) {
    styleKeywords.push('sporty, athletic')
  }
  if (text.toLowerCase().includes('vintage')) {
    styleKeywords.push('vintage style')
  }

  return {
    colors: colors.length > 0 
      ? colors 
      : [{ color: 'Original', count: 1 }],
    background,
    angle,
    style: styleKeywords.join(', '),
  }
}

export async function POST(req: Request) {
  try {
    const { instructions } = await req.json()
    const parsed = parseInstructions(
      instructions
    )
    return NextResponse.json(parsed)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

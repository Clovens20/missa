// Detect visitor country using free IP geolocation API

export async function getVisitorCountry(): Promise<string> {
  try {
    // Use ipapi.co (free, no key needed)
    // Adding a timeout to prevent slow page loads if API is down
    const res = await fetch(
      'https://ipapi.co/country/',
      { 
        cache: 'no-store',
        signal: AbortSignal.timeout(2000)
      }
    )
    if (!res.ok) throw new Error('Geo API failed')
    
    const country = await res.text()
    return country?.trim() || 'UNKNOWN'
  } catch (err) {
    console.error('Geo detection error:', err)
    return 'UNKNOWN'
    // If detection fails -> show product (better UX than hiding everything)
  }
}

// Check if product available for visitor
export function isProductAvailable(
  product: {
    availability_type?: string
    available_countries?: string[]
  },
  visitorCountry: string
): boolean {
  // If no geo info or worldwide -> always available
  if (
    !product.availability_type ||
    product.availability_type === 'worldwide' ||
    (product.available_countries && product.available_countries.includes('*'))
  ) {
    return true
  }

  // If restricted -> check country
  if (product.availability_type === 'restricted') {
    return (
      product.available_countries?.includes(
        visitorCountry.toUpperCase()
      ) || false
    )
  }

  return true
}

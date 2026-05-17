import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  price: number, 
  currency = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function formatDate(
  date: string
): string {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(
  text: string, 
  length: number
): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function calculateDiscount(
  price: number, 
  comparePrice: number
): number {
  return Math.round(
    ((comparePrice - price) / comparePrice) * 100
  )
}

export function getSafeImageUrl(
  images: any,
  index: number = 0,
  fallback = '/placeholder-product.png'
): string {
  if (!images) return fallback

  try {
    let imageArray = images
    
    // If it's a string, try to parse it
    if (typeof images === 'string') {
      // Check if it's a raw URL first
      if (images.startsWith('http')) return images
      
      try {
        imageArray = JSON.parse(images)
      } catch (e) {
        // Just return the original string if it is somewhat URL-like, else fallback
        return images.includes('/') ? images : fallback
      }
    }

    if (!Array.isArray(imageArray)) {
      if (typeof imageArray === 'object' && imageArray?.url) {
        // recursively clean if url is a stringified array
        if (typeof imageArray.url === 'string' && imageArray.url.startsWith('[')) {
           try { 
             const parsed = JSON.parse(imageArray.url)
             return Array.isArray(parsed) ? (parsed[0] || fallback) : (parsed.url || fallback)
           } catch(e){}
        }
        return imageArray.url
      }
      return fallback
    }

    const item = imageArray[index] || imageArray[0]
    if (!item) return fallback

    // Handle string in array
    if (typeof item === 'string') {
      // Check if the string itself is a JSON array or object
      if (item.startsWith('[')) {
        try {
          const parsed = JSON.parse(item)
          if (Array.isArray(parsed)) return parsed[0] || fallback
          if (typeof parsed === 'object') return parsed.url || fallback
        } catch(e) {}
      }
      return item
    }

    // Handle object in array
    if (item.url) {
      if (typeof item.url === 'string' && item.url.startsWith('[')) {
        try {
          const parsed = JSON.parse(item.url)
          if (Array.isArray(parsed)) return parsed[0] || fallback
          if (typeof parsed === 'object') return parsed.url || fallback
        } catch(e) {}
      }
      return item.url
    }

    return fallback
  } catch (err) {
    return fallback
  }
}

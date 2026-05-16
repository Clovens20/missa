'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface PlatformPixel {
  tag: string | null
  script: string | null
}

interface PixelConfig {
  facebook: PlatformPixel | null
  tiktok: PlatformPixel | null
  google: PlatformPixel | null
  snapchat: PlatformPixel | null
  pinterest: PlatformPixel | null
  twitter: PlatformPixel | null
  customHead: string | null
  customBody: string | null
}

export default function PixelsInjector({
  pixels,
}: {
  pixels: PixelConfig
}) {
  const pathname = usePathname()

  // Fire PageView on route change for standard pixels
  useEffect(() => {
    // Facebook
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView')
    }
    // TikTok
    if (typeof window !== 'undefined' && (window as any).ttq) {
      (window as any).ttq.page()
    }
    // Pinterest
    if (typeof window !== 'undefined' && (window as any).pintrk) {
      (window as any).pintrk('track', 'pagevisit')
    }
    // Snapchat
    if (typeof window !== 'undefined' && (window as any).snaptr) {
      (window as any).snaptr('track', 'PAGE_VIEW')
    }
    // Google Analytics (GA4 handles page_view auto, but we can force)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: pathname,
      })
    }
  }, [pathname])

  const allPixels = [
    pixels.facebook,
    pixels.tiktok,
    pixels.google,
    pixels.snapchat,
    pixels.pinterest,
    pixels.twitter
  ].filter(Boolean) as PlatformPixel[]

  return (
    <>
      {/* ── ZONE 1 & 2 INJECTION ── */}
      {allPixels.map((p, i) => (
        <div key={i}>
          {p.tag && (
            <div dangerouslySetInnerHTML={{ __html: p.tag }} />
          )}
          {p.script && (
            <div dangerouslySetInnerHTML={{ __html: p.script }} />
          )}
        </div>
      ))}

      {/* ── CUSTOM SCRIPTS ── */}
      {pixels.customHead && (
        <div dangerouslySetInnerHTML={{ __html: pixels.customHead }} />
      )}
      {pixels.customBody && (
        <div dangerouslySetInnerHTML={{ __html: pixels.customBody }} />
      )}
    </>
  )
}

// ── EVENT HELPERS ─────────────────────
// These remain compatible as long as the pasted scripts 
// initialize the global tracking objects (fbq, ttq, gtag, etc.)

export function trackAddToCart(product: any, quantity = 1) {
  const value = (product.price || 0) * quantity
  if (typeof window === 'undefined') return

  // Facebook
  if ((window as any).fbq) {
    (window as any).fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value,
      currency: 'USD',
    })
  }
  // TikTok
  if ((window as any).ttq) {
    (window as any).ttq.track('AddToCart', {
      content_id: product.id,
      content_name: product.name,
      quantity,
      value,
      currency: 'USD',
    })
  }
  // Pinterest
  if ((window as any).pintrk) {
    (window as any).pintrk('track', 'addtocart', {
      value,
      order_quantity: quantity,
      currency: 'USD',
    })
  }
}

export function trackPurchase(order: any) {
  const value = order.total_amount || order.total || 0
  if (typeof window === 'undefined') return

  // Facebook
  if ((window as any).fbq) {
    (window as any).fbq('track', 'Purchase', {
      value,
      currency: 'USD',
      content_type: 'product',
      content_ids: order.items?.map((i: any) => i.product_id),
    })
  }
  // TikTok
  if ((window as any).ttq) {
    (window as any).ttq.track('PlaceAnOrder', { value, currency: 'USD' })
  }
  // Google
  if ((window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: order.order_number,
      value,
      currency: 'USD',
      items: order.items?.map((i: any) => ({
        item_id: i.product_id,
        item_name: i.product_name || i.name,
        quantity: i.quantity || i.qty,
        price: i.price,
      })),
    })
  }
  // Snapchat
  if ((window as any).snaptr) {
    (window as any).snaptr('track', 'PURCHASE', {
      price: value,
      currency: 'USD',
      transaction_id: order.order_number,
    })
  }
}

export function trackInitiateCheckout(cartTotal: number) {
  if (typeof window === 'undefined') return
  if ((window as any).fbq) {
    (window as any).fbq('track', 'InitiateCheckout', {
      value: cartTotal,
      currency: 'USD',
    })
  }
  if ((window as any).ttq) {
    (window as any).ttq.track('InitiateCheckout', {
      value: cartTotal,
      currency: 'USD',
    })
  }
}

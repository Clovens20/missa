import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getTaxRate } from '@/lib/utils'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_dummy_key_for_build',
  { apiVersion: '2024-06-20' as any }
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { items, customerEmail, shippingDetails, currency, rate: reqRate } = await req.json()

    // Dynamically resolve base origin for Stripe redirects (success/cancel)
    const originHeader = req.headers.get('origin') || req.headers.get('referer') || process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'
    let baseOrigin = 'https://www.missashopp.com'
    try {
      baseOrigin = new URL(originHeader).origin
    } catch (e) {
      baseOrigin = originHeader.endsWith('/') ? originHeader.slice(0, -1) : originHeader
    }

    if (!items?.length) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Support dynamic currency (USD or CAD)
    const targetCurrency = (currency || 'usd').toLowerCase()
    const rate = reqRate || 1.0

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: targetCurrency,
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          description: [
            item.variant?.color,
            item.variant?.size,
          ].filter(Boolean).join(' — ') || undefined,
        },
        unit_amount: Math.round((item.price * rate) * 100),
      },
      quantity: item.quantity,
    }))

    // Fetch dynamic shipping settings
    const { data: siteSettingsRes } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['free_shipping_threshold', 'shipping_fee_standard', 'shipping_fee_express'])
    
    let freeShippingThreshold = 100
    let standardShippingFee = 8.99
    let expressShippingFee = 9.99

    siteSettingsRes?.forEach(row => {
      if (row.key === 'free_shipping_threshold') freeShippingThreshold = Number(row.value) || 100
      if (row.key === 'shipping_fee_standard') standardShippingFee = Number(row.value) || 8.99
      if (row.key === 'shipping_fee_express') expressShippingFee = Number(row.value) || 9.99
    })

    // Calculate subtotal, shipping, and tax matching local calculations
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : standardShippingFee
    
    // Dynamic taxes using our new lib/tax cache-based system
    const { calculateTax } = await import('@/lib/tax')
    const { rate: taxRate, amount: tax, name: taxName } = await calculateTax(
      subtotal,
      shippingDetails?.country || 'CA',
      shippingDetails?.state || 'QC'
    )
    const grandTotal = subtotal + shippingCost + tax

    // Append Tax as a line item so Stripe charges it
    const convertedTax = Math.round((tax * rate) * 100)
    if (convertedTax > 0) {
      lineItems.push({
        price_data: {
          currency: targetCurrency,
          product_data: {
            name: `${taxName} (${(taxRate * 100).toFixed(3).replace(/\.?0+$/, '')}%)`,
          },
          unit_amount: convertedTax,
        },
        quantity: 1,
      })
    }

    const convertedShipping = Math.round((shippingCost * rate) * 100)
    const convertedExpress = Math.round((expressShippingFee * rate) * 100)

    const orderNumber = 'MS-' + Date.now().toString().slice(-8)

    // Pre-determine shipping allowed countries
    const hasLocalProducts = items.some((item: any) => {
      const isDropship = item.is_dropship || item.product?.is_dropship || false
      return !isDropship
    })

    const WORLDWIDE_COUNTRIES = [
      'CA', 'US', 'HT', 'FR', 'BE', 'CH', 'GB', 'DE', 'IT', 'ES', 'NL', 'PT', 'IE', 'AT', 'DK', 'SE', 'NO', 'FI', 'LU', 'MC', 
      'GP', 'MQ', 'GF', 'RE', 'YT', 'PF', 'NC', 'CI', 'SN', 'MA', 'DZ', 'TN', 'CD', 'CM', 'GA', 'CG', 'BJ', 'TG', 'GN', 'ML'
    ]

    const allowedCountries = hasLocalProducts 
      ? ['CA', 'US', 'HT', 'GP', 'MQ', 'GF']
      : WORLDWIDE_COUNTRIES

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      locale: 'fr',
      currency: targetCurrency,
      customer_email: customerEmail || undefined,

      shipping_address_collection: {
        allowed_countries: allowedCountries as any,
      },

      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: convertedShipping,
              currency: targetCurrency,
            },
            display_name: '📦 Livraison standard',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 7 },
              maximum: { unit: 'business_day', value: 15 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: convertedExpress,
              currency: targetCurrency,
            },
            display_name: '⚡ Livraison express',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
      ],

      allow_promotion_codes: true,
      
      phone_number_collection: {
        enabled: true,
      },

      success_url: `${baseOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseOrigin}/checkout`,

      metadata: {
        source: 'missashopp.com',
        items_count: items.length.toString(),
        order_number: orderNumber
      },
    })

    // Pre-insert into guest_orders so we don't lose items array and CJ variants info
    const guestOrderData = {
      order_number: orderNumber,
      stripe_session_id: session.id,
      email: customerEmail || shippingDetails?.email || '',
      first_name: shippingDetails?.firstName || '',
      last_name: shippingDetails?.lastName || '',
      phone: shippingDetails?.phone || '',
      items: items.map((item: any) => ({
        product_id: item.product_id || item.product?.id || item.id,
        name: item.name,
        price: item.price,
        qty: item.quantity,
        image: item.image,
        variant: item.variant || null,
        variant_id: item.variant?.id || item.variant_id || null,
        is_dropship: item.is_dropship || item.product?.is_dropship || false,
        cj_price: item.cj_price || item.product?.cj_price || item.price
      })),
      subtotal: subtotal,
      shipping: shippingCost,
      tax: tax,
      total: grandTotal,
      shipping_address: {
        address: shippingDetails?.address || '',
        city: shippingDetails?.city || '',
        state: shippingDetails?.state || '',
        zip: shippingDetails?.zip || '',
        country: shippingDetails?.country || 'CA',
      },
      payment_method: 'card',
      payment_status: 'pending',
      order_status: 'pending',
      notes: shippingDetails?.notes || '',
      currency: targetCurrency.toUpperCase(),
    }

    const { error: insertErr } = await supabase
      .from('guest_orders')
      .insert(guestOrderData)

    if (insertErr) {
      console.error('Error pre-inserting guest_order:', insertErr)
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })

  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

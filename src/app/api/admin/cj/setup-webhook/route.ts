import { NextResponse } from 'next/server'
import { getCJToken } from '@/lib/cj-token'

export async function POST() {
  try {
    const token = await getCJToken()
    
    // Use the public app URL for the webhook callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL is not defined' }, { status: 500 })
    }

    const webhookUrl = `${appUrl}/api/webhooks/cj`
    
    console.log('Registering CJ Webhook at:', webhookUrl)

    const res = await fetch(
      'https://developers.cjdropshipping.com/api2.0/v1/webhook/set',
      {
        method: 'POST',
        headers: {
          'CJ-Access-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product: {
            type: 'ENABLE',
            callbackUrls: [webhookUrl]
          },
          stock: {
            type: 'ENABLE', 
            callbackUrls: [webhookUrl]
          },
          order: {
            type: 'ENABLE',
            callbackUrls: [webhookUrl]
          },
          logistics: {
            type: 'ENABLE',
            callbackUrls: [webhookUrl]
          }
        })
      }
    )
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getCJToken } from '@/lib/cj-token'

/**
 * CJ Webhook Setup Tool
 * Registers missashopp.com as the official endpoint for CJ5419707
 */
export async function GET() {
  try {
    const token = await getCJToken()
    if (!token) {
      return NextResponse.json({ error: 'Failed to get CJ Token' }, { status: 401 })
    }

    const WEBHOOK_URL = 'https://missashopp.com/api/webhooks/cj'
    
    // CJ API v2 Webhook Registration Endpoint
    const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/register', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callbackUrl: WEBHOOK_URL,
        // Subscribing to all critical events
        events: [
          'STOCK_CHANGE',
          'ORDER_STATUS_CHANGE',
          'TRACKING_NUMBER_UPDATE',
          'PRODUCT_STATUS_CHANGE'
        ]
      })
    })

    const data = await res.json()

    if (data.code === 200) {
      return NextResponse.json({
        success: true,
        message: 'Félicitations ! Votre site missashopp.com est maintenant lié à CJ Dropshipping.',
        data: data.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.message,
        details: 'Assurez-vous que votre Store ID CJ5419707 est bien actif.'
      }, { status: 400 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

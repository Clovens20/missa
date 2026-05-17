import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_RATES = {
  "CA_QC": { "name": "TPS + TVQ", "rate": 14.975, "enabled": false },
  "CA_ON": { "name": "HST Ontario", "rate": 13.00, "enabled": false },
  "CA_BC": { "name": "GST + PST BC", "rate": 12.00, "enabled": false },
  "CA_AB": { "name": "GST Alberta", "rate": 5.00, "enabled": false },
  "CA_MB": { "name": "GST + PST Manitoba", "rate": 12.00, "enabled": false },
  "CA_NB": { "name": "HST New Brunswick", "rate": 15.00, "enabled": false },
  "CA_NL": { "name": "HST Newfoundland", "rate": 15.00, "enabled": false },
  "CA_NS": { "name": "HST Nova Scotia", "rate": 15.00, "enabled": false },
  "CA_PE": { "name": "HST PEI", "rate": 15.00, "enabled": false },
  "CA_SK": { "name": "GST + PST Saskatchewan", "rate": 11.00, "enabled": false },
  "CA_NT": { "name": "GST NWT", "rate": 5.00, "enabled": false },
  "CA_NU": { "name": "GST Nunavut", "rate": 5.00, "enabled": false },
  "CA_YT": { "name": "GST Yukon", "rate": 5.00, "enabled": false }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('key, value')
      .in('key', ['tax_enabled', 'tax_rates'])

    if (error) {
      return NextResponse.json({
        tax_enabled: false,
        tax_rates: DEFAULT_RATES
      })
    }

    const settings: Record<string, any> = {}
    data?.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    })

    return NextResponse.json({
      tax_enabled: settings.tax_enabled === true || settings.tax_enabled === 'true',
      tax_rates: settings.tax_rates || DEFAULT_RATES
    })
  } catch (err) {
    return NextResponse.json({
      tax_enabled: false,
      tax_rates: DEFAULT_RATES
    })
  }
}

export async function POST(req: Request) {
  try {
    const { tax_enabled, tax_rates } = await req.json()

    // 1. Create table IF NOT EXISTS (just in case they forgot)
    // We can't do this via standard supabase client easily, but we can upsert.
    // If the table doesn't exist, we will return a 500 error asking to run DDL.
    const { error: err1 } = await supabase
      .from('shop_settings')
      .upsert({
        key: 'tax_enabled',
        value: JSON.stringify(tax_enabled)
      }, { onConflict: 'key' })

    const { error: err2 } = await supabase
      .from('shop_settings')
      .upsert({
        key: 'tax_rates',
        value: JSON.stringify(tax_rates)
      }, { onConflict: 'key' })

    if (err1 || err2) {
      console.error('Error saving settings to shop_settings:', err1 || err2)
      return NextResponse.json(
        { error: 'Failed to save settings. Please ensure that you have executed the tax_setup.sql script in your Supabase SQL Editor.' },
        { status: 500 }
      )
    }

    // Clear backend cache so settings take effect instantly
    try {
      const { clearTaxCache } = await import('@/lib/tax')
      clearTaxCache()
    } catch (e) {
      console.error('Failed to clear tax cache:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

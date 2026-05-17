import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_RATES: Record<string, { name: string, rate: number, enabled: boolean }> = {
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

interface TaxSettings {
  tax_enabled: boolean
  tax_rates: Record<string, { name: string, rate: number, enabled: boolean }>
}

let cachedSettings: TaxSettings | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache

export async function getTaxSettings(): Promise<TaxSettings> {
  const now = Date.now()
  if (cachedSettings && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedSettings
  }

  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('key, value')
      .in('key', ['tax_enabled', 'tax_rates'])

    if (error || !data || data.length === 0) {
      return {
        tax_enabled: false,
        tax_rates: DEFAULT_RATES
      }
    }

    const settings: Record<string, any> = {}
    data.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    })

    const taxSettings = {
      tax_enabled: settings.tax_enabled === true || settings.tax_enabled === 'true',
      tax_rates: settings.tax_rates || DEFAULT_RATES
    }

    cachedSettings = taxSettings
    cacheTimestamp = now

    return taxSettings
  } catch (err) {
    console.error('Error fetching tax settings:', err)
    return {
      tax_enabled: false,
      tax_rates: DEFAULT_RATES
    }
  }
}

export async function calculateTax(
  subtotal: number,
  country: string,
  state: string
): Promise<{ rate: number, amount: number, name: string }> {
  const settings = await getTaxSettings()
  
  if (!settings.tax_enabled) {
    return { rate: 0, amount: 0, name: '' }
  }

  const upperCountry = country?.toUpperCase()
  const upperState = state?.toUpperCase()

  // Taxes only apply to Canada (CA)
  if (upperCountry !== 'CA') {
    return { rate: 0, amount: 0, name: '' }
  }

  const key = `CA_${upperState}`
  const provSettings = settings.tax_rates[key]

  if (provSettings && provSettings.enabled) {
    const rateDecimal = provSettings.rate / 100
    const amount = subtotal * rateDecimal
    return {
      rate: rateDecimal,
      amount,
      name: provSettings.name
    }
  }

  return { rate: 0, amount: 0, name: '' }
}
export function clearTaxCache() {
  cachedSettings = null
  cacheTimestamp = 0
}

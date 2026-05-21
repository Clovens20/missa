'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', flag: '🇺🇸' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar (CAD)', flag: '🇨🇦' }
]

export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0, // Base currency
  CAD: 1.36 // Default exchange rate
}

interface CurrencyContextType {
  currency: string
  rate: number
  rates: Record<string, number>
  loading: boolean
  setCurrency: (code: string) => void
  formatLocalPrice: (amountInUSD: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'CAD',
  rate: 1.36,
  rates: FALLBACK_EXCHANGE_RATES,
  loading: true,
  setCurrency: () => {},
  formatLocalPrice: (amount) => `$${amount.toFixed(2)}`
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('CAD')
  const [rate, setRate] = useState<number>(1.36)
  const rates = FALLBACK_EXCHANGE_RATES
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load from cookie first
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const savedCurrency = getCookie('NEXT_LOCALE_CURRENCY') || 'CAD'
    if (SUPPORTED_CURRENCIES.some(c => c.code === savedCurrency)) {
      setCurrencyState(savedCurrency)
      setRate(rates[savedCurrency] || 1.36)
    }
    setLoading(false)
  }, [rates])

  const setCurrency = (code: string) => {
    if (!SUPPORTED_CURRENCIES.some(c => c.code === code)) return
    
    setCurrencyState(code)
    setRate(rates[code] || 1.0)
    
    // Save to cookie for 1 year so SSR can read it
    document.cookie = `NEXT_LOCALE_CURRENCY=${code}; path=/; max-age=31536000`
    
    // Set global variables for utility functions
    if (typeof window !== 'undefined') {
      ;(window as any).__currencyCode = code
      ;(window as any).__currencyRate = rates[code] || 1.0
    }
  }

  // Update globals whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__currencyCode = currency
      ;(window as any).__currencyRate = rate
    }
  }, [currency, rate])

  const formatLocalPrice = (amountInUSD: number): string => {
    const convertedAmount = amountInUSD * rate
    
    // French-Canadian formatting for CAD, US English formatting for USD
    const locale = currency === 'CAD' ? 'fr-CA' : 'en-US'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount)
  }

  return (
    <CurrencyContext.Provider value={{ currency, rate, rates, loading, setCurrency, formatLocalPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

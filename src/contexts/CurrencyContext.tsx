'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export const SUPPORTED_CURRENCIES = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar (CAD)', flag: '🇨🇦' }
]

export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  CAD: 1.0
}

interface CurrencyContextType {
  currency: string
  rate: number
  rates: Record<string, number>
  loading: boolean
  setCurrency: (code: string) => void
  formatLocalPrice: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'CAD',
  rate: 1.0,
  rates: { CAD: 1.0 },
  loading: false,
  setCurrency: () => {},
  formatLocalPrice: (amount) => `${amount.toFixed(2)} $`
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = 'CAD'
  const rate = 1.0
  const rates = { CAD: 1.0 }
  const loading = false

  const setCurrency = (_code: string) => {
    // No-op, strictly CAD
  }

  const formatLocalPrice = (amount: number): string => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Set global singletons on window for static formatPrice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__currencyCode = 'CAD'
      ;(window as any).__currencyRate = 1.0
    }
  }, [])

  return (
    <CurrencyContext.Provider value={{ currency, rate, rates, loading, setCurrency, formatLocalPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

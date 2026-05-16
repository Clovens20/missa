'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getVisitorCountry } from '@/lib/geo-detect'

interface CountryContextType {
  country: string
  loading: boolean
}

const CountryContext = createContext<CountryContextType>({
  country: 'UNKNOWN',
  loading: true
})

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState('UNKNOWN')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get country from localStorage first for speed
    const saved = localStorage.getItem('visitor_country')
    if (saved) {
      setCountry(saved)
      setLoading(false)
    }

    // Always fetch fresh detection in background
    getVisitorCountry().then(detected => {
      setCountry(detected)
      localStorage.setItem('visitor_country', detected)
      setLoading(false)
    })
  }, [])

  return (
    <CountryContext.Provider value={{ country, loading }}>
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => useContext(CountryContext)

'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

interface SettingsContextType {
  settings: Record<string, any>
  loading: boolean
  getSetting: (key: string, defaultValue?: any) => any
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/shop/settings')
        const json = await res.json()
        if (json.data) {
          setSettings(json.data)
        }
      } catch (err) {
        console.error('Failed to load site settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const getSetting = (key: string, defaultValue: any = '') => {
    const val = settings[key]
    if (val === undefined || val === null) return defaultValue
    
    // Clean up strings that might be wrapped in quotes if stored that way
    if (typeof val === 'string') {
      return val.replace(/^"|"$/g, '')
    }
    return val
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, getSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

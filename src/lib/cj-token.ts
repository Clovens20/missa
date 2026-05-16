interface CJTokenCache {
  accessToken: string
  refreshToken: string
  accessTokenExpiryDate: string
  refreshTokenExpiryDate: string
  cachedAt: number
}

// In-memory cache (server-side)
let tokenCache: CJTokenCache | null = null

export async function getCJToken(): Promise<string> {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const twoDaysMs = 2 * oneDayMs

  // Check if cached token is valid (refresh 2 days before expiry)
  if (tokenCache) {
    const expiryDate = new Date(tokenCache.accessTokenExpiryDate).getTime()
    
    // Still valid? Return cached
    if (expiryDate - now > twoDaysMs) {
      return tokenCache.accessToken
    }
    
    // Expiring soon? Use refreshToken
    const refreshExpiry = new Date(tokenCache.refreshTokenExpiryDate).getTime()
    
    if (refreshExpiry - now > oneDayMs) {
      // Refresh the token
      const refreshed = await refreshCJToken(tokenCache.refreshToken)
      if (refreshed) {
        tokenCache = {
          ...refreshed,
          cachedAt: now
        }
        return refreshed.accessToken
      }
    }
  }

  // Get new token
  const newToken = await getNewCJToken()
  if (newToken) {
    tokenCache = {
      ...newToken,
      cachedAt: now
    }
    return (newToken as any).accessToken
  }

  throw new Error('CJ: Cannot get token')
}

async function getNewCJToken() {
  if (!process.env.CJ_API_KEY) {
    console.error('CJ_API_KEY is missing in env')
    return null
  }

  const res = await fetch(
    'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: process.env.CJ_API_KEY
      })
    }
  )
  const data = await res.json()
  if (data.code === 200) {
    return data.data
  }
  return null
}

async function refreshCJToken(refreshToken: string) {
  const res = await fetch(
    'https://developers.cjdropshipping.com/api2.0/v1/authentication/refreshAccessToken',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    }
  )
  const data = await res.json()
  if (data.code === 200) {
    return data.data
  }
  return null
}

// Generate or get a unique session ID for the visitor

export function getSessionId(): string {
  if (typeof window === 'undefined') 
    return ''
  
  let sessionId = localStorage.getItem('missa-session-id')
  
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('missa-session-id', sessionId)
  }
  
  return sessionId
}

export function generateOrderNumber(): string {
  const prefix = 'MS'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

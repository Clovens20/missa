import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// (works for single Vercel instance or serverless warmup execution context)
const rateLimit = new Map<
  string, 
  { count: number; resetTime: number }
>()

const LIMIT = 10        // max requests
const WINDOW = 60000    // 1 minute ms

function getRateLimit(ip: string) {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, {
      count: 1,
      resetTime: now + WINDOW,
    })
    return { allowed: true, remaining: 9 }
  }

  if (record.count >= LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { 
    allowed: true, 
    remaining: LIMIT - record.count 
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rate limiting check for checkout API
  if (pathname.startsWith('/api/checkout')) {
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0] 
      || request.headers.get('x-real-ip')
      || '127.0.0.1'

    const { allowed } = getRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Trop de tentatives. Réessayez dans 1 min.',
          code: 'RATE_LIMITED'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(LIMIT),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }
  }

  // 2. Protect /admin routes (existing logic)
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('missa-admin-token')?.value
    
    // Allow /admin/login always
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Redirect to login if no token
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/checkout/:path*'],
}

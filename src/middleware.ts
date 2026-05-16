import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin routes
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
  matcher: ['/admin/:path*']
}

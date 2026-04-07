import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/signup']
const publicApiRoutes = ['/api/auth/', '/api/health']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Allow public API routes (auth endpoints)
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for protected API routes
  const protectedApiRoutes = ['/api/chat', '/api/chats', '/api/user']
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))

  if (isProtectedApiRoute) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Add token to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${token}`)

    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  }

  // Check for protected page routes
  if (pathname.startsWith('/chat') || pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

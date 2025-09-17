import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Always allow health endpoint (for Railway healthchecks) - bypass all auth
  if (pathname === '/api/health') {
    return NextResponse.next()
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/signup',
    '/api/test',
    '/api/workflows',
    '/uploads',
  ]

  // Check if the current path is public or starts with public API routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Allow access to NextAuth API routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // If user is not authenticated and trying to access protected route, redirect to sign in
  if (!req.auth) {
    const signInUrl = new URL('/', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/health (healthcheck endpoint)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}
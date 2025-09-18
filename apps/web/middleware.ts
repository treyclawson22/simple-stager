import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Always allow health endpoint (for Railway healthchecks)
  if (pathname === '/api/health') {
    return NextResponse.next()
  }
  
  // Allow NextAuth API routes to function properly
  if (pathname.startsWith('/api/auth/')) {
    console.log(`Auth middleware: ${pathname}`)
    return NextResponse.next()
  }
  
  // Log other routes for debugging
  console.log(`Middleware: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Include NextAuth API routes and exclude only static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
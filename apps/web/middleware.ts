import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Temporarily simplified middleware to isolate edge runtime issues
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Allow all routes for now to test application startup
  console.log(`Middleware: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match non-static paths and exclude API endpoints
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
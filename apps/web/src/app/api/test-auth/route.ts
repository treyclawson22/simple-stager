import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { cookies } from 'next/headers'

// Test endpoint to create a session for testing dashboard authentication
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: email || 'test@example.com' }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // For testing purposes, create a simple session token
    // In production, this would be handled by NextAuth
    const sessionToken = `test-session-${user.id}-${Date.now()}`
    
    // Set a cookie to simulate authentication
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits
      },
      sessionToken
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

// Get current test session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('next-auth.session-token')
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Extract user ID from test token
    const tokenParts = sessionToken.value.split('-')
    if (tokenParts.length >= 3) {
      const userId = tokenParts[2]
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (user) {
        return NextResponse.json({ 
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            credits: user.credits
          }
        })
      }
    }
    
    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error('Test auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
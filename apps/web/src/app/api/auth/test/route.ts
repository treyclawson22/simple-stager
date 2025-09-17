import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Auth test endpoint called')
    
    const session = await auth()
    console.log('Session:', JSON.stringify(session, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      session,
      hasSession: !!session,
      user: session?.user || null
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Auth test POST:', body)
    
    // Test credentials manually
    if (body.action === 'test-credentials') {
      const { email, password, name, isSignUp } = body
      
      console.log('Testing credentials:', { email, isSignUp })
      
      // Import providers directly to test
      const { providers } = await import('@/lib/auth')
      
      return NextResponse.json({
        success: true,
        message: 'Test endpoint working',
        data: { email, isSignUp }
      })
    }
    
    return NextResponse.json({ success: false, error: 'Unknown action' })
  } catch (error) {
    console.error('Auth test POST error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
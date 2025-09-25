import { NextRequest, NextResponse } from 'next/server'
import { highLevelCRM } from '@/lib/highlevel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'
    
    switch (action) {
      case 'test':
        return NextResponse.json({
          status: 'HighLevel CRM integration ready',
          configured: !!process.env.HIGHLEVEL_API_KEY,
          timestamp: new Date().toISOString()
        })
        
      case 'test_signup':
        const email = searchParams.get('email') || 'test@example.com'
        const name = searchParams.get('name') || 'Test User'
        
        const signupResult = await highLevelCRM.processSignup({
          email,
          name,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ')
        })
        
        let funnelResult = null
        if (signupResult.contactId) {
          funnelResult = await highLevelCRM.addToCreatedAccountFunnel(signupResult.contactId)
        }
        
        return NextResponse.json({
          action: 'test_signup',
          signupResult,
          funnelResult,
          timestamp: new Date().toISOString()
        })
        
      case 'test_subscription':
        const subEmail = searchParams.get('email') || 'test@example.com'
        const planName = searchParams.get('plan') || 'entry'
        const amount = parseInt(searchParams.get('amount') || '24')
        
        const subscriptionResult = await highLevelCRM.processSubscription({
          email: subEmail,
          planName,
          amount
        })
        
        return NextResponse.json({
          action: 'test_subscription',
          subscriptionResult,
          timestamp: new Date().toISOString()
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('HighLevel test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    switch (action) {
      case 'signup':
        const signupResult = await highLevelCRM.processSignup(data)
        
        let funnelResult = null
        if (signupResult.contactId) {
          funnelResult = await highLevelCRM.addToCreatedAccountFunnel(signupResult.contactId)
        }
        
        return NextResponse.json({
          success: true,
          signupResult,
          funnelResult
        })
        
      case 'subscription':
        const subscriptionResult = await highLevelCRM.processSubscription(data)
        
        return NextResponse.json({
          success: true,
          subscriptionResult
        })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('HighLevel test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
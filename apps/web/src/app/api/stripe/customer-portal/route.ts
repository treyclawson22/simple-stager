import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const { return_url } = await request.json()

    if (!return_url) {
      return NextResponse.json({ error: 'Return URL is required' }, { status: 400 })
    }

    console.log(`🔧 Creating customer portal session for customer ${user.stripeCustomerId}`)

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: return_url,
    })

    console.log(`✅ Customer portal session created: ${portalSession.id}`)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe customer portal creation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to create customer portal session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
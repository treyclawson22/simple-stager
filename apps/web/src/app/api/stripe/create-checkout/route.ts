import { NextRequest, NextResponse } from 'next/server'
import { stripe, SUBSCRIPTION_PLANS, CREDIT_PACKS } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, type } = await request.json()

    if (!planId || !type) {
      return NextResponse.json({ error: 'Plan ID and type are required' }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })
      
      stripeCustomerId = stripeCustomer.id
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      })
    }

    let sessionConfig: any = {
      customer: stripeCustomerId,
      line_items: [],
      mode: type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
        type,
      },
    }

    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]
      if (!plan) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 })
      }

      sessionConfig.line_items = [{
        price: plan.stripePriceId,
        quantity: 1,
      }]

      // Add subscription metadata
      sessionConfig.subscription_data = {
        metadata: {
          userId: user.id,
          planId,
          credits: plan.credits.toString(),
        },
      }
    } else if (type === 'credit_pack') {
      const pack = CREDIT_PACKS[planId as keyof typeof CREDIT_PACKS]
      if (!pack) {
        return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
      }

      sessionConfig.line_items = [{
        price: pack.stripePriceId,
        quantity: 1,
      }]

      // Add credit pack metadata
      sessionConfig.payment_intent_data = {
        metadata: {
          userId: user.id,
          packId: planId,
          credits: pack.credits.toString(),
        },
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 })
  }
}
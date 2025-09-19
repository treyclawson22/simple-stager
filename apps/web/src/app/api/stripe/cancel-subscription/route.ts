import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    console.log(`🔧 Canceling subscription ${subscriptionId} for user ${user.id}`)

    // Verify the subscription belongs to this user
    const userPlan = await prisma.plan.findFirst({
      where: {
        userId: user.id,
        stripeSubscriptionId: subscriptionId,
        status: 'active'
      }
    })

    if (!userPlan) {
      return NextResponse.json({ error: 'Subscription not found or not active' }, { status: 404 })
    }

    // Cancel the subscription at period end (user keeps access until billing cycle ends)
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    console.log(`✅ Subscription ${subscriptionId} set to cancel at period end`)
    console.log(`📅 Will cancel on: ${new Date(canceledSubscription.current_period_end * 1000).toLocaleDateString()}`)

    // Update the plan status in our database
    await prisma.plan.update({
      where: { id: userPlan.id },
      data: {
        status: 'canceling' // Custom status to indicate it will cancel at period end
      }
    })

    // Add a ledger entry for the cancellation
    await prisma.creditLedger.create({
      data: {
        userId: user.id,
        delta: 0, // No credit change
        reason: 'subscription_canceled',
        expiresAt: null,
        meta: JSON.stringify({
          stripeSubscriptionId: subscriptionId,
          planName: userPlan.name,
          canceledAt: new Date().toISOString(),
          endsAt: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
          note: 'Subscription set to cancel at period end - credits preserved'
        })
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Subscription canceled successfully',
      endsAt: new Date(canceledSubscription.current_period_end * 1000).toISOString()
    })
  } catch (error) {
    console.error('Stripe subscription cancellation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
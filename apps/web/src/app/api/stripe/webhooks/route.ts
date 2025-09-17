import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@simple-stager/database'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No user ID in checkout session metadata')
    return
  }

  if (session.mode === 'payment') {
    // Handle one-time credit pack purchase
    await handleCreditPackPurchase(session)
  } else if (session.mode === 'subscription') {
    // Subscription will be handled in subscription.created event
    console.log('Subscription checkout completed, will be handled in subscription.created')
  }
}

async function handleCreditPackPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const credits = parseInt(session.metadata?.credits || '0')
  
  if (!userId || !credits) {
    console.error('Missing userId or credits in checkout session metadata')
    return
  }

  // Add credits to user account
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: credits
      }
    }
  })

  // Add credit ledger entry
  await prisma.creditLedger.create({
    data: {
      userId,
      delta: credits,
      reason: 'purchase',
      meta: JSON.stringify({
        stripeSessionId: session.id,
        amount: session.amount_total,
        currency: session.currency,
      })
    }
  })

  console.log(`Added ${credits} credits to user ${userId}`)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const planId = subscription.metadata?.planId
  const credits = parseInt(subscription.metadata?.credits || '0')

  if (!userId || !planId || !credits) {
    console.error('Missing metadata in subscription:', subscription.metadata)
    return
  }

  // Create or update plan record
  const plan = await prisma.plan.upsert({
    where: { 
      userId_name: {
        userId,
        name: planId
      }
    },
    update: {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    create: {
      userId,
      name: planId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    }
  })

  // Add initial subscription credits
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: credits
      }
    }
  })

  // Add credit ledger entry
  await prisma.creditLedger.create({
    data: {
      userId,
      delta: credits,
      reason: 'subscription',
      meta: JSON.stringify({
        stripeSubscriptionId: subscription.id,
        planId,
        period: 'initial'
      })
    }
  })

  console.log(`Created subscription ${subscription.id} for user ${userId} with ${credits} credits`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('No user ID in subscription metadata')
    return
  }

  // Update plan record
  await prisma.plan.updateMany({
    where: { 
      userId,
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    }
  })

  console.log(`Updated subscription ${subscription.id} for user ${userId}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.error('No user ID in subscription metadata')
    return
  }

  // Update plan status to canceled
  await prisma.plan.updateMany({
    where: { 
      userId,
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: 'canceled'
    }
  })

  console.log(`Canceled subscription ${subscription.id} for user ${userId}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === 'subscription_cycle') {
    // Handle recurring subscription payment
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId
    const credits = parseInt(subscription.metadata?.credits || '0')

    if (!userId || !credits) {
      console.error('Missing metadata in subscription for invoice payment')
      return
    }

    // Add monthly credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: credits
        }
      }
    })

    // Add credit ledger entry
    await prisma.creditLedger.create({
      data: {
        userId,
        delta: credits,
        reason: 'subscription',
        meta: JSON.stringify({
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscription.id,
          period: 'recurring'
        })
      }
    })

    console.log(`Added ${credits} monthly credits to user ${userId}`)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - could send email notification, etc.
  console.log(`Payment failed for invoice ${invoice.id}`)
  
  // You might want to:
  // - Send email notification to user
  // - Update subscription status 
  // - Implement retry logic
}
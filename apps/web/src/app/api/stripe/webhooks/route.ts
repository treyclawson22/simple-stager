import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@simple-stager/database'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log('🔥 Stripe webhook received!')
  console.log('🔧 Request method:', request.method)
  console.log('🔧 Request URL:', request.url)
  console.log('🔧 Headers:', Object.fromEntries(request.headers.entries()))
  
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured in environment variables')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('❌ No stripe-signature header found')
    return NextResponse.json({ error: 'No signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log(`✅ Webhook signature verified for event: ${event.type}`)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    console.error('Webhook secret (first 10 chars):', webhookSecret.substring(0, 10))
    console.error('Signature (first 50 chars):', signature.substring(0, 50))
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    console.log(`🎯 Processing event type: ${event.type}`)
    console.log(`🎯 Event ID: ${event.id}`)
    console.log(`🎯 Event data:`, JSON.stringify(event.data, null, 2))
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🛒 Handling checkout.session.completed')
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        console.log('✅ checkout.session.completed processed successfully')
        break
      
      case 'customer.subscription.created':
        console.log('📋 Handling customer.subscription.created')
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        console.log('✅ customer.subscription.created processed successfully')
        break
      
      case 'customer.subscription.updated':
        console.log('🔄 Handling customer.subscription.updated')
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        console.log('✅ customer.subscription.updated processed successfully')
        break
      
      case 'customer.subscription.deleted':
        console.log('❌ Handling customer.subscription.deleted')
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        console.log('✅ customer.subscription.deleted processed successfully')
        break
      
      case 'invoice.payment_succeeded':
        console.log('💰 Handling invoice.payment_succeeded')
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        console.log('✅ invoice.payment_succeeded processed successfully')
        break
      
      case 'invoice.payment_failed':
        console.log('💸 Handling invoice.payment_failed')
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        console.log('✅ invoice.payment_failed processed successfully')
        break
      
      default:
        console.log(`❓ Unhandled event type: ${event.type}`)
    }

    console.log('🎉 Webhook processing completed successfully')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Event type:', event?.type)
    console.error('❌ Event ID:', event?.id)
    
    // Return 200 to prevent Stripe from retrying, but log the error
    // This prevents webhook failures from blocking user payments
    return NextResponse.json({ 
      received: true, 
      error: 'Handler failed but acknowledged',
      eventType: event?.type,
      eventId: event?.id
    }, { status: 200 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🛒 handleCheckoutSessionCompleted - START')
  console.log('🛒 Session ID:', session.id)
  console.log('🛒 Session mode:', session.mode)
  console.log('🛒 Session metadata:', JSON.stringify(session.metadata, null, 2))
  
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('❌ No user ID in checkout session metadata')
    return
  }

  console.log('🛒 User ID found:', userId)
  
  if (session.mode === 'payment') {
    console.log('🛒 Processing one-time credit pack purchase')
    await handleCreditPackPurchase(session)
    console.log('🛒 Credit pack purchase completed')
  } else if (session.mode === 'subscription') {
    console.log('🛒 Subscription checkout completed, will be handled in subscription.created')
  }
  
  console.log('🛒 handleCheckoutSessionCompleted - END')
}

async function handleCreditPackPurchase(session: Stripe.Checkout.Session) {
  console.log('💳 handleCreditPackPurchase - START')
  console.log('💳 Session:', JSON.stringify(session, null, 2))
  
  const userId = session.metadata?.userId
  const credits = parseInt(session.metadata?.credits || '0')
  
  console.log('💳 Extracted userId:', userId)
  console.log('💳 Extracted credits:', credits)
  
  if (!userId || !credits) {
    console.error('❌ Missing userId or credits in checkout session metadata')
    console.error('❌ userId:', userId)
    console.error('❌ credits:', credits)
    console.error('❌ metadata:', JSON.stringify(session.metadata, null, 2))
    return
  }

  try {
    console.log('💳 Updating user credits in database...')
    // Add credits to user account
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: credits
        }
      }
    })
    console.log('💳 User updated successfully:', updatedUser)

    console.log('💳 Creating credit ledger entry...')
    // Add credit ledger entry (credit packs never expire)
    const ledgerEntry = await prisma.creditLedger.create({
      data: {
        userId,
        delta: credits,
        reason: 'purchase',
        expiresAt: null, // Credit pack purchases never expire
        meta: JSON.stringify({
          stripeSessionId: session.id,
          amount: session.amount_total,
          currency: session.currency,
        })
      }
    })
    console.log('💳 Ledger entry created successfully:', ledgerEntry)

    console.log(`✅ Successfully added ${credits} credits to user ${userId}`)
  } catch (error) {
    console.error('❌ Database error in handleCreditPackPurchase:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    throw error
  }
  
  console.log('💳 handleCreditPackPurchase - END')
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🎯 Processing subscription.created: ${subscription.id}`)
  
  try {
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId
    const credits = parseInt(subscription.metadata?.credits || '0')

    console.log('Subscription metadata:', {
      userId,
      planId,
      credits,
      subscriptionId: subscription.id
    })

    if (!userId || !planId || !credits) {
      console.error('❌ Missing metadata in subscription:', subscription.metadata)
      throw new Error(`Missing metadata: userId=${userId}, planId=${planId}, credits=${credits}`)
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

  // Add initial subscription credits (full amount for new subscriptions)
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: credits
      }
    }
  })

  // Add credit ledger entry (subscription credits expire after 60 days)
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 60)
  
  await prisma.creditLedger.create({
    data: {
      userId,
      delta: credits,
      reason: 'subscription',
      expiresAt: expirationDate, // Subscription credits expire after 60 days
      meta: JSON.stringify({
        stripeSubscriptionId: subscription.id,
        planId,
        period: 'initial'
      })
    }
  })

  console.log(`Created subscription ${subscription.id} for user ${userId} with ${credits} credits`)
  
  } catch (error) {
    console.error(`❌ handleSubscriptionCreated failed for ${subscription.id}:`, error)
    throw error // Re-throw to be caught by main handler
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 Processing subscription.updated: ${subscription.id}`)
  
  try {
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId
    const credits = parseInt(subscription.metadata?.credits || '0')

    console.log('Subscription updated metadata:', {
      userId,
      planId,
      credits,
      subscriptionId: subscription.id,
      status: subscription.status
    })

    if (!userId) {
      console.error('❌ No user ID in subscription metadata')
      throw new Error('Missing userId in subscription metadata')
    }

    // Check if this is a plan change (different planId)
    const existingPlan = await prisma.plan.findFirst({
      where: { 
        userId,
        stripeSubscriptionId: subscription.id
      }
    })

    console.log('Existing plan:', existingPlan)

    if (existingPlan && planId && existingPlan.name !== planId) {
      console.log(`🔄 Plan upgrade detected: ${existingPlan.name} → ${planId}`)
      
      // Get credit amounts for old and new plans
      const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe')
      const oldPlanCredits = SUBSCRIPTION_PLANS[existingPlan.name as keyof typeof SUBSCRIPTION_PLANS]?.credits || 0
      const newPlanCredits = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]?.credits || 0
      const creditDifference = newPlanCredits - oldPlanCredits
      
      console.log(`💳 Credit calculation: ${existingPlan.name}(${oldPlanCredits}) → ${planId}(${newPlanCredits}) = ${creditDifference > 0 ? '+' : ''}${creditDifference} credits`)
      
      // BUSINESS LOGIC:
      // - UPGRADES: Add credit difference immediately (user pays prorated amount)
      // - DOWNGRADES: Don't reduce credits immediately (user keeps existing credits until next cycle)
      
      // Update the plan to new plan type
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          name: planId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }
      })

      // Handle credit changes based on upgrade vs downgrade
      if (creditDifference > 0) {
        // UPGRADE: Add credit difference immediately
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: creditDifference
            }
          }
        })

        // Subscription upgrade credits also expire after 60 days
        const upgradeExpirationDate = new Date()
        upgradeExpirationDate.setDate(upgradeExpirationDate.getDate() + 60)
        
        await prisma.creditLedger.create({
          data: {
            userId,
            delta: creditDifference,
            reason: 'subscription_upgrade',
            expiresAt: upgradeExpirationDate, // Upgrade credits expire after 60 days
            meta: JSON.stringify({
              stripeSubscriptionId: subscription.id,
              oldPlan: existingPlan.name,
              newPlan: planId,
              oldCredits: oldPlanCredits,
              newCredits: newPlanCredits,
              creditsAdded: creditDifference,
              timing: 'immediate'
            })
          }
        })

        console.log(`✅ Plan upgraded from ${existingPlan.name} to ${planId}, added ${creditDifference} credits immediately`)
        
      } else if (creditDifference < 0) {
        // DOWNGRADE: Don't reduce credits immediately, just update plan
        // User keeps existing credits until next billing cycle
        // Next cycle: They'll get the new plan's credit allocation (handled by invoice.payment_succeeded)
        await prisma.creditLedger.create({
          data: {
            userId,
            delta: 0, // No immediate credit change - credits preserved
            reason: 'subscription_downgrade',
            expiresAt: null, // Downgrade entries don't expire (no credits added)
            meta: JSON.stringify({
              stripeSubscriptionId: subscription.id,
              oldPlan: existingPlan.name,
              newPlan: planId,
              oldCredits: oldPlanCredits,
              newCredits: newPlanCredits,
              creditDifference: creditDifference,
              timing: 'no_immediate_change',
              note: 'Credits preserved during downgrade - no reduction applied'
            })
          }
        })

        console.log(`✅ Plan downgraded from ${existingPlan.name} to ${planId}, existing credits preserved (no immediate reduction)`)
        
      } else {
        // SAME CREDITS: Just a plan name change
        console.log(`✅ Plan updated from ${existingPlan.name} to ${planId}, no credit change`)
      }
    } else {
      // Just update existing plan status/dates
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

      console.log(`✅ Updated subscription ${subscription.id} status for user ${userId}`)
    }

  } catch (error) {
    console.error(`❌ handleSubscriptionUpdated failed for ${subscription.id}:`, error)
    throw error // Re-throw to be caught by main handler
  }
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
    console.log(`💰 Processing subscription cycle payment for invoice ${invoice.id}`)
    
    // Handle recurring subscription payment
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId

    if (!userId || !planId) {
      console.error('❌ Missing userId or planId in subscription metadata for invoice payment')
      console.error('❌ userId:', userId)
      console.error('❌ planId:', planId)
      return
    }

    console.log(`💰 Monthly billing cycle for user ${userId}, plan: ${planId}`)

    // Get the current plan's credit allocation
    const { SUBSCRIPTION_PLANS } = await import('@/lib/stripe')
    const planCredits = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]?.credits || 0

    if (!planCredits) {
      console.error(`❌ No credits configured for plan ${planId}`)
      return
    }

    console.log(`💰 Plan ${planId} provides ${planCredits} monthly credits`)

    // FIRST: Expire old subscription credits (59+ days old)
    await expireOldSubscriptionCredits(userId)

    // THEN: Add monthly credits based on current plan (not old plan)
    // This ensures downgraded users get the correct amount for their new plan
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: planCredits
        }
      }
    })

    // Add credit ledger entry (subscription credits expire after 60 days)
    const monthlyExpirationDate = new Date()
    monthlyExpirationDate.setDate(monthlyExpirationDate.getDate() + 60)
    
    await prisma.creditLedger.create({
      data: {
        userId,
        delta: planCredits,
        reason: 'subscription',
        expiresAt: monthlyExpirationDate, // Monthly credits expire after 60 days
        meta: JSON.stringify({
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscription.id,
          planId: planId,
          period: 'recurring',
          billingCycle: 'monthly',
          creditsAdded: planCredits
        })
      }
    })

    console.log(`✅ Added ${planCredits} monthly credits to user ${userId} for ${planId} plan`)
  }
}

async function expireOldSubscriptionCredits(userId: string) {
  console.log(`🗓️ Checking for expired subscription credits for user ${userId}`)
  
  // Find subscription credits that are 59+ days old and not yet expired
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 59) // 59 days ago
  
  const expiredCredits = await prisma.creditLedger.findMany({
    where: {
      userId,
      reason: {
        in: ['subscription', 'subscription_upgrade'] // Both subscription types can expire
      },
      expiresAt: {
        lte: new Date() // Credits that should have expired by now
      },
      delta: {
        gt: 0 // Only positive credit entries (not deductions)
      }
    }
  })

  if (expiredCredits.length === 0) {
    console.log(`🗓️ No expired subscription credits found for user ${userId}`)
    return
  }

  // Calculate total credits to remove
  const totalExpiredCredits = expiredCredits.reduce((sum, credit) => sum + credit.delta, 0)
  
  console.log(`🗓️ Found ${expiredCredits.length} expired credit entries totaling ${totalExpiredCredits} credits`)

  // Remove expired credits from user's account
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: totalExpiredCredits
      }
    }
  })

  // Add ledger entry for the expiration
  await prisma.creditLedger.create({
    data: {
      userId,
      delta: -totalExpiredCredits,
      reason: 'subscription_expiration',
      expiresAt: null, // Expiration entries don't expire
      meta: JSON.stringify({
        expiredCredits: expiredCredits.length,
        totalExpired: totalExpiredCredits,
        expiredEntryIds: expiredCredits.map(c => c.id),
        reason: 'Subscription credits expired after 60 days (1-month rollover policy)'
      })
    }
  })

  console.log(`✅ Expired ${totalExpiredCredits} subscription credits for user ${userId}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - could send email notification, etc.
  console.log(`Payment failed for invoice ${invoice.id}`)
  
  // You might want to:
  // - Send email notification to user
  // - Update subscription status 
  // - Implement retry logic
}
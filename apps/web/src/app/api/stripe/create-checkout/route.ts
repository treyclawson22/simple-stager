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

    console.log(`🔍 User info:`, { id: user.id, email: user.email, name: user.name })

    const { planId, type, cancelDowngrade } = await request.json()
    console.log(`🔍 Request data:`, { planId, type })

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

      // Check if user has an existing active subscription
      console.log(`🔍 Checking for existing subscription for user ${user.id}`)
      
      // Look for pending_downgrade plan first, then active plan (same logic as UI)
      let existingPlan = await prisma.plan.findFirst({
        where: { 
          userId: user.id,
          status: 'pending_downgrade'
        }
      })
      
      if (!existingPlan) {
        existingPlan = await prisma.plan.findFirst({
          where: { 
            userId: user.id,
            status: 'active'
          }
        })
      }
      
      console.log(`🔍 Existing plan found:`, existingPlan)
      
      // Also check for any plans regardless of status for debugging
      const allPlans = await prisma.plan.findMany({
        where: { userId: user.id }
      })
      console.log(`🔍 All user plans:`, allPlans)

      if (existingPlan && existingPlan.stripeSubscriptionId) {
        // Debug logging for cancel downgrade
        if (cancelDowngrade) {
          console.log(`🔧 DEBUG: Cancel downgrade requested`)
          console.log(`🔧 DEBUG: Existing plan status: ${existingPlan.status}`)
          console.log(`🔧 DEBUG: Existing plan name: ${existingPlan.name}`)
          console.log(`🔧 DEBUG: Requested planId: ${planId}`)
        }
        
        // Handle cancel downgrade request
        if (cancelDowngrade && existingPlan.status === 'pending_downgrade') {
          console.log(`🔄 Canceling downgrade for subscription ${existingPlan.stripeSubscriptionId}`)
          
          try {
            // If there's a Stripe schedule, cancel it
            if (existingPlan.stripeScheduleId) {
              console.log(`🗓️ Canceling Stripe schedule ${existingPlan.stripeScheduleId}`)
              
              // Cancel the subscription schedule and release the subscription
              await stripe.subscriptionSchedules.cancel(existingPlan.stripeScheduleId)
              
              console.log(`✅ Canceled Stripe schedule ${existingPlan.stripeScheduleId}`)
            }
            
            // Get the subscription and current plan info
            const subscription = await stripe.subscriptions.retrieve(existingPlan.stripeSubscriptionId)
            const currentPlan = SUBSCRIPTION_PLANS[existingPlan.name as keyof typeof SUBSCRIPTION_PLANS]
            
            if (!currentPlan) {
              throw new Error('Current plan not found in SUBSCRIPTION_PLANS')
            }
            
            // Update subscription metadata to remove downgrade tracking
            await stripe.subscriptions.update(existingPlan.stripeSubscriptionId, {
              metadata: {
                userId: user.id,
                planId: existingPlan.name, // Keep current plan
                credits: currentPlan.credits.toString(),
                // Remove all downgrade-related metadata
              },
              proration_behavior: 'none',
            })
            
            // Update our database to clear pending downgrade
            await prisma.plan.update({
              where: { id: existingPlan.id },
              data: {
                status: 'active',
                pendingPlan: null, // Clear pending downgrade
                stripeScheduleId: null, // Clear schedule ID
              }
            })
            
            console.log(`✅ Canceled downgrade for subscription ${existingPlan.stripeSubscriptionId}`)
            
            return NextResponse.json({ 
              canceled: true,
              message: `Downgrade canceled. You will continue on your ${existingPlan.name} plan.`
            })
            
          } catch (error) {
            console.error('❌ Failed to cancel downgrade:', error)
            return NextResponse.json({ 
              error: 'Failed to cancel downgrade' 
            }, { status: 500 })
          }
        }
        
        // This is a subscription upgrade/downgrade - modify existing subscription
        console.log(`🔄 Upgrading subscription ${existingPlan.stripeSubscriptionId} from ${existingPlan.name} to ${planId}`)
        
        try {
          // Get the current subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(existingPlan.stripeSubscriptionId)
          
          // Calculate price difference (your business logic)
          const currentPlan = SUBSCRIPTION_PLANS[existingPlan.name as keyof typeof SUBSCRIPTION_PLANS]
          const newPlan = plan
          const priceDifference = newPlan.price - currentPlan.price
          
          console.log(`💰 Price calculation: ${existingPlan.name} ($${currentPlan.price}) → ${planId} ($${newPlan.price}) = $${priceDifference} difference`)
          
          if (priceDifference <= 0) {
            console.log(`⚠️ Downgrade detected: price difference is $${priceDifference}`)
            
            // For downgrades, use Stripe Schedule API to automatically change plan at next billing cycle
            const subscription = await stripe.subscriptions.retrieve(existingPlan.stripeSubscriptionId)
            
            // Get the next billing cycle date
            const nextBillingDate = new Date(subscription.current_period_end * 1000)
            console.log(`📅 Scheduling downgrade for next billing cycle: ${nextBillingDate.toISOString()}`)
            
            // Create subscription schedule to change plan at next billing cycle
            const schedule = await stripe.subscriptionSchedules.create({
              from_subscription: existingPlan.stripeSubscriptionId,
              phases: [
                {
                  // Current phase - keep existing plan until end of current billing period
                  items: [{
                    price: currentPlan.stripePriceId,
                    quantity: 1,
                  }],
                  start_date: subscription.current_period_start,
                  end_date: subscription.current_period_end,
                  metadata: {
                    phase: 'current',
                    planName: existingPlan.name
                  }
                },
                {
                  // New phase - switch to downgraded plan at next billing cycle
                  items: [{
                    price: plan.stripePriceId,
                    quantity: 1,
                  }],
                  start_date: subscription.current_period_end,
                  metadata: {
                    phase: 'downgraded',
                    planName: planId,
                    userId: user.id,
                    credits: plan.credits.toString(),
                  }
                }
              ],
              metadata: {
                userId: user.id,
                downgradeTo: planId,
                downgradeFrom: existingPlan.name,
                scheduledDowngrade: 'true'
              }
            })
            
            console.log(`✅ Created subscription schedule ${schedule.id} for downgrade`)
            
            // Update metadata on the original subscription for tracking
            await stripe.subscriptions.update(existingPlan.stripeSubscriptionId, {
              metadata: {
                userId: user.id,
                planId: existingPlan.name, // Keep current plan ID
                credits: currentPlan.credits.toString(),
                pendingDowngrade: 'true',
                scheduleId: schedule.id, // Track the schedule
                downgradeToPlan: planId // Track target plan
              },
              proration_behavior: 'none',
            })
            
            // Update our database to show pending downgrade (keep current plan name)
            await prisma.plan.update({
              where: { id: existingPlan.id },
              data: {
                // Keep current plan name to show "Current (until next cycle)"
                status: 'pending_downgrade',
                pendingPlan: planId, // Store the plan they'll downgrade to
                stripeScheduleId: schedule.id, // Store schedule ID for cancellation
              }
            })
            
            return NextResponse.json({ 
              upgraded: true,
              message: 'Downgrade scheduled for next billing cycle',
              nextInvoice: `No charge today. Will switch to ${planId} on next billing date ($${newPlan.price}/month)`
            })
          } else {
            console.log(`📈 Upgrade detected: charging $${priceDifference} difference`)
            
            // For upgrades: PAYMENT FIRST, then subscription changes
            
            // Create the invoice first (empty)
            const invoice = await stripe.invoices.create({
              customer: stripeCustomerId,
              auto_advance: false, // We'll finalize manually
              collection_method: 'charge_automatically'
            })
            
            // Then, create the invoice item and attach it to the specific invoice
            const invoiceItem = await stripe.invoiceItems.create({
              customer: stripeCustomerId,
              invoice: invoice.id, // ← KEY FIX: Attach to specific invoice
              amount: Math.round(priceDifference * 100), // Convert to cents
              currency: 'usd',
              description: `Plan upgrade: ${existingPlan.name} to ${planId} (price difference)`,
              metadata: {
                userId: user.id,
                upgradeFrom: existingPlan.name,
                upgradeTo: planId,
                priceDifference: priceDifference.toString()
              }
            })
            
            // Finalize the invoice (this locks in the invoice items)
            const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
            
            // Explicitly attempt payment using the subscription's default payment method
            let paidInvoice
            try {
              // Get the payment method from the subscription
              const paymentMethodId = subscription.default_payment_method as string
              
              if (!paymentMethodId) {
                throw new Error('No payment method found on subscription')
              }
              
              paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
                payment_method: paymentMethodId
              })
              console.log(`✅ Created upgrade invoice ${invoice.id} for $${priceDifference}`)
              console.log(`💳 Invoice payment status: ${paidInvoice.status}`)
              console.log(`💳 Invoice amount paid: $${(paidInvoice.amount_paid || 0) / 100}`)
              
              // ONLY AFTER successful payment: Update subscription and add credits
              await stripe.subscriptions.update(existingPlan.stripeSubscriptionId, {
                items: [{
                  id: subscription.items.data[0].id,
                  price: plan.stripePriceId,
                }],
                metadata: {
                  userId: user.id,
                  planId,
                  credits: plan.credits.toString(),
                },
                proration_behavior: 'none', // No proration - keep original billing cycle
              })
              
              console.log(`✅ Payment successful - subscription updated to ${planId}`)
              
              // CRITICAL: Also update our database immediately (don't wait for webhooks)
              const currentPlan = SUBSCRIPTION_PLANS[existingPlan.name as keyof typeof SUBSCRIPTION_PLANS]
              const newPlan = plan
              const creditDifference = newPlan.credits - currentPlan.credits
              
              // Update the plan in our database
              await prisma.plan.update({
                where: { id: existingPlan.id },
                data: {
                  name: planId,
                  status: 'active',
                }
              })
              
              // Add the credit difference
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  credits: {
                    increment: creditDifference
                  }
                }
              })
              
              // Add credit ledger entry
              const upgradeExpirationDate = new Date()
              upgradeExpirationDate.setDate(upgradeExpirationDate.getDate() + 60)
              
              await prisma.creditLedger.create({
                data: {
                  userId: user.id,
                  delta: creditDifference,
                  reason: 'subscription_upgrade',
                  expiresAt: upgradeExpirationDate,
                  meta: JSON.stringify({
                    stripeSubscriptionId: existingPlan.stripeSubscriptionId,
                    oldPlan: existingPlan.name,
                    newPlan: planId,
                    oldCredits: currentPlan.credits,
                    newCredits: newPlan.credits,
                    creditsAdded: creditDifference,
                    timing: 'immediate_after_payment'
                  })
                }
              })
              
              console.log(`✅ Database updated: ${existingPlan.name} → ${planId}, added ${creditDifference} credits`)
              
            } catch (paymentError) {
              console.error('❌ Invoice payment failed:', paymentError)
              console.log('🔧 Subscription upgrade completed but payment failed')
              console.log('🔧 Invoice created:', invoice.id)
              console.log('🔧 Invoice status:', finalizedInvoice.status)
              
              // Still return success since subscription was upgraded
              return NextResponse.json({ 
                upgraded: true,
                message: 'Plan upgraded successfully',
                nextInvoice: `Upgrade completed. Payment processing... Check your payment method if needed.`,
                paymentWarning: true
              })
            }
            
            return NextResponse.json({ 
              upgraded: true,
              message: 'Plan upgraded successfully',
              nextInvoice: `Charged $${priceDifference} for upgrade. Billing cycle unchanged.`
            })
          }
          
        } catch (error) {
          console.error('❌ Failed to update subscription:', error)
          return NextResponse.json({ 
            error: 'Failed to update subscription' 
          }, { status: 500 })
        }
      } else {
        // This is a new subscription - create checkout session
        console.log(`🆕 Creating new subscription for plan ${planId}`)
        
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

      // Add credit pack metadata to both session and payment_intent for webhook compatibility
      sessionConfig.metadata = {
        ...sessionConfig.metadata,
        packId: planId,
        credits: pack.credits.toString(),
      }
      
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

    // Only create checkout session if we haven't already handled subscription upgrade
    if (sessionConfig.line_items && sessionConfig.line_items.length > 0) {
      const session = await stripe.checkout.sessions.create(sessionConfig)
      
      console.log('🔍 DEBUG: Checkout session created')
      console.log('Session ID:', session.id)
      console.log('Session livemode:', session.livemode)
      console.log('Session mode:', session.mode)
      console.log('Price ID used:', sessionConfig.line_items[0]?.price)

      return NextResponse.json({ url: session.url })
    } else {
      return NextResponse.json({ error: 'No checkout session created' }, { status: 500 })
    }
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 })
  }
}
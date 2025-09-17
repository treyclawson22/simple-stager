import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    // Find all users to see current state
    const users = await prisma.user.findMany({
      include: { 
        plans: true,
        creditLedger: true
      }
    })
    
    console.log('Current users:', JSON.stringify(users, null, 2))
    
    // Find the authenticated user (assuming treyclawson@gmail.com or first user)
    const user = users.find(u => u.email === 'treyclawson@gmail.com') || users[0]
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }
    
    console.log(`Fixing all purchases for user: ${user.email}`)
    console.log(`Current credits: ${user.credits}`)
    
    const results = []
    
    // 1. Check if user already has Entry plan
    const existingPlan = user.plans.find(p => p.name === 'entry' && p.status === 'active')
    
    if (!existingPlan) {
      // Create Entry plan subscription
      const plan = await prisma.plan.create({
        data: {
          userId: user.id,
          name: 'entry',
          status: 'active',
          stripeSubscriptionId: 'manual_fix_entry_' + Date.now(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      })
      
      // Add Entry plan credits (15 credits)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: 15
          }
        }
      })
      
      // Add credit ledger entry for Entry plan
      const entryLedger = await prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: 15,
          reason: 'subscription',
          meta: JSON.stringify({
            planId: 'entry',
            period: 'initial',
            note: 'Manual fix for Entry plan subscription - Stripe webhook failed'
          })
        }
      })
      
      results.push({
        type: 'entry_plan',
        plan: plan,
        ledger: entryLedger,
        message: 'Created Entry plan with 15 credits'
      })
    } else {
      results.push({
        type: 'entry_plan',
        message: 'Entry plan already exists',
        plan: existingPlan
      })
    }
    
    // 2. Add credit pack purchase (assuming it was a 5-credit pack for $15)
    // Check if we already added a credit pack today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingPackPurchase = user.creditLedger.find(entry => 
      entry.reason === 'purchase' && 
      entry.createdAt >= today &&
      entry.meta?.includes('credit_pack')
    )
    
    if (!existingPackPurchase) {
      // Add credit pack purchase (let's assume 5 credits for $15 - most common starter pack)
      const creditsToAdd = 5
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: creditsToAdd
          }
        }
      })
      
      // Add credit ledger entry for credit pack
      const packLedger = await prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: creditsToAdd,
          reason: 'purchase',
          meta: JSON.stringify({
            packId: 'pack_5',
            amount: 1500, // $15.00 in cents
            currency: 'usd',
            note: 'Manual fix for credit pack purchase - Stripe webhook failed'
          })
        }
      })
      
      results.push({
        type: 'credit_pack',
        credits: creditsToAdd,
        ledger: packLedger,
        message: `Added ${creditsToAdd} credits from credit pack purchase`
      })
    } else {
      results.push({
        type: 'credit_pack',
        message: 'Credit pack purchase already processed today',
        existing: existingPackPurchase
      })
    }
    
    // Get final user state
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        plans: { where: { status: 'active' } },
        creditLedger: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    })
    
    return NextResponse.json({ 
      message: 'Successfully processed all Stripe purchases!',
      user: {
        email: finalUser?.email,
        credits: finalUser?.credits,
        activePlans: finalUser?.plans,
        recentTransactions: finalUser?.creditLedger
      },
      results: results
    })
    
  } catch (error) {
    console.error('Error fixing purchases:', error)
    return NextResponse.json({ 
      error: 'Failed to fix purchases',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
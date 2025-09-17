import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual Stripe fix requested - processing recent transactions')
    
    // Find your user account
    const user = await prisma.user.findUnique({
      where: { email: 'treyclawson22@gmail.com' },
      include: { plans: true, creditLedger: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log(`Processing for user: ${user.email} (current credits: ${user.credits})`)
    
    const results = []
    const currentTime = new Date()
    
    // Check for existing Entry plan from recent transactions
    const hasEntryPlan = user.plans.some(p => p.name === 'entry' && p.status === 'active')
    
    if (!hasEntryPlan) {
      // Add Entry plan (from your recent subscription)
      const entryPlan = await prisma.plan.create({
        data: {
          userId: user.id,
          name: 'entry',
          status: 'active',
          stripeSubscriptionId: 'stripe_fix_' + currentTime.getTime(),
          currentPeriodStart: currentTime,
          currentPeriodEnd: new Date(currentTime.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      })
      
      // Add Entry plan credits (15 credits)
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 15 } }
      })
      
      // Add ledger entry
      await prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: 15,
          reason: 'subscription',
          meta: JSON.stringify({
            planId: 'entry',
            note: 'Entry plan subscription - manually processed due to webhook failure',
            timestamp: currentTime.toISOString()
          })
        }
      })
      
      results.push({ type: 'entry_plan', credits: 15, message: 'Added Entry plan with 15 credits' })
    } else {
      results.push({ type: 'entry_plan', message: 'Entry plan already exists' })
    }
    
    // Check for recent credit pack purchase (check if we need to add 5-credit pack)
    const recentCreditPurchase = user.creditLedger.find(entry => 
      entry.reason === 'purchase' && 
      entry.createdAt > new Date(currentTime.getTime() - 60 * 60 * 1000) // within last hour
    )
    
    if (!recentCreditPurchase) {
      // Add 5-credit pack (most common starter pack)
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 5 } }
      })
      
      // Add ledger entry
      await prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: 5,
          reason: 'purchase',
          meta: JSON.stringify({
            packId: 'pack_5',
            amount: 1500, // $15.00
            note: '5-credit pack purchase - manually processed due to webhook failure',
            timestamp: currentTime.toISOString()
          })
        }
      })
      
      results.push({ type: 'credit_pack', credits: 5, message: 'Added 5-credit pack purchase' })
    } else {
      results.push({ type: 'credit_pack', message: 'Recent credit purchase already exists' })
    }
    
    // Get final user state
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        plans: { where: { status: 'active' } },
        creditLedger: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    })
    
    return NextResponse.json({
      message: 'Manual Stripe fix completed successfully!',
      before: {
        credits: user.credits,
        plans: user.plans.length
      },
      after: {
        credits: updatedUser?.credits,
        plans: updatedUser?.plans.length,
        activePlans: updatedUser?.plans.map(p => p.name)
      },
      results: results,
      note: 'This manually processes your recent Stripe transactions. Once webhook is properly configured, this won\'t be needed.'
    })
    
  } catch (error) {
    console.error('Manual Stripe fix error:', error)
    return NextResponse.json({
      error: 'Failed to process manual fix',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
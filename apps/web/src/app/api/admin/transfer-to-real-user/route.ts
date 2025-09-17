import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    // Find both users
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: { plans: true, creditLedger: true }
    })
    
    const realUser = await prisma.user.findUnique({
      where: { email: 'treyclawson22@gmail.com' },
      include: { plans: true, creditLedger: true }
    })
    
    if (!testUser || !realUser) {
      return NextResponse.json({ error: 'Could not find both users' }, { status: 404 })
    }
    
    console.log(`Transferring from test user (${testUser.credits} credits) to real user (${realUser.credits} credits)`)
    
    const results = []
    
    // 1. Transfer Entry plan from test user to real user
    const entryPlan = testUser.plans.find(p => p.name === 'entry' && p.status === 'active')
    
    if (entryPlan) {
      // Update the plan to point to real user
      const transferredPlan = await prisma.plan.update({
        where: { id: entryPlan.id },
        data: { userId: realUser.id }
      })
      
      results.push({
        type: 'plan_transfer',
        message: 'Transferred Entry plan to real user',
        plan: transferredPlan
      })
    }
    
    // 2. Calculate credits to transfer (24 from test user - 1 existing in real user = 23 to add)
    const testUserCredits = testUser.credits
    const creditsToAdd = testUserCredits // Transfer all credits from test user
    
    // Add credits to real user
    const updatedRealUser = await prisma.user.update({
      where: { id: realUser.id },
      data: {
        credits: {
          increment: creditsToAdd
        }
      }
    })
    
    // Set test user credits to 0
    await prisma.user.update({
      where: { id: testUser.id },
      data: { credits: 0 }
    })
    
    // 3. Create ledger entries for the transfer
    // Add positive entry for real user
    const transferInLedger = await prisma.creditLedger.create({
      data: {
        userId: realUser.id,
        delta: creditsToAdd,
        reason: 'transfer',
        meta: JSON.stringify({
          fromUserId: testUser.id,
          note: 'Credits transferred from test account due to Stripe webhook routing to wrong user'
        })
      }
    })
    
    // Add negative entry for test user
    const transferOutLedger = await prisma.creditLedger.create({
      data: {
        userId: testUser.id,
        delta: -creditsToAdd,
        reason: 'transfer',
        meta: JSON.stringify({
          toUserId: realUser.id,
          note: 'Credits transferred to real user account'
        })
      }
    })
    
    results.push({
      type: 'credit_transfer',
      message: `Transferred ${creditsToAdd} credits from test user to real user`,
      transferIn: transferInLedger,
      transferOut: transferOutLedger
    })
    
    // Get final state of both users
    const finalTestUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { plans: { where: { status: 'active' } } }
    })
    
    const finalRealUser = await prisma.user.findUnique({
      where: { id: realUser.id },
      include: { plans: { where: { status: 'active' } } }
    })
    
    return NextResponse.json({ 
      message: 'Successfully transferred Entry plan and credits to real user!',
      testUser: {
        email: finalTestUser?.email,
        credits: finalTestUser?.credits,
        activePlans: finalTestUser?.plans.length
      },
      realUser: {
        email: finalRealUser?.email,
        credits: finalRealUser?.credits,
        activePlans: finalRealUser?.plans.length
      },
      results: results
    })
    
  } catch (error) {
    console.error('Error transferring to real user:', error)
    return NextResponse.json({ 
      error: 'Failed to transfer to real user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
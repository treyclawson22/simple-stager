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
    
    // Find the authenticated user (assuming treyclawson@gmail.com)
    const user = users.find(u => u.email === 'treyclawson@gmail.com') || users[0]
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 404 })
    }
    
    console.log(`Fixing plan for user: ${user.email}`)
    
    // Check if user already has Entry plan
    const existingPlan = user.plans.find(p => p.name === 'entry' && p.status === 'active')
    
    if (existingPlan) {
      return NextResponse.json({ 
        message: 'User already has active Entry plan',
        user: {
          email: user.email,
          credits: user.credits,
          plan: existingPlan
        }
      })
    }
    
    // Create Entry plan subscription
    const plan = await prisma.plan.create({
      data: {
        userId: user.id,
        name: 'entry',
        status: 'active',
        stripeSubscriptionId: 'manual_fix_' + Date.now(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    })
    
    console.log('Created plan:', plan)
    
    // Add Entry plan credits (15 credits)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          increment: 15
        }
      }
    })
    
    console.log('Updated user credits:', updatedUser.credits)
    
    // Add credit ledger entry
    const ledgerEntry = await prisma.creditLedger.create({
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
    
    console.log('Created ledger entry:', ledgerEntry)
    
    return NextResponse.json({ 
      message: 'Successfully fixed user plan!',
      user: {
        email: updatedUser.email,
        credits: updatedUser.credits,
        plan: plan,
        ledgerEntry: ledgerEntry
      }
    })
    
  } catch (error) {
    console.error('Error fixing plan:', error)
    return NextResponse.json({ 
      error: 'Failed to fix plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
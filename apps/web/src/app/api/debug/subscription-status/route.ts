import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔍 Debug: Checking subscription status for user ${user.id}`)

    // Get all plans for this user
    const allPlans = await prisma.plan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Get the specific active plan query we use in create-checkout
    const activePlan = await prisma.plan.findFirst({
      where: { 
        userId: user.id,
        status: 'active'
      }
    })

    const response = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      allPlans: allPlans,
      activePlan: activePlan,
      hasActivePlan: !!activePlan,
      hasStripeSubscriptionId: !!activePlan?.stripeSubscriptionId,
      planCount: allPlans.length
    }

    console.log(`🔍 Debug response:`, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Debug subscription status error:', error)
    return NextResponse.json({ 
      error: 'Failed to check subscription status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
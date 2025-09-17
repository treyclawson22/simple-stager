import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    // Check if current user is admin (you can customize this logic)
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { userEmail, planName, durationMonths = 12 } = await request.json()

    if (!userEmail || !planName) {
      return NextResponse.json({ error: 'User email and plan name are required' }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate plan credits based on plan name
    const planCredits = getPlanCredits(planName)
    if (!planCredits) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
    }

    // Calculate end date
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + durationMonths)

    // Create or update the plan record
    const plan = await prisma.plan.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: planName
        }
      },
      update: {
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
      },
      create: {
        userId: user.id,
        name: planName,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
      }
    })

    // Add credits to user account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          increment: planCredits
        }
      }
    })

    // Add credit ledger entry
    await prisma.creditLedger.create({
      data: {
        userId: user.id,
        delta: planCredits,
        reason: 'admin_grant',
        meta: JSON.stringify({
          planName,
          grantedBy: currentUser.email,
          durationMonths,
          type: 'free_plan_grant'
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `Granted ${planName} plan to ${userEmail} for ${durationMonths} months`,
      plan: {
        id: plan.id,
        name: plan.name,
        status: plan.status,
        credits: planCredits,
        expiresAt: currentPeriodEnd
      }
    })

  } catch (error) {
    console.error('Failed to grant plan:', error)
    return NextResponse.json({ 
      error: 'Failed to grant plan' 
    }, { status: 500 })
  }
}

// Helper function to check if user is admin
function isAdmin(user: any): boolean {
  // Customize this logic based on your needs:
  
  // Option 1: Check by email
  const adminEmails = [
    'support@simplestager.com',
    // Add your admin emails here
  ]
  
  if (adminEmails.includes(user.email)) {
    return true
  }
  
  // Option 2: Check by user property (if you add an isAdmin field to User model)
  // return user.isAdmin === true
  
  // Option 3: Check by role (if you implement a role system)
  // return user.role === 'admin'
  
  return false
}

// Helper function to get credits for each plan
function getPlanCredits(planName: string): number | null {
  const planCreditsMap: Record<string, number> = {
    entry: 15,
    showcase: 25,
    prime: 50,
    prestige: 100,
    portfolio: 300
  }
  
  return planCreditsMap[planName] || null
}
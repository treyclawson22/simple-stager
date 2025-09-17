import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: { 
        plans: { where: { status: 'active' } },
        creditLedger: { 
          orderBy: { createdAt: 'desc' }, 
          take: 3 
        }
      }
    })
    
    return NextResponse.json({ 
      totalUsers: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        activePlans: user.plans,
        recentTransactions: user.creditLedger.length
      }))
    })
    
  } catch (error) {
    console.error('Error checking users:', error)
    return NextResponse.json({ 
      error: 'Failed to check users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
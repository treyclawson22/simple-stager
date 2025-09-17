import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

// Helper function to check if user is admin
function isAdmin(user: any): boolean {
  const adminEmails = [
    'trey@simplestager.com',
    'admin@simplestager.com',
    // Add your admin emails here
  ]
  
  return adminEmails.includes(user.email)
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    // Check if current user is admin
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        createdAt: true,
        plans: {
          select: {
            id: true,
            name: true,
            status: true,
            currentPeriodEnd: true
          },
          where: {
            status: 'active'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    // Check if current user is admin
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { userId, credits } = await request.json()

    if (!userId || typeof credits !== 'number') {
      return NextResponse.json({ error: 'Invalid userId or credits' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { credits: credits }
    })

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits
      }
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
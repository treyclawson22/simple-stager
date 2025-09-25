import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        authProvider: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            workflows: true,
            referrals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalUsers = users.length
    const totalCredits = users.reduce((sum, user) => sum + user.credits, 0)
    const totalWorkflows = users.reduce((sum, user) => sum + user._count.workflows, 0)

    return NextResponse.json({
      success: true,
      totalUsers,
      totalCredits,
      totalWorkflows,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        authProvider: user.authProvider,
        referralCode: user.referralCode,
        workflowCount: user._count.workflows,
        referralCount: user._count.referrals,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
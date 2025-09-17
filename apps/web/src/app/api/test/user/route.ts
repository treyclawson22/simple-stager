import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function GET() {
  try {
    // Get test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      // Create test user if doesn't exist
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          authProvider: 'password',
          credits: 10,
          referralCode: 'TEST123',
        }
      })
    }

    return NextResponse.json({ 
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        credits: testUser.credits,
        referralCode: testUser.referralCode
      }
    })

  } catch (error) {
    console.error('Test user fetch error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { credits } = await request.json()

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json({ error: 'Invalid credits value' }, { status: 400 })
    }

    // Update test user credits
    const testUser = await prisma.user.updateMany({
      where: { email: 'test@example.com' },
      data: { credits: credits }
    })

    if (testUser.count === 0) {
      return NextResponse.json({ error: 'Test user not found' }, { status: 404 })
    }

    // Get updated user
    const updatedUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    return NextResponse.json({ 
      success: true,
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        credits: updatedUser?.credits,
        referralCode: updatedUser?.referralCode
      }
    })

  } catch (error) {
    console.error('Test user update error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { executeWithRobustConnection } from '@/lib/robust-db'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      )
    }

    const normalizedCode = code.toUpperCase().trim()

    const result = await executeWithRobustConnection(async (prisma) => {
      // Check if this is a special referral code
      const specialCode = await prisma.specialReferralCode.findUnique({
        where: { code: normalizedCode }
      })

      if (!specialCode) {
        return { success: false, error: 'Invalid code' }
      }

      if (specialCode.usedBy) {
        return { success: false, error: 'This code has already been used' }
      }

      // Check if user has already used a special referral code
      const existingUsage = await prisma.specialReferralCode.findFirst({
        where: { usedBy: user.id }
      })

      if (existingUsage) {
        return { success: false, error: 'You have already used a special referral code' }
      }

      // Begin transaction to redeem code and add credits
      const [updatedUser, updatedCode] = await Promise.all([
        // Add credits to user
        prisma.user.update({
          where: { id: user.id },
          data: { credits: { increment: specialCode.credits } }
        }),

        // Mark code as used
        prisma.specialReferralCode.update({
          where: { id: specialCode.id },
          data: {
            usedBy: user.id,
            usedAt: new Date()
          }
        }),

        // Add entry to credit ledger
        prisma.creditLedger.create({
          data: {
            userId: user.id,
            delta: specialCode.credits,
            reason: 'special_referral',
            meta: JSON.stringify({
              code: normalizedCode,
              description: specialCode.description || 'Special VIP Credits'
            })
          }
        })
      ])

      return {
        success: true,
        credits: specialCode.credits,
        newTotal: updatedUser.credits,
        description: specialCode.description || 'Special VIP Credits'
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error redeeming special referral code:', error)
    return NextResponse.json(
      { success: false, error: 'Redemption failed' },
      { status: 500 }
    )
  }
}
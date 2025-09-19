import { NextRequest, NextResponse } from 'next/server'
import { executeWithRobustConnection } from '@/lib/robust-db'

// Special referral code validation endpoint

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { isValid: false, error: 'Code is required' },
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
        return { isValid: false, error: 'Invalid code' }
      }

      if (specialCode.usedBy) {
        return { isValid: false, error: 'This code has already been used' }
      }

      return {
        isValid: true,
        credits: specialCode.credits,
        description: specialCode.description || 'Special VIP Credits'
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error validating special referral code:', error)
    return NextResponse.json(
      { isValid: false, error: 'Validation failed' },
      { status: 500 }
    )
  }
}
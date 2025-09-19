import { NextRequest, NextResponse } from 'next/server'
import { executeWithRobustConnection } from '@/lib/robust-db'

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
      // Check if this is a regular user referral code
      const referringUser = await prisma.user.findFirst({
        where: { 
          referralCode: normalizedCode 
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      })

      if (!referringUser) {
        return { isValid: false, error: 'Invalid referral code' }
      }

      return {
        isValid: true,
        type: 'regular',
        discount: 25, // 25% off first month
        referringUser: {
          id: referringUser.id,
          name: referringUser.name
        }
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { isValid: false, error: 'Validation failed' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { executeWithRobustConnection } from '@/lib/robust-db'

// Generate a random special code
function generateSpecialCode(): string {
  const prefixes = ['VIP', 'ELITE', 'PLATINUM', 'PREMIUM', 'GOLD', 'DIAMOND', 'ROYAL', 'MASTER', 'PRIME', 'ULTRA']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const numbers = Math.floor(Math.random() * 9000) + 1000 // 4-digit number
  return `${prefix}${numbers}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Basic admin check - you may want to add proper admin role checking
    if (!user || user.email !== 'treyclawson22@gmail.com') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { count = 1, credits = 100, description = 'VIP Realtor Program' } = await request.json()

    if (count > 50) {
      return NextResponse.json(
        { error: 'Cannot generate more than 50 codes at once' },
        { status: 400 }
      )
    }

    const generatedCodes: string[] = []

    for (let i = 0; i < count; i++) {
      let code = generateSpecialCode()
      let attempts = 0

      // Ensure code is unique
      while (attempts < 10) {
        const existing = await executeWithRobustConnection(async (prisma) => {
          return prisma.specialReferralCode.findUnique({
            where: { code }
          })
        })

        if (!existing) break
        code = generateSpecialCode()
        attempts++
      }

      if (attempts >= 10) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        )
      }

      generatedCodes.push(code)
    }

    // Save all codes to database
    const savedCodes = await executeWithRobustConnection(async (prisma) => {
      return Promise.all(
        generatedCodes.map(code =>
          prisma.specialReferralCode.create({
            data: {
              code,
              credits,
              description,
              createdBy: user.id
            }
          })
        )
      )
    })

    return NextResponse.json({
      success: true,
      codes: savedCodes.map(c => ({
        code: c.code,
        credits: c.credits,
        description: c.description,
        createdAt: c.createdAt
      }))
    })

  } catch (error) {
    console.error('Error generating special referral codes:', error)
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}
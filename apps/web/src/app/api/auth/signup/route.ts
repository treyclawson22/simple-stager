import { NextRequest, NextResponse } from 'next/server'
import { generateReferralCode } from '@simple-stager/shared'
import { executeWithRobustConnection } from '@/lib/robust-db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 Starting signup process...')

  try {
    const { email, password, name, specialReferralCode } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    console.log(`📧 Creating account for: ${email}`)

    // Use robust database connection with aggressive retry strategy
    const user = await executeWithRobustConnection(async (prisma) => {
      console.log('🔍 Checking if user exists...')
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Check if special referral code is provided and valid
      let specialCodeData = null
      if (specialReferralCode) {
        const normalizedCode = specialReferralCode.toUpperCase().trim()
        console.log(`🎁 Checking special referral code: ${normalizedCode}`)
        
        specialCodeData = await prisma.specialReferralCode.findUnique({
          where: { code: normalizedCode }
        })

        if (!specialCodeData) {
          throw new Error('Invalid special referral code')
        }

        if (specialCodeData.usedBy) {
          throw new Error('This special referral code has already been used')
        }
      }

      console.log('🔐 Hashing password...')
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)
      const referralCode = generateReferralCode()

      // Calculate initial credits (3 base + special code bonus if applicable)
      const initialCredits = 3 + (specialCodeData ? specialCodeData.credits : 0)

      console.log('👤 Creating user record...')
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || null,
          authProvider: 'password',
          credits: initialCredits,
          referralCode,
        }
      })

      console.log('🔑 Storing password hash...')
      // Store password hash
      await prisma.password.create({
        data: {
          userId: newUser.id,
          hash: hashedPassword,
        }
      })

      console.log('💰 Adding trial credits...')
      // Add initial trial credits to ledger
      await prisma.creditLedger.create({
        data: {
          userId: newUser.id,
          delta: 3,
          reason: 'trial',
          meta: JSON.stringify({ message: 'Welcome! Free trial credits' }),
        },
      })

      // If special referral code was used, add those credits and mark code as used
      if (specialCodeData) {
        console.log(`🎁 Adding special referral code credits: ${specialCodeData.credits}`)
        
        await prisma.creditLedger.create({
          data: {
            userId: newUser.id,
            delta: specialCodeData.credits,
            reason: 'special_referral',
            meta: JSON.stringify({
              code: specialCodeData.code,
              description: specialCodeData.description || 'Special VIP Credits'
            }),
          },
        })

        // Mark special code as used
        await prisma.specialReferralCode.update({
          where: { id: specialCodeData.id },
          data: {
            usedBy: newUser.id,
            usedAt: new Date()
          }
        })
      }

      console.log(`✅ User created successfully: ${newUser.id}`)
      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      }
    }, 15) // Maximum 15 attempts with robust connection strategy

    const duration = Date.now() - startTime
    console.log(`🎉 Signup completed successfully in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Signup failed after ${duration}ms:`, (error as Error).message)
    
    // Check if it's a user validation error vs database error
    if ((error as Error).message === 'User already exists with this email') {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create account. Our servers are experiencing high load. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
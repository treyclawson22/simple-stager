import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { generateReferralCode } from '@simple-stager/shared'
import { withDatabaseRetry } from '@/lib/db-retry'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

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

    // Wrap database operations in retry logic to handle Supabase wake-up delays
    const user = await withDatabaseRetry(async () => {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)
      const referralCode = generateReferralCode()

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || null,
          authProvider: 'password',
          credits: 3,
          referralCode,
        }
      })

      // Store password hash
      await prisma.password.create({
        data: {
          userId: newUser.id,
          hash: hashedPassword,
        }
      })

      // Add initial trial credits to ledger
      await prisma.creditLedger.create({
        data: {
          userId: newUser.id,
          delta: 3,
          reason: 'trial',
          meta: JSON.stringify({ message: 'Welcome! Free trial credits' }),
        },
      })

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      }
    }, { 
      maxRetries: 8, 
      delay: 3000, 
      backoff: 1.5,
      wakeUpDatabase: true 
    }) // Enhanced settings for Supabase free tier

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user
    })

  } catch (error) {
    console.error('Signup API error:', error)
    
    // Check if it's a user validation error vs database error
    if ((error as Error).message === 'User already exists with this email') {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
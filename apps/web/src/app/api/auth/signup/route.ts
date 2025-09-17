import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { generateReferralCode } from '@simple-stager/shared'
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    const referralCode = generateReferralCode()

    // Create user
    const user = await prisma.user.create({
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
        userId: user.id,
        hash: hashedPassword,
      }
    })

    // Add initial trial credits to ledger
    await prisma.creditLedger.create({
      data: {
        userId: user.id,
        delta: 3,
        reason: 'trial',
        meta: JSON.stringify({ message: 'Welcome! Free trial credits' }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })

  } catch (error) {
    console.error('Signup API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
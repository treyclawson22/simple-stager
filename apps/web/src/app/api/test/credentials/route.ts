import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@simple-stager/database'
import { generateReferralCode } from '@simple-stager/shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Test credentials endpoint called:', body)
    
    const { email, password, name, isSignUp } = body
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      })
    }

    if (isSignUp === 'true' || isSignUp === true) {
      console.log('Testing sign up flow')
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'User already exists with this email' 
        })
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 12)
      const referralCode = generateReferralCode()

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
      await prisma.userPassword.create({
        data: {
          userId: user.id,
          passwordHash: hashedPassword,
        }
      })

      // Add initial trial credits
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
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      })
    } else {
      console.log('Testing sign in flow')
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        })
      }

      if (user.authProvider !== 'password') {
        return NextResponse.json({ 
          success: false, 
          error: 'User exists but not password auth' 
        })
      }

      // Get password hash
      const passwordRecord = await prisma.userPassword.findUnique({
        where: { userId: user.id }
      })

      if (!passwordRecord) {
        return NextResponse.json({ 
          success: false, 
          error: 'No password record found' 
        })
      }

      const isValid = await bcrypt.compare(password, passwordRecord.passwordHash)
      
      if (!isValid) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid password' 
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Sign in successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      })
    }
  } catch (error) {
    console.error('Test credentials error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function POST() {
  try {
    console.log('Starting database warm-up sequence...')
    
    // Multiple wake-up queries to ensure database is fully active
    await prisma.$queryRaw`SELECT 1`
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await prisma.$queryRaw`SELECT version()`
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test actual table access
    const userCount = await prisma.user.count()
    await prisma.creditLedger.count()
    
    console.log('Database warm-up successful')
    
    return NextResponse.json({
      success: true,
      message: 'Database is warmed up and ready',
      userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database warm-up failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database warm-up failed',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
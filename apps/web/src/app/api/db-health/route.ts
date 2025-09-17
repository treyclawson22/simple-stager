import { NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function GET() {
  try {
    // Simple database health check that also wakes up Supabase
    const start = Date.now()
    
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`
    
    // Test table access
    const userCount = await prisma.user.count()
    
    const responseTime = Date.now() - start
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      userCount,
      timestamp: new Date().toISOString(),
      message: 'Database is awake and ready'
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
      message: 'Database connection failed'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const resolvedParams = await params
    const requestedUserId = resolvedParams.id
    const currentUserId = (session.user as any).id
    
    // Users can only fetch their own data
    if (requestedUserId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        referralCode: true,
        authProvider: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
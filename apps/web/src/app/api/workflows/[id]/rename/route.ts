import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { getCurrentUser } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const workflowId = resolvedParams.id
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if workflow belongs to user
    const workflow = await prisma.workflow.findFirst({
      where: { 
        id: workflowId,
        userId: user.id
      }
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Update workflow name
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { name: name.trim() }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Workflow rename error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
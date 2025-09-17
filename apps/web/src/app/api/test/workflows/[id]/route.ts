import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const workflowId = resolvedParams.id

    // Get test user
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      return NextResponse.json({ error: 'Test user not found' }, { status: 404 })
    }

    // Get specific workflow with results
    const workflow = await prisma.workflow.findFirst({
      where: { 
        id: workflowId,
        userId: testUser.id
      },
      include: {
        results: true
      }
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)

  } catch (error) {
    console.error('Fetch workflow error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
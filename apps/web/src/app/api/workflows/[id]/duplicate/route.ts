import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function POST(
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

    // Get the original workflow
    const originalWorkflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
    })

    if (!originalWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Create a duplicate workflow
    const newWorkflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        goal: originalWorkflow.goal,
        roomType: originalWorkflow.roomType,
        style: originalWorkflow.style,
        colorNotes: originalWorkflow.colorNotes,
        budgetVibe: originalWorkflow.budgetVibe,
        sourceImage: originalWorkflow.sourceImage,
        previewUrl: originalWorkflow.previewUrl,
        thumbnailUrl: originalWorkflow.thumbnailUrl,
        status: 'ready', // Reset status for new workflow
        editsUsed: 0, // Reset edit count
      },
    })

    return NextResponse.json(newWorkflow)
  } catch (error) {
    console.error('Duplicate workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate workflow' },
      { status: 500 }
    )
  }
}
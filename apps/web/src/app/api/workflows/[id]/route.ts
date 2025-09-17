import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function DELETE(
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

    // Verify workflow ownership
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Delete the workflow (cascade will handle related records)
    await prisma.workflow.delete({
      where: {
        id: workflowId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body = await request.json()

    // Verify workflow ownership
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Update workflow settings
    const updatedWorkflow = await prisma.workflow.update({
      where: {
        id: workflowId,
      },
      data: {
        goal: body.goal || workflow.goal,
        roomType: body.roomType || workflow.roomType,
        style: body.style || workflow.style,
        colorNotes: body.colorNotes || workflow.colorNotes,
        budgetVibe: body.budgetVibe || workflow.budgetVibe,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error('Update workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}
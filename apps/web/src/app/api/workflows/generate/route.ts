import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { addImageGenerationJob } from '@simple-stager/queue'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { workflowId, prompt } = body

    if (!workflowId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify workflow ownership
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check if user has enough credits
    if (user.credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Check edit limit (max 15 per workflow)
    if (workflow.editsUsed >= 15) {
      return NextResponse.json(
        { error: 'Maximum edits reached for this workflow' },
        { status: 429 }
      )
    }

    // Update workflow with prompt and increment edits
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: 'processing',
        editsUsed: workflow.editsUsed + 1,
      },
    })

    // Queue the image generation job
    const job = await addImageGenerationJob({
      workflowId,
      prompt,
      sourceImage: workflow.sourceImage,
      provider: 'nanobanana',
    })

    return NextResponse.json({ 
      jobId: job.id,
      message: 'Generation started' 
    })

  } catch (error) {
    console.error('Generation start error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    )
  }
}
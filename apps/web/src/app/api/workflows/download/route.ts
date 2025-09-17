import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { workflowId } = await request.json()

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    // Check if user has enough credits
    const DOWNLOAD_COST = 1
    if (user.credits < DOWNLOAD_COST) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Get the workflow to ensure it exists and belongs to the user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id
      }
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check if this workflow result has already been downloaded (to prevent double charging)
    const existingResult = await prisma.result.findFirst({
      where: {
        workflowId: workflowId,
        downloaded: true
      }
    })

    if (existingResult) {
      // Already downloaded, don't charge again
      return NextResponse.json({ 
        success: true, 
        message: 'Download already recorded',
        creditsRemaining: user.credits 
      })
    }

    // Start a transaction to deduct credits and record the download
    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct credits from user
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: {
            decrement: DOWNLOAD_COST
          }
        }
      })

      // Record the download in credit ledger
      await tx.creditLedger.create({
        data: {
          userId: user.id,
          delta: -DOWNLOAD_COST,
          reason: 'download',
          meta: JSON.stringify({ workflowId: workflowId })
        }
      })

      // Mark the result as downloaded
      await tx.result.updateMany({
        where: {
          workflowId: workflowId
        },
        data: {
          downloaded: true
        }
      })

      // Mark workflow as completed now that it's been downloaded
      await tx.workflow.update({
        where: { id: workflowId },
        data: { status: 'completed' }
      })

      return updatedUser
    })

    console.log(`Download processed for workflow ${workflowId}: credits deducted from ${user.credits} to ${result.credits}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Download recorded and credits deducted',
      creditsRemaining: result.credits
    })

  } catch (error) {
    console.error('Authenticated download processing error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
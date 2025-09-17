import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json()

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    // Get test user instead of requiring auth
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      return NextResponse.json({ error: 'Test user not found' }, { status: 404 })
    }

    // Check if user has enough credits
    const DOWNLOAD_COST = 1
    if (testUser.credits < DOWNLOAD_COST) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Get the workflow to ensure it exists and belongs to the user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: testUser.id
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
        creditsRemaining: testUser.credits 
      })
    }

    // Start a transaction to deduct credits and record the download
    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct credits from user
      const updatedUser = await tx.user.update({
        where: { id: testUser.id },
        data: {
          credits: {
            decrement: DOWNLOAD_COST
          }
        }
      })

      // Record the download in credit ledger
      await tx.creditLedger.create({
        data: {
          userId: testUser.id,
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

    console.log(`Download processed for workflow ${workflowId}: credits deducted from ${testUser.credits} to ${result.credits}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Download recorded and credits deducted',
      creditsRemaining: result.credits
    })

  } catch (error) {
    console.error('Download processing error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
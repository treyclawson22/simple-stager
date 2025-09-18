import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { getR2Storage, isR2Configured } from '@/lib/r2-storage'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
    
    // Get the latest result to find the file to download
    const latestResult = await prisma.result.findFirst({
      where: { workflowId },
      orderBy: { createdAt: 'desc' }
    })

    if (!latestResult) {
      return NextResponse.json({ error: 'No result found for this workflow' }, { status: 404 })
    }

    try {
      // Stream the file directly with download headers
      let fileBuffer: Buffer

      if (isR2Configured()) {
        // Fetch from R2 storage
        const response = await fetch(latestResult.fullresUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch file from R2: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        fileBuffer = Buffer.from(arrayBuffer)
      } else {
        // Read from local file system
        const localPath = latestResult.fullresUrl.replace('/uploads/', '')
        const filePath = join(process.cwd(), 'public/uploads', localPath)
        
        if (!existsSync(filePath)) {
          throw new Error('File not found on local storage')
        }
        
        fileBuffer = await readFile(filePath)
      }

      // Get workflow name for filename
      const workflowName = workflow.name || `staged-room-${workflowId.slice(0, 8)}`
      const filename = `${workflowName}-enhanced.jpg`

      // Return the file with proper download headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      })

    } catch (fileError) {
      console.error('File download error:', fileError)
      return NextResponse.json({ 
        success: true,
        message: 'Credits deducted but file download failed',
        creditsRemaining: result.credits,
        error: 'File access error'
      }, { status: 206 }) // Partial content - payment processed but download failed
    }

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
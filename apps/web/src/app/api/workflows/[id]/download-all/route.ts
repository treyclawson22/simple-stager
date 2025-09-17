import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'

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

    // Get workflow with results
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
      include: {
        results: true,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (workflow.results.length === 0) {
      return NextResponse.json({ error: 'No results to download' }, { status: 400 })
    }

    // Check if user has enough credits
    const totalCost = workflow.results.length
    if (user.credits < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ${totalCost} credits, have ${user.credits}.` 
      }, { status: 400 })
    }

    // Create ZIP file
    const zip = new JSZip()
    
    // Add original image
    try {
      const originalImagePath = path.join(process.cwd(), 'public', workflow.sourceImage)
      if (fs.existsSync(originalImagePath)) {
        const originalImageBuffer = fs.readFileSync(originalImagePath)
        zip.file('original.jpg', originalImageBuffer)
      }
    } catch (error) {
      console.error('Error adding original image:', error)
    }

    // Add all result images (full resolution)
    for (let i = 0; i < workflow.results.length; i++) {
      const result = workflow.results[i]
      
      try {
        // Use full resolution URL if available, otherwise use watermarked
        const imageUrl = result.fullresUrl || result.watermarkedUrl
        const imagePath = path.join(process.cwd(), 'public', imageUrl)
        
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath)
          const filename = result.fullresUrl ? `enhanced_${i + 1}.jpg` : `enhanced_${i + 1}_watermarked.jpg`
          zip.file(filename, imageBuffer)
        }
      } catch (error) {
        console.error(`Error adding result image ${i + 1}:`, error)
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Deduct credits and mark results as downloaded
    await prisma.$transaction([
      // Deduct credits
      prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: -totalCost,
          reason: 'download',
          meta: `Bulk download workflow ${workflowId}`,
        },
      }),
      // Update user credits
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: totalCost } },
      }),
      // Mark all results as downloaded
      prisma.result.updateMany({
        where: {
          workflowId: workflowId,
        },
        data: {
          downloaded: true,
        },
      }),
    ])

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="simplestager-workflow-${workflowId}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download all error:', error)
    return NextResponse.json(
      { error: 'Failed to download all results' },
      { status: 500 }
    )
  }
}
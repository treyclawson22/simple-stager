import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { generateImage } from '@/lib/nano-banana'
import { addWatermark, createThumbnail } from '@/lib/watermark'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { workflowId, prompt, baseImagePath } = body

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

    // Check edit limit (max 15 per workflow)
    if (workflow.editsUsed >= 15) {
      return NextResponse.json(
        { error: 'Maximum edits reached for this workflow' },
        { status: 429 }
      )
    }

    // Update workflow to increment edits
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        editsUsed: workflow.editsUsed + 1,
      },
    })

    try {
      console.log('Starting authenticated reenhancement for workflow:', workflowId)
      console.log('Base image path:', baseImagePath)
      console.log('Reenhancement prompt:', prompt)
      
      // Use the base image path (could be original or previous reenhancement)
      const sourceImageToUse = baseImagePath || workflow.sourceImage
      
      // Generate reenhanced image using Gemini
      let result
      try {
        console.log('Calling generateImage function for reenhancement...')
        result = await generateImage(sourceImageToUse, prompt)
        console.log('Reenhancement generateImage returned:', result?.success ? 'SUCCESS' : 'FAILED')
      } catch (error) {
        console.error('Reenhancement image generation threw error:', error)
        result = { success: false, error: 'Reenhancement generation failed' }
      }
      
      // If generation fails, throw error
      if (!result.success || !result.imageUrl) {
        throw new Error('Reenhancement generation failed')
      }

      // Handle the generated image
      let imageBuffer: Buffer
      
      if (result.imageUrl.startsWith('data:')) {
        // Handle base64 data URL from Gemini
        const base64Data = result.imageUrl.split(',')[1]
        imageBuffer = Buffer.from(base64Data, 'base64')
        console.log('Processing base64 reenhanced image from Gemini, size:', imageBuffer.byteLength, 'bytes')
      } else {
        // Handle external URL (fallback case)
        const response = await fetch(result.imageUrl)
        if (!response.ok) {
          console.error('Failed to fetch reenhanced image from:', result.imageUrl, 'Status:', response.status)
          throw new Error(`Failed to download reenhanced image: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
      }
      
      if (imageBuffer.byteLength === 0) {
        throw new Error('Reenhanced image is empty')
      }
      
      // Create workflow directory
      const workflowDir = join(process.cwd(), 'public/uploads', workflowId)
      if (!existsSync(workflowDir)) {
        await mkdir(workflowDir, { recursive: true })
      }

      // Save the reenhanced image
      const reenhancedPath = join(workflowDir, 'reenhanced.jpg')
      await writeFile(reenhancedPath, Buffer.from(imageBuffer))

      // Create watermarked version (overwrites previous watermarked.jpg)
      const watermarkedPath = join(workflowDir, 'watermarked.jpg')
      await addWatermark(reenhancedPath, watermarkedPath)

      // Create thumbnail
      const thumbnailPath = join(workflowDir, 'reenhanced_thumb.jpg')
      await createThumbnail(watermarkedPath, 200)

      const reenhancedUrl = `/uploads/${workflowId}/reenhanced.jpg`
      const watermarkedUrl = `/uploads/${workflowId}/watermarked.jpg`

      // Create new result record for the reenhancement
      const dbResult = await prisma.result.create({
        data: {
          workflowId,
          jobId: 'reenhancement-' + Date.now(),
          watermarkedUrl,
          fullresUrl: reenhancedUrl,
        },
      })

      // Update workflow preview URL
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { 
          previewUrl: watermarkedUrl,
        },
      })

      return NextResponse.json({ 
        resultId: dbResult.id,
        imageUrl: reenhancedUrl,
        watermarkedUrl: watermarkedUrl,
        message: 'Reenhancement completed successfully' 
      })

    } catch (error) {
      console.error('Reenhancement failed:', error)
      throw error
    }

  } catch (error) {
    console.error('Authenticated reenhancement error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to reenhance image' },
      { status: 500 }
    )
  }
}
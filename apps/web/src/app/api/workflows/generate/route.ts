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
    const { workflowId, prompt, projectName } = body

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

    // Process image generation directly (no queue)
    try {
      console.log('Starting authenticated image generation for workflow:', workflowId)
      console.log('Source image path:', workflow.sourceImage)
      console.log('Prompt length:', prompt.length)
      
      // Generate image using Gemini
      let result
      try {
        console.log('Calling generateImage function...')
        result = await generateImage(workflow.sourceImage, prompt)
        console.log('generateImage returned:', result?.success ? 'SUCCESS' : 'FAILED')
      } catch (error) {
        console.error('Real image generation threw error:', error)
        result = { success: false, error: 'Real generation failed' }
      }
      
      // If real generation fails, throw error
      if (!result.success || !result.imageUrl) {
        throw new Error('Image generation failed')
      }

      // Handle the generated image (could be data URL from Gemini or external URL)
      let imageBuffer: Buffer
      
      if (result.imageUrl.startsWith('data:')) {
        // Handle base64 data URL from Gemini
        const base64Data = result.imageUrl.split(',')[1]
        imageBuffer = Buffer.from(base64Data, 'base64')
        console.log('Processing base64 image from Gemini, size:', imageBuffer.byteLength, 'bytes')
      } else {
        // Handle external URL (fallback case)
        const response = await fetch(result.imageUrl)
        if (!response.ok) {
          console.error('Failed to fetch image from:', result.imageUrl, 'Status:', response.status)
          throw new Error(`Failed to download generated image: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
      }
      
      if (imageBuffer.byteLength === 0) {
        throw new Error('Generated image is empty')
      }
      
      // Create workflow directory
      const workflowDir = join(process.cwd(), 'public/uploads', workflowId)
      if (!existsSync(workflowDir)) {
        await mkdir(workflowDir, { recursive: true })
      }

      // Save the original generated image
      const originalPath = join(workflowDir, 'generated.jpg')
      await writeFile(originalPath, Buffer.from(imageBuffer))

      // Create watermarked version
      const watermarkedPath = join(workflowDir, 'watermarked.jpg')
      await addWatermark(originalPath, watermarkedPath)

      // Create thumbnail
      const thumbnailPath = join(workflowDir, 'generated_thumb.jpg')
      await createThumbnail(watermarkedPath, 200)

      // Verify all files exist before updating database
      const originalUrl = `/uploads/${workflowId}/generated.jpg`
      const watermarkedUrl = `/uploads/${workflowId}/watermarked.jpg`
      
      if (!existsSync(originalPath)) {
        throw new Error('Generated image file not found')
      }
      if (!existsSync(watermarkedPath)) {
        throw new Error('Watermarked image file not found')
      }
      if (!existsSync(thumbnailPath)) {
        console.warn('Thumbnail file not found, but continuing...')
      }
      
      console.log('✅ All image files verified to exist before database update')
      
      // Small delay to ensure filesystem operations are complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create result record
      const dbResult = await prisma.result.create({
        data: {
          workflowId,
          jobId: 'direct-job-' + Date.now(),
          watermarkedUrl,
          fullresUrl: originalUrl,
        },
      })

      // Update workflow status - keep as 'ready' to allow download
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { 
          status: 'ready',
          previewUrl: watermarkedUrl,
          ...(projectName && { name: projectName }),
        },
      })

      return NextResponse.json({ 
        resultId: dbResult.id,
        imageUrl: originalUrl,
        message: 'Generation completed successfully' 
      })

    } catch (error) {
      console.error('Image generation failed:', error)

      // Update workflow status to failed
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { status: 'failed' },
      })

      throw error
    }

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
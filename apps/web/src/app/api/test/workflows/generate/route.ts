import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { generateImage, mockGenerateImage } from '@/lib/nano-banana'
import { addWatermark, createThumbnail } from '@/lib/watermark'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflowId, prompt } = body

    if (!workflowId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify workflow exists
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Update workflow status
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: 'processing' },
    })

    try {
      console.log('Starting image generation for workflow:', workflowId)
      console.log('Source image path:', workflow.sourceImage)
      console.log('Prompt length:', prompt.length)
      
      // Try real Gemini image generation first
      let result
      try {
        console.log('Calling generateImage function...')
        result = await generateImage(workflow.sourceImage, prompt)
        console.log('generateImage returned:', result?.success ? 'SUCCESS' : 'FAILED')
      } catch (error) {
        console.error('Real image generation threw error:', error)
        result = { success: false, error: 'Real generation failed' }
      }
      
      // If real generation fails, throw error (no mock fallback)
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

      const originalUrl = `/uploads/${workflowId}/generated.jpg`
      const watermarkedUrl = `/uploads/${workflowId}/watermarked.jpg`

      // Create result record
      const dbResult = await prisma.result.create({
        data: {
          workflowId,
          jobId: 'test-job-' + Date.now(),
          watermarkedUrl,
          fullresUrl: originalUrl,
        },
      })

      // Update workflow status - keep as 'ready' to allow refinement until download
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { 
          status: 'ready',
          previewUrl: watermarkedUrl,
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
    console.error('Test generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    )
  }
}
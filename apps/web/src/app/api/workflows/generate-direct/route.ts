import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { generateImage } from '@/lib/nano-banana'
import { addWatermark, createThumbnail } from '@/lib/watermark'
import { getR2Storage, isR2Configured } from '@/lib/r2-storage'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { workflowId, prompt, projectName } = body

    console.log('Generate-direct called with:', { workflowId, promptLength: prompt?.length, projectName })

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

    // Update workflow status
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { 
        status: 'processing',
        editsUsed: workflow.editsUsed + 1,
      },
    })

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

      let originalUrl: string
      let watermarkedUrl: string

      if (isR2Configured()) {
        // Use R2 cloud storage
        const r2Storage = getR2Storage()

        // Process original image
        const originalBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 95 })
          .toBuffer()

        // Create watermark using Sharp directly (no file paths needed)
        const metadata = await sharp(imageBuffer).metadata()
        const width = metadata.width || 1024
        const height = metadata.height || 1024
        const fontSize = Math.max(20, Math.floor(width * 0.02))
        const diagonalLength = Math.sqrt(width * width + height * height)
        const textSpacing = Math.max(200, Math.floor(diagonalLength / 8))
        
        const watermarkSvg = `
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="watermarkPattern" x="0" y="0" width="${textSpacing}" height="${textSpacing}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <text 
                  x="50%" 
                  y="50%" 
                  text-anchor="middle" 
                  dominant-baseline="middle" 
                  fill="rgba(255,255,255,0.15)" 
                  font-family="Arial, sans-serif" 
                  font-size="${fontSize}" 
                  font-weight="bold"
                >Simple Stager</text>
              </pattern>
              <pattern id="linePattern" x="0" y="0" width="${textSpacing * 0.3}" height="${textSpacing * 0.3}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#linePattern)"/>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#watermarkPattern)"/>
          </svg>
        `

        // Create watermarked version
        const watermarkedBuffer = await sharp(imageBuffer)
          .composite([{
            input: Buffer.from(watermarkSvg),
            top: 0,
            left: 0,
            blend: 'over'
          }])
          .jpeg({ quality: 90 })
          .toBuffer()

        // Create thumbnail
        const thumbnailBuffer = await sharp(watermarkedBuffer)
          .resize(200, 200, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer()

        // Upload to R2
        const originalKey = `workflows/${workflowId}/staged/generated.jpg`
        const watermarkedKey = `workflows/${workflowId}/staged/watermarked.jpg`
        const thumbnailKey = `workflows/${workflowId}/staged/thumb.jpg`

        originalUrl = await r2Storage.uploadFile(originalKey, originalBuffer, 'image/jpeg')
        watermarkedUrl = await r2Storage.uploadFile(watermarkedKey, watermarkedBuffer, 'image/jpeg')
        await r2Storage.uploadFile(thumbnailKey, thumbnailBuffer, 'image/jpeg')

      } else {
        // Fallback to local storage (for development)
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

        originalUrl = `/uploads/${workflowId}/generated.jpg`
        watermarkedUrl = `/uploads/${workflowId}/watermarked.jpg`
      }

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
      const updateData = { 
        status: 'ready',
        previewUrl: watermarkedUrl,
        ...(projectName && { name: projectName }),
      }
      console.log('Updating workflow with data:', updateData)
      
      await prisma.workflow.update({
        where: { id: workflowId },
        data: updateData,
      })

      // Don't deduct credits on generation - only on download like test system

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
    console.error('Authenticated generation error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    )
  }
}
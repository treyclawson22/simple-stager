import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { generateImage } from '@/lib/nano-banana'
import { addWatermark, createThumbnail } from '@/lib/watermark'
import { fileStorage } from '@/lib/file-storage'
import { writeFile, mkdir } from 'fs/promises'
import fs from 'fs'
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
      
      // Upload reenhanced image to storage (R2 or local fallback)
      console.log('Uploading reenhanced image to storage...')
      const reenhancedStorage = await fileStorage.uploadFile(
        imageBuffer,
        'reenhanced.jpg',
        workflowId,
        'staged'
      )

      // Create watermarked version in memory
      console.log('Creating watermarked version...')
      let watermarkedBuffer: Buffer
      
      if (reenhancedStorage.isCloudStorage) {
        // For cloud storage, we need to apply watermark in memory
        // Download the image, apply watermark, then upload watermarked version
        const response = await fetch(reenhancedStorage.url)
        const originalBuffer = Buffer.from(await response.arrayBuffer())
        
        // Apply watermark using temporary files (Sharp limitation)
        const tempDir = join(process.cwd(), 'temp')
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true })
        }
        
        const tempOriginal = join(tempDir, `temp_${workflowId}_original.jpg`)
        const tempWatermarked = join(tempDir, `temp_${workflowId}_watermarked.jpg`)
        
        await writeFile(tempOriginal, originalBuffer)
        await addWatermark(tempOriginal, tempWatermarked)
        watermarkedBuffer = await fs.readFile(tempWatermarked)
        
        // Clean up temp files
        await fs.unlink(tempOriginal).catch(() => {})
        await fs.unlink(tempWatermarked).catch(() => {})
      } else {
        // For local storage, create watermarked version normally
        const localPath = join(process.cwd(), 'apps/web/public', reenhancedStorage.url)
        const watermarkedPath = localPath.replace('reenhanced.jpg', 'watermarked.jpg')
        await addWatermark(localPath, watermarkedPath)
        watermarkedBuffer = await fs.readFile(watermarkedPath)
      }

      // Upload watermarked version to storage
      console.log('Uploading watermarked version to storage...')
      const watermarkedStorage = await fileStorage.uploadFile(
        watermarkedBuffer,
        'watermarked.jpg',
        workflowId,
        'staged'
      )

      const reenhancedUrl = reenhancedStorage.url
      const watermarkedUrl = watermarkedStorage.url

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
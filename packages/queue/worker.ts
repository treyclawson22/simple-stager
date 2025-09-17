import { Worker, Job } from 'bullmq'
import { redis } from './connection'
import { ImageGenerationJob } from '@simple-stager/shared'
import { prisma } from '@simple-stager/database'

import { addWatermark, createThumbnail } from '../../apps/web/src/lib/watermark'
import { generateImage, mockGenerateImage } from '../../apps/web/src/lib/nano-banana'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

async function processImageGeneration(sourceImage: string, prompt: string, workflowId: string) {
  try {
    // Use mock generation for development
    const result = await mockGenerateImage(sourceImage, prompt)
    
    if (!result.success || !result.imageUrl) {
      throw new Error('Image generation failed')
    }

    // Download the generated image
    const response = await fetch(result.imageUrl)
    if (!response.ok) {
      throw new Error('Failed to download generated image')
    }

    const imageBuffer = await response.arrayBuffer()
    
    // Create workflow directory
    const workflowDir = join(process.cwd(), 'apps/web/public/uploads', workflowId)
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

    return {
      success: true,
      originalUrl: `/uploads/${workflowId}/generated.jpg`,
      watermarkedUrl: `/uploads/${workflowId}/watermarked.jpg`,
      thumbnailUrl: `/uploads/${workflowId}/generated_thumb.jpg`
    }

  } catch (error) {
    console.error('Image processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const imageWorker = new Worker(
  'image-generation',
  async (job: Job<ImageGenerationJob>) => {
    const { workflowId, prompt, sourceImage, provider } = job.data
    
    try {
      // Update job status to processing
      await prisma.job.create({
        data: {
          workflowId,
          status: 'processing',
          provider,
          prompt,
        },
      })

      // Update workflow status
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { status: 'processing' },
      })

      // Generate and process image
      const result = await processImageGeneration(sourceImage, prompt, workflowId)
      
      if (!result.success) {
        throw new Error(result.error || 'Image generation failed')
      }

      // Create result record
      const dbResult = await prisma.result.create({
        data: {
          workflowId,
          jobId: job.id!,
          watermarkedUrl: result.watermarkedUrl!,
          fullresUrl: result.originalUrl!,
        },
      })

      // Update workflow status
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { 
          status: 'completed',
          previewUrl: result.watermarkedUrl!,
        },
      })

      // Update job status
      await prisma.job.updateMany({
        where: { workflowId },
        data: { 
          status: 'completed',
          resultUrl: result.originalUrl!,
          finishedAt: new Date(),
        },
      })

      return { resultId: dbResult.id, imageUrl: result.originalUrl! }

    } catch (error) {
      console.error('Image generation job failed:', error)

      // Update job status to failed
      await prisma.job.updateMany({
        where: { workflowId },
        data: { 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          finishedAt: new Date(),
        },
      })

      // Update workflow status
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { status: 'failed' },
      })

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 3,
  }
)
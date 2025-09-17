import { Queue } from 'bullmq'
import { redis } from './connection'
import { ImageGenerationJob } from '@simple-stager/shared'

let imageQueue: Queue | null = null

// Initialize queue only if Redis is available
if (redis) {
  try {
    imageQueue = new Queue('image-generation', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    })
  } catch (error) {
    console.warn('Failed to initialize image queue:', error)
    imageQueue = null
  }
}

export async function addImageGenerationJob(data: ImageGenerationJob) {
  if (!imageQueue) {
    console.log('Queue not available, processing image generation directly')
    
    // For now, throw an error to indicate queue is not available
    // In production, this could be handled by processing immediately
    // or storing in database for later processing
    throw new Error('Queue system not available - direct processing not implemented yet')
  }
  
  return await imageQueue.add('generate', data, {
    priority: 1,
  })
}

export { imageQueue }
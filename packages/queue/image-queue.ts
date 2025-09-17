import { Queue } from 'bullmq'
import { redis } from './connection'
import { ImageGenerationJob } from '@simple-stager/shared'

export const imageQueue = new Queue('image-generation', {
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

export async function addImageGenerationJob(data: ImageGenerationJob) {
  return await imageQueue.add('generate', data, {
    priority: 1,
  })
}
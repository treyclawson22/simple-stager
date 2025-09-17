#!/usr/bin/env node

// Import the worker
const { imageWorker } = require('./worker.ts')

console.log('🚀 Starting SimpleStager image processing worker...')

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📤 Shutting down worker gracefully...')
  await imageWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('📤 Shutting down worker gracefully...')
  await imageWorker.close()
  process.exit(0)
})

// Keep the process alive
imageWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`)
})

imageWorker.on('failed', (job, err) => {
  console.log(`❌ Job ${job?.id || 'unknown'} failed:`, err.message)
})

imageWorker.on('error', (err) => {
  console.error('💥 Worker error:', err)
})

console.log('👀 Worker is running and waiting for jobs...')
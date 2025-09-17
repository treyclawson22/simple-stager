import IORedis from 'ioredis'

let redis: IORedis | null = null

// Initialize Redis connection only if URL is provided and not a mock
const redisUrl = process.env.REDIS_URL
const isMockRedis = !redisUrl || redisUrl.includes('mock://') || redisUrl === 'redis://localhost:6379'

if (!isMockRedis) {
  try {
    redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      retryDelayOnFailover: 100,
    })
    
    redis.on('error', (error) => {
      console.warn('Redis connection error (will fallback to direct processing):', error.message)
      redis = null
    })
  } catch (error) {
    console.warn('Failed to initialize Redis connection:', error)
    redis = null
  }
}

export { redis }
import IORedis from 'ioredis'

export const redis = new IORedis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  }
)
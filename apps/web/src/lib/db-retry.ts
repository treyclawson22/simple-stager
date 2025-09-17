import { PrismaClientInitializationError } from '@prisma/client/runtime/library'
import { prisma } from '@simple-stager/database'

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: number
  wakeUpDatabase?: boolean
}

/**
 * Wake up Supabase database with simple query
 */
async function wakeUpDatabase(): Promise<boolean> {
  try {
    // Simple query to wake up the database
    await prisma.$queryRaw`SELECT 1`
    console.log('Database wake-up successful')
    return true
  } catch (error) {
    console.log('Database wake-up failed:', (error as Error).message)
    return false
  }
}

/**
 * Enhanced retry with database wake-up for Supabase
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 6, delay = 2000, backoff = 1.5, wakeUpDatabase: shouldWakeUp = true } = options
  
  // Try to wake up database on first attempt if enabled
  if (shouldWakeUp) {
    console.log('Attempting to wake up database...')
    await wakeUpDatabase()
    // Give database a moment to fully wake up
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const isConnectionError = 
        error instanceof PrismaClientInitializationError ||
        (error as any)?.message?.includes('Can\'t reach database server') ||
        (error as any)?.message?.includes('Connection terminated') ||
        (error as any)?.message?.includes('Connection refused') ||
        (error as any)?.message?.includes('ECONNREFUSED') ||
        (error as any)?.message?.includes('timeout')
      
      if (!isConnectionError || attempt === maxRetries) {
        console.error(`Database operation failed after ${attempt} attempts:`, (error as Error).message)
        throw error
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1)
      console.log(`Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${waitTime}ms...`)
      
      // Try to wake up database again on connection failures
      if (shouldWakeUp && attempt <= 2) {
        console.log('Attempting additional database wake-up...')
        await wakeUpDatabase()
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw new Error('Max database retry attempts exceeded')
}
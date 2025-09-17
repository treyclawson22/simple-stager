import { PrismaClientInitializationError } from '@prisma/client/runtime/library'

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: number
}

/**
 * Retry database operations with exponential backoff
 * Useful for handling Supabase database wake-up delays
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const isConnectionError = 
        error instanceof PrismaClientInitializationError ||
        (error as any)?.message?.includes('Can\'t reach database server') ||
        (error as any)?.message?.includes('Connection terminated') ||
        (error as any)?.message?.includes('ECONNREFUSED')
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error
      }
      
      console.log(`Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`)
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)))
    }
  }
  
  throw new Error('Max retries exceeded')
}
import { PrismaClient } from '@simple-stager/database'

// Create a robust Prisma client with optimized connection settings for Supabase
const createRobustPrismaClient = () => {
  const baseUrl = process.env.DATABASE_URL || ''
  
  // Add connection pooling and timeout parameters to the URL
  const enhancedUrl = baseUrl.includes('?') 
    ? `${baseUrl}&connection_limit=5&pool_timeout=20&connect_timeout=60&statement_timeout=60000`
    : `${baseUrl}?connection_limit=5&pool_timeout=20&connect_timeout=60&statement_timeout=60000`
  
  console.log('🔧 Creating Prisma client with enhanced connection settings')
  
  return new PrismaClient({
    datasources: {
      db: {
        url: enhancedUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Global client instance with connection management
let globalPrisma: PrismaClient | undefined

export const getRobustPrisma = (): PrismaClient => {
  if (!globalPrisma) {
    globalPrisma = createRobustPrismaClient()
  }
  return globalPrisma
}

// Enhanced database operation with multiple connection strategies
export async function executeWithRobustConnection<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  maxAttempts = 10
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Database attempt ${attempt}/${maxAttempts}`)
    
    try {
      // Get fresh prisma instance for each attempt
      const prisma = getRobustPrisma()
      
      // Test connection first
      await prisma.$queryRaw`SELECT 1 as test`
      
      // Execute the actual operation
      const result = await operation(prisma)
      
      console.log(`Database operation successful on attempt ${attempt}`)
      return result
      
    } catch (error) {
      lastError = error as Error
      console.log(`Attempt ${attempt} failed:`, lastError.message)
      
      // Disconnect and recreate client on connection errors
      if (globalPrisma && (
        lastError.message.includes('Can\'t reach database') ||
        lastError.message.includes('Connection terminated') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('timeout')
      )) {
        try {
          await globalPrisma.$disconnect()
        } catch (disconnectError) {
          console.log('Disconnect error (ignoring):', (disconnectError as Error).message)
        }
        globalPrisma = undefined
      }
      
      // Progressive delay with randomization to avoid thundering herd
      if (attempt < maxAttempts) {
        const baseDelay = Math.min(1000 * Math.pow(1.5, attempt - 1), 8000)
        const jitter = Math.random() * 1000
        const delay = baseDelay + jitter
        
        console.log(`Waiting ${Math.round(delay)}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw new Error(`Database operation failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`)
}

// Cleanup function for graceful shutdown
export async function disconnectRobustPrisma() {
  if (globalPrisma) {
    await globalPrisma.$disconnect()
    globalPrisma = undefined
  }
}
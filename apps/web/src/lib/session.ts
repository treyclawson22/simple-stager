import { auth } from './auth'
import { prisma } from '@simple-stager/database'

export async function getCurrentUser() {
  const session = await auth()
  
  if (!session?.user || !(session.user as any).id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      plan: true,
      creditLedger: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { WorkflowLayout } from '@/components/workflow/workflow-layout'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const resolvedParams = await params
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: resolvedParams.id,
      userId: user.id,
    },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
      },
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!workflow) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <WorkflowLayout workflow={workflow} user={user} />
    </div>
  )
}
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { WorkflowEditForm } from '@/components/workflow/workflow-edit-form'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'

interface WorkflowEditPageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowEditPage({ params }: WorkflowEditPageProps) {
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
  })

  if (!workflow) {
    notFound()
  }

  if (workflow.status === 'processing') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cannot edit workflow while processing
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Workflow is processing
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This workflow is currently being processed and cannot be edited. 
                  Please wait for it to complete, then try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Workflow</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update the settings for "{getWorkflowGoalDisplay(workflow.goal)}"
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <WorkflowEditForm workflow={workflow} />
      </div>
    </div>
  )
}
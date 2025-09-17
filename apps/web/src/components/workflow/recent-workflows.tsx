import Link from 'next/link'
import { prisma } from '@simple-stager/database'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'
import { WorkflowDeleteButton } from './workflow-delete-button'

interface RecentWorkflowsProps {
  userId: string
}

export async function RecentWorkflows({ userId }: RecentWorkflowsProps) {
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      results: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (workflows.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4" style={{ color: '#464646' }}>Recent Staging Projects</h3>
        <div className="text-center py-6">
          <p style={{ color: '#6B7280' }}>No staging projects yet. Create your first one above!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium" style={{ color: '#464646' }}>Recent Staging Projects</h3>
        <Link
          href="/history"
          className="text-sm hover:text-teal-600 transition-colors"
          style={{ color: '#089AB2' }}
        >
          View all
        </Link>
      </div>
      
      <div className="space-y-4">
        {workflows.map((workflow: any) => (
          <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <Link
                href={workflow.status === 'ready' ? `/dashboard?resume=${workflow.id}` : `/workflow/${workflow.id}`}
                className="flex items-center space-x-4 flex-1"
              >
                {workflow.results.length > 0 && workflow.results[0].watermarkedUrl ? (
                  <img
                    src={workflow.results[0].watermarkedUrl}
                    alt="Enhanced room"
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : workflow.thumbnailUrl ? (
                  <img
                    src={workflow.thumbnailUrl}
                    alt="Original room"
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">IMG</span>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                  </div>
                  {workflow.roomType && (
                    <div className="text-sm text-gray-500">{workflow.roomType}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  workflow.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : workflow.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : workflow.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : workflow.status === 'ready'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {workflow.status === 'ready' ? 'Continue' : workflow.status}
                </span>
                
                {workflow.results.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {workflow.results.length} result{workflow.results.length === 1 ? '' : 's'}
                  </span>
                )}

                {/* Delete button for non-completed workflows */}
                {workflow.status !== 'completed' && (
                  <WorkflowDeleteButton 
                    workflowId={workflow.id}
                    workflowName={workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
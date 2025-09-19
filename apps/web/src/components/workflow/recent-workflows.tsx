import Link from 'next/link'
import { prisma } from '@simple-stager/database'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'
import { WorkflowDeleteButton } from './workflow-delete-button'
import { FallbackImage } from '@/components/ui/fallback-image'

interface RecentWorkflowsProps {
  userId: string
}

export async function RecentWorkflows({ userId }: RecentWorkflowsProps) {
  // Get the latest 5 workflows for display, plus count total for "View More" button
  const [workflows, totalCount] = await Promise.all([
    prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        results: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.workflow.count({ where: { userId } })
  ])

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
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium" style={{ color: '#464646' }}>Recent Staging Projects</h3>
      </div>
      
      <>
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow: any) => (
                <tr key={workflow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {workflow.results.length > 0 && workflow.results[0].watermarkedUrl ? (
                        <FallbackImage
                          src={workflow.results[0].watermarkedUrl}
                          alt="Staged room"
                          className="h-16 w-16 rounded object-cover"
                          fallbackText=""
                        />
                      ) : workflow.thumbnailUrl ? (
                        <FallbackImage
                          src={workflow.thumbnailUrl}
                          alt="Original room"
                          className="h-16 w-16 rounded object-cover"
                          fallbackText=""
                        />
                      ) : (
                        <FallbackImage
                          src=""
                          alt="No image available"
                          className="h-16 w-16 rounded object-cover"
                          fallbackText=""
                        />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                        </div>
                        {workflow.roomType && (
                          <div className="text-sm text-gray-500">
                            {workflow.roomType}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : workflow.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : workflow.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : workflow.status === 'support_ticket'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.status === 'ready' ? 'Not Complete' : workflow.status === 'support_ticket' ? 'Support Ticket' : workflow.status}
                    </span>
                    {workflow.status !== 'completed' && workflow.status !== 'support_ticket' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {workflow.editsUsed} edits used
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(workflow.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs">
                      {new Date(workflow.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={workflow.status === 'ready' ? `/dashboard?resume=${workflow.id}` : `/workflow/${workflow.id}`}
                      className="font-medium hover:text-teal-600"
                      style={{ color: '#089AB2' }}
                    >
                      {workflow.status === 'ready' ? 'Continue' : 'View'}
                    </Link>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {workflow.status === 'completed' || workflow.status === 'support_ticket' ? (
                      <span className="text-gray-400 text-xs">•••</span>
                    ) : (
                      <WorkflowDeleteButton 
                        workflowId={workflow.id}
                        workflowName={workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Visible on mobile only */}
        <div className="md:hidden space-y-4 p-4">
          {workflows.map((workflow: any) => (
            <div key={workflow.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start space-x-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  {workflow.results.length > 0 && workflow.results[0].watermarkedUrl ? (
                    <FallbackImage
                      src={workflow.results[0].watermarkedUrl}
                      alt="Staged room"
                      className="h-16 w-16 rounded object-cover"
                      fallbackText=""
                    />
                  ) : workflow.thumbnailUrl ? (
                    <FallbackImage
                      src={workflow.thumbnailUrl}
                      alt="Original room"
                      className="h-16 w-16 rounded object-cover"
                      fallbackText=""
                    />
                  ) : (
                    <FallbackImage
                      src=""
                      alt="No image available"
                      className="h-16 w-16 rounded object-cover"
                      fallbackText=""
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                      </h3>
                      {workflow.roomType && (
                        <p className="text-sm text-gray-500 mt-1">
                          {workflow.roomType}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions - Always visible on mobile */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={workflow.status === 'ready' ? `/dashboard?resume=${workflow.id}` : `/workflow/${workflow.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white hover:bg-teal-600 transition-colors"
                        style={{ backgroundColor: '#089AB2' }}
                      >
                        {workflow.status === 'ready' ? 'Continue' : 'View'}
                      </Link>
                      
                      {workflow.status === 'completed' || workflow.status === 'support_ticket' ? (
                        <span className="text-gray-400 text-xs">•••</span>
                      ) : (
                        <WorkflowDeleteButton 
                          workflowId={workflow.id}
                          workflowName={workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Status and Date */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                        workflow.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : workflow.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : workflow.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : workflow.status === 'support_ticket'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.status === 'ready' ? 'Not Complete' : workflow.status === 'support_ticket' ? 'Support Ticket' : workflow.status}
                      </span>
                      {workflow.status !== 'completed' && workflow.status !== 'support_ticket' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {workflow.editsUsed} edits used
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(workflow.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
      
      {/* View More button if there are more than 5 projects */}
      {totalCount > 5 && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <Link
            href="/history"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:bg-teal-600 transition-colors"
            style={{ backgroundColor: '#089AB2' }}
          >
            View More ({totalCount - 5} more project{totalCount - 5 === 1 ? '' : 's'})
          </Link>
        </div>
      )}
    </div>
  )
}
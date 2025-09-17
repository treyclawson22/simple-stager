import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FilterSelect } from '@/components/filter-select'
import { WorkflowDeleteButton } from '@/components/workflow/workflow-delete-button'
import { WorkflowRenameButton } from '@/components/workflow/workflow-rename-button'

interface SearchParams {
  status?: string
  page?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    return notFound()
  }

  const resolvedSearchParams = await searchParams
  const currentPage = parseInt(resolvedSearchParams.page || '1')
  const pageSize = 20
  const skip = (currentPage - 1) * pageSize

  // Build filters
  const where: any = { userId: user.id }
  if (resolvedSearchParams.status && resolvedSearchParams.status !== 'all') {
    where.status = resolvedSearchParams.status
  }

  // Build sorting
  const sortField = resolvedSearchParams.sort || 'createdAt'
  const sortOrder = resolvedSearchParams.order || 'desc'
  
  let orderBy: any = { createdAt: 'desc' }
  if (sortField === 'name') {
    orderBy = { name: sortOrder }
  } else if (sortField === 'status') {
    orderBy = { status: sortOrder }
  } else if (sortField === 'createdAt') {
    orderBy = { createdAt: sortOrder }
  }

  // Get workflows and total count
  const [workflows, totalCount] = await Promise.all([
    prisma.workflow.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        results: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.workflow.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  // Helper function to generate sort URLs
  const getSortUrl = (field: string) => {
    const newOrder = resolvedSearchParams.sort === field && resolvedSearchParams.order === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams({
      ...resolvedSearchParams,
      sort: field,
      order: newOrder,
      page: '1' // Reset to first page when sorting
    })
    return `/history?${params.toString()}`
  }

  // Helper function to get sort icon
  const getSortIcon = (field: string) => {
    if (resolvedSearchParams.sort !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return resolvedSearchParams.order === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#464646' }}>Workflow History</h1>
        <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>
          View and manage all your staging workflows
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#464646' }}>
              Status
            </label>
            <FilterSelect
              name="status"
              current={resolvedSearchParams.status || 'all'}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'ready', label: 'Not Complete' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
          </div>
          
          <div className="flex items-end">
            <div className="text-sm" style={{ color: '#6B7280' }}>
              <span className="font-medium">{totalCount}</span> total workflows
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white shadow rounded-lg">
        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No workflows found matching your filters.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:bg-teal-600" style={{ backgroundColor: '#089AB2' }}
            >
              Create New Workflow
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Link 
                      href={getSortUrl('name')}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      Project
                      {getSortIcon('name')}
                    </Link>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Link 
                      href={getSortUrl('status')}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      Status
                      {getSortIcon('status')}
                    </Link>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Link 
                      href={getSortUrl('createdAt')}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      Date
                      {getSortIcon('createdAt')}
                    </Link>
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
                        {workflow.thumbnailUrl ? (
                          <img
                            src={workflow.thumbnailUrl}
                            alt=""
                            className="h-16 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">IMG</span>
                          </div>
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
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.status === 'ready' ? 'Not Complete' : workflow.status}
                      </span>
                      {workflow.status !== 'completed' && (
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
                      {workflow.status === 'completed' ? (
                        <WorkflowRenameButton 
                          workflowId={workflow.id}
                          currentName={workflow.name || getWorkflowGoalDisplay(workflow.goal)}
                        />
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            {currentPage > 1 && (
              <Link
                href={`/history?${new URLSearchParams({ ...resolvedSearchParams, page: String(currentPage - 1) })}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/history?${new URLSearchParams({ ...resolvedSearchParams, page: String(currentPage + 1) })}`}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{skip + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(skip + pageSize, totalCount)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalCount}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {currentPage > 1 && (
                  <Link
                    href={`/history?${new URLSearchParams({ ...resolvedSearchParams, page: String(currentPage - 1) })}`}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Link
                      key={pageNum}
                      href={`/history?${new URLSearchParams({ ...resolvedSearchParams, page: String(pageNum) })}`}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                })}
                
                {currentPage < totalPages && (
                  <Link
                    href={`/history?${new URLSearchParams({ ...resolvedSearchParams, page: String(currentPage + 1) })}`}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


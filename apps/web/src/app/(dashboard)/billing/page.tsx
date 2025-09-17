import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InteractivePlans } from '@/components/billing/interactive-plans'
import { ReferralBanner } from '@/components/billing/referral-banner'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'

export default async function BillingPage() {
  const user = await getCurrentUser()

  if (!user) {
    return notFound()
  }

  // Get credit ledger history with workflow data for downloads
  const creditHistory = await prisma.creditLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Get workflow IDs from download transactions and fetch workflow data
  const downloadEntries = creditHistory.filter(entry => entry.reason === 'download' && entry.meta)
  const workflowIds = downloadEntries.map(entry => {
    try {
      return JSON.parse(entry.meta).workflowId
    } catch {
      return null
    }
  }).filter(Boolean)

  const workflows = await prisma.workflow.findMany({
    where: { id: { in: workflowIds } },
    select: { id: true, name: true, goal: true }
  })

  const workflowMap = Object.fromEntries(workflows.map(w => [w.id, w]))

  // Calculate monthly usage
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const monthlyUsage = await prisma.creditLedger.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: thirtyDaysAgo },
      delta: { lt: 0 }, // Only debits
    },
  })

  const totalUsageThisMonth = monthlyUsage.reduce((sum, entry) => sum + Math.abs(entry.delta), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#464646' }}>Billing & Credits</h1>
        <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>
          Manage your subscription and track your credit usage
        </p>
      </div>

      {/* Referral Program Banner */}
      <ReferralBanner referralCode={user.referralCode} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan & Credits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Subscription Plans */}
          <InteractivePlans user={user} />

          {/* Usage This Month */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage This Month</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {totalUsageThisMonth}
                </div>
                <div className="text-sm text-gray-600">Credits used</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {monthlyUsage.filter(entry => entry.reason === 'download').length}
                </div>
                <div className="text-sm text-gray-600">Downloads</div>
              </div>
            </div>
          </div>

          {/* Credit History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Credit History</h3>
            
            {creditHistory.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No credit transactions yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditHistory.map((entry, index) => {
                      const runningBalance = creditHistory
                        .slice(index)
                        .reduce((sum, e) => sum + e.delta, user.credits)
                        
                      return (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.reason === 'download' && entry.meta ? (() => {
                              try {
                                const metaData = JSON.parse(entry.meta)
                                const workflowId = metaData.workflowId
                                const workflow = workflowMap[workflowId]
                                const projectName = workflow?.name || getWorkflowGoalDisplay(workflow?.goal || 'stage')
                                
                                return (
                                  <Link 
                                    href={`/workflow/${workflowId}`}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {projectName}
                                  </Link>
                                )
                              } catch {
                                return (
                                  <div>
                                    <div className="capitalize">{entry.reason.replace('_', ' ')}</div>
                                    <div className="text-xs text-gray-500">{entry.meta}</div>
                                  </div>
                                )
                              }
                            })() : (
                              <div>
                                <div className="capitalize">{entry.reason.replace('_', ' ')}</div>
                                {entry.meta && (
                                  <div className="text-xs text-gray-500">
                                    {entry.meta}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              entry.delta > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.delta > 0 ? '+' : ''}{entry.delta}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {runningBalance}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Purchase Options */}
        <div className="space-y-6">
          {/* Pay-As-You-Go Packs */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pay-As-You-Go Packs</h3>
            
            <div className="space-y-3">
              <div className="border rounded-lg p-4 hover:border-gray-300 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">5 Credits</div>
                    <div className="text-sm text-gray-600">$3.00 per credit</div>
                    <div className="text-xs text-gray-500">Occasional use</div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">$15</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:border-gray-300 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">10 Credits</div>
                    <div className="text-sm text-gray-600">$2.70 per credit</div>
                    <div className="text-xs text-gray-500">Good for single listings</div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">$27</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:border-gray-300 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">20 Credits</div>
                    <div className="text-sm text-gray-600">$2.25 per credit</div>
                    <div className="text-xs text-gray-500">Flexible for mid-sized projects</div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">$45</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:border-gray-300 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">50 Credits</div>
                    <div className="text-sm text-gray-600">$2.10 per credit</div>
                    <div className="text-xs text-gray-500">Bulk option without subscription</div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">$105</div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-4 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600" style={{ backgroundColor: '#089AB2' }}>
              Purchase Credits
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
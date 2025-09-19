import { getCurrentUser } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InteractivePlans } from '@/components/billing/interactive-plans'
import { ReferralBanner } from '@/components/billing/referral-banner'
import { CreditPackPurchase } from '@/components/billing/credit-pack-purchase'
import { SubscriptionManagement } from '@/components/billing/subscription-management'
import { BillingClient } from '@/components/billing/billing-client'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const resolvedSearchParams = await searchParams
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
  const downloadEntries = creditHistory.filter((entry: any) => entry.reason === 'download' && entry.meta)
  const workflowIds = downloadEntries.map((entry: any) => {
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

  const workflowMap = Object.fromEntries(workflows.map((w: any) => [w.id, w]))

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

  const totalUsageThisMonth = monthlyUsage.reduce((sum: number, entry: any) => sum + Math.abs(entry.delta), 0)

  return (
    <BillingClient initialCredits={user.credits}>
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
                  {monthlyUsage.filter((entry: any) => entry.reason === 'download').length}
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
                    {creditHistory.map((entry: any, index: number) => {
                      const runningBalance = creditHistory
                        .slice(index)
                        .reduce((sum: number, e: any) => sum + e.delta, user.credits)
                        
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
            
            <CreditPackPurchase />
          </div>

          {/* Subscription Management */}
          <SubscriptionManagement user={user} />

        </div>
      </div>
      </div>
    </BillingClient>
  )
}
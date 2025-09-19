import { getCurrentUser } from '@/lib/session'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { RecentWorkflows } from '@/components/workflow/recent-workflows'

interface DashboardProps {
  searchParams: Promise<{ resume?: string }>
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const user = await getCurrentUser()
  const resolvedSearchParams = await searchParams
  
  console.log('Dashboard user data:', user)

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-5 md:px-[60px] lg:px-[100px]">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Authentication Required</h3>
            <p className="text-yellow-700">Please sign in to access your dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  const dashboardUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    referralCode: user.referralCode,
    referrals: user.referrals || []
  }

  return (
    <div className="space-y-8">
      <DashboardClient 
        initialUser={dashboardUser} 
        resumeWorkflowId={resolvedSearchParams.resume}
      />
      <RecentWorkflows userId={user.id} />
    </div>
  )
}
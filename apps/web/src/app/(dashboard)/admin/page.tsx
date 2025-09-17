import { getCurrentUser } from '@/lib/session'
import { notFound } from 'next/navigation'
import { AdminPlanGranter } from '@/components/admin/admin-plan-granter'
import { AdminUserList } from '@/components/admin/admin-user-list'

// Helper function to check if user is admin
function isAdmin(user: any): boolean {
  const adminEmails = [
    'support@simplestager.com',
    // Add your admin emails here
  ]
  
  return adminEmails.includes(user.email)
}

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user || !isAdmin(user)) {
    return notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage users, grant plans, and oversee the SimpleStager platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Granter */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Grant Free Plans</h2>
          <p className="text-sm text-gray-600 mb-6">
            Grant free subscription plans to specific users. Great for influencers, partners, or promotional campaigns.
          </p>
          <AdminPlanGranter />
        </div>

        {/* User Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <p className="text-sm text-gray-600 mb-6">
            View and manage user accounts, credits, and subscriptions.
          </p>
          <AdminUserList />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Active Subscriptions</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Credits Used Today</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Revenue This Month</div>
          </div>
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Dashboard Test Links
          </h1>
          <p className="text-gray-600">
            Test all the new dashboard features (requires authentication)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Staging Tool */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              🎨 AI Staging Tool
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Test the core staging functionality (no auth required)
            </p>
            <Link
              href="/test"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Test Staging Tool →
            </Link>
          </div>

          {/* Dashboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              🏠 Dashboard
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Main dashboard with workflow creator and recent workflows
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              View Dashboard →
            </Link>
          </div>

          {/* History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              📋 Workflow History
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View all workflows with filtering and pagination
            </p>
            <Link
              href="/history"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              View History →
            </Link>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              💳 Billing & Credits
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage subscription, credits, and view usage analytics
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              View Billing →
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            🔐 Authentication Required
          </h4>
          <p className="text-sm text-blue-700">
            The dashboard pages (History, Billing) require Google OAuth authentication. 
            The staging tool at <code>/test</code> works without authentication.
          </p>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">
            ✨ New Features Implemented
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Complete workflow history with filtering</li>
            <li>• Billing dashboard with credit management</li>
            <li>• Workflow actions (edit, duplicate, delete, share)</li>
            <li>• Bulk download all results as ZIP</li>
            <li>• Usage analytics and referral tracking</li>
            <li>• Plan management and credit purchase options</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
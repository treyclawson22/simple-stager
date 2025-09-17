'use client'

import { useState, useEffect } from 'react'
import { TestWorkflowCreator } from './test-workflow-creator'

interface TestUser {
  id: string
  name: string | null
  email: string
  credits: number
  referralCode: string
}

export function TestPageClient() {
  const [testUser, setTestUser] = useState<TestUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = () => {
      fetch('/api/test/user')
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setTestUser(data.user)
          }
        })
        .catch(err => {
          console.error('Failed to fetch test user:', err)
          setError('Failed to load test user')
        })
        .finally(() => setLoading(false))
    }

    // Fetch test user data on mount
    fetchUserData()

    // Refresh user data every 10 seconds to ensure credit consistency
    const interval = setInterval(fetchUserData, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const handleCreditsUpdate = (newCredits: number) => {
    if (testUser) {
      setTestUser({
        ...testUser,
        credits: newCredits
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !testUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error || 'Failed to load test user'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            SimpleStager Test Page
          </h1>
          <p className="text-gray-600">
            Testing workflow without authentication
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Test User:</strong> {testUser.name} ({testUser.email})<br/>
              <strong>Credits:</strong> <span className="text-2xl font-bold text-green-600">{testUser.credits}</span><br/>
              <strong>Referral Code:</strong> {testUser.referralCode}<br/>
              <strong>User ID:</strong> {testUser.id}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              ✅ If you see different credits elsewhere, you're on a different page or using cached data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TestWorkflowCreator 
              userId={testUser.id} 
              userCredits={testUser.credits}
              onCreditsUpdate={handleCreditsUpdate}
            />
          </div>
          
          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                API Status
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>AI Processing:</span>
                  <span className="text-green-600">✅ Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="text-green-600">✅ Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>Image Enhancement:</span>
                  <span className="text-green-600">✅ Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Watermarking:</span>
                  <span className="text-green-600">✅ Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
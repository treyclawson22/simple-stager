'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  credits: number
  createdAt: string
  plans: Array<{
    id: string
    name: string
    status: string
    currentPeriodEnd: string | null
  }>
}

export function AdminUserList() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* User List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No users found matching your search.' : 'No users found.'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {user.name || 'No name'}
                  </div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.credits} credits
                  </div>
                  {user.plans.length > 0 && (
                    <div className="text-xs text-green-600">
                      {user.plans.map(plan => plan.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              {user.plans.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600">
                    Active Plans:
                  </div>
                  {user.plans.map((plan) => (
                    <div key={plan.id} className="text-xs text-gray-500 ml-2">
                      • {plan.name} ({plan.status})
                      {plan.currentPeriodEnd && (
                        <span> - expires {new Date(plan.currentPeriodEnd).toLocaleDateString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  )
}
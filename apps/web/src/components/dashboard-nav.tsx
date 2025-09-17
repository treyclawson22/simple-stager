'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
interface DashboardNavProps {
  user?: any
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  return (
    <nav style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <img src="/logo.png" alt="SimpleStager" className="h-12 w-auto" />
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                style={{ 
                  borderColor: pathname === '/dashboard' ? '#089AB2' : 'transparent',
                  color: pathname === '/dashboard' ? '#464646' : '#6B7280'
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-gray-300 hover:text-gray-700"
                style={{ 
                  borderColor: pathname === '/history' ? '#089AB2' : 'transparent',
                  color: pathname === '/history' ? '#464646' : '#6B7280'
                }}
              >
                History
              </Link>
              <Link
                href="/billing"
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-gray-300 hover:text-gray-700"
                style={{ 
                  borderColor: pathname === '/billing' ? '#089AB2' : 'transparent',
                  color: pathname === '/billing' ? '#464646' : '#6B7280'
                }}
              >
                Billing
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-gray-300 hover:text-gray-700"
                style={{ 
                  borderColor: pathname === '/settings' ? '#089AB2' : 'transparent',
                  color: pathname === '/settings' ? '#464646' : '#6B7280'
                }}
              >
                Settings
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm" style={{ color: '#464646' }}>
              Welcome {user?.name?.split(' ')[0] || 'User'}
            </div>
            <div className="text-sm" style={{ color: '#464646' }}>
              <span className="font-medium">{user?.credits || 0}</span> credits
            </div>
            
            <div className="relative flex items-center">
              <button
                onClick={() => signOut()}
                className="text-sm font-medium hover:text-gray-700"
                style={{ color: '#6B7280' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
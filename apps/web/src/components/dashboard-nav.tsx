'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Plan } from '@simple-stager/database'
import { SupportModal } from '@/components/support/support-modal'

interface DashboardNavProps {
  user?: (User & { plans?: Plan[] }) | null
}

// Helper function to check if user is admin
function isAdmin(user: User): boolean {
  const adminEmails = [
    'support@simplestager.com',
    // Add your admin emails here
  ]
  
  return adminEmails.includes(user.email)
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <nav style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <img src="/logo.png" alt="SimpleStager" className="h-[41px] w-auto" />
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
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
              
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-gray-300 hover:text-gray-700 cursor-pointer"
                style={{ 
                  borderColor: 'transparent',
                  color: '#6B7280'
                }}
              >
                Support
              </button>
              
              {user && isAdmin(user) && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:border-gray-300 hover:text-gray-700"
                  style={{ 
                    borderColor: pathname === '/admin' ? '#089AB2' : 'transparent',
                    color: pathname === '/admin' ? '#464646' : '#6B7280'
                  }}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          {/* Desktop user info */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="text-sm" style={{ color: '#464646' }}>
              Welcome {user?.name?.split(' ')[0] || 'User'}
            </div>
            <div className="text-sm" style={{ color: '#464646' }}>
              <span className="font-medium">{user?.credits || 0}</span> credits
            </div>
            
            <div className="relative flex items-center">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium hover:text-gray-700 cursor-pointer"
                style={{ color: '#6B7280' }}
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                style={{
                  borderColor: pathname === '/dashboard' ? '#089AB2' : 'transparent',
                  color: pathname === '/dashboard' ? '#464646' : '#6B7280',
                  backgroundColor: pathname === '/dashboard' ? '#F0F9FF' : 'transparent'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                style={{
                  borderColor: pathname === '/history' ? '#089AB2' : 'transparent',
                  color: pathname === '/history' ? '#464646' : '#6B7280',
                  backgroundColor: pathname === '/history' ? '#F0F9FF' : 'transparent'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </Link>
              <Link
                href="/billing"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                style={{
                  borderColor: pathname === '/billing' ? '#089AB2' : 'transparent',
                  color: pathname === '/billing' ? '#464646' : '#6B7280',
                  backgroundColor: pathname === '/billing' ? '#F0F9FF' : 'transparent'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Billing
              </Link>
              <Link
                href="/settings"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                style={{
                  borderColor: pathname === '/settings' ? '#089AB2' : 'transparent',
                  color: pathname === '/settings' ? '#464646' : '#6B7280',
                  backgroundColor: pathname === '/settings' ? '#F0F9FF' : 'transparent'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              
              <button
                onClick={() => {
                  setIsSupportModalOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer"
                style={{
                  borderColor: 'transparent',
                  color: '#6B7280'
                }}
              >
                Support
              </button>
              
              {user && isAdmin(user) && (
                <Link
                  href="/admin"
                  className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  style={{
                    borderColor: pathname === '/admin' ? '#089AB2' : 'transparent',
                    color: pathname === '/admin' ? '#464646' : '#6B7280',
                    backgroundColor: pathname === '/admin' ? '#F0F9FF' : 'transparent'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
            
            {/* Mobile user info section */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#089AB2' }}>
                    {user?.credits || 0} credits
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' })
                    setIsMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <SupportModal 
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        user={user || null}
      />
    </nav>
  )
}
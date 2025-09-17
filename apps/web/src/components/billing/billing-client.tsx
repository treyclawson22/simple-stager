'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface BillingClientProps {
  children: React.ReactNode
  initialCredits: number
}

export function BillingClient({ children, initialCredits }: BillingClientProps) {
  const [credits, setCredits] = useState(initialCredits)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      // Purchase successful - refresh user data
      refreshUserData()
      
      // Show success message
      const timer = setTimeout(() => {
        alert('✅ Purchase successful! Your credits have been updated.')
      }, 500)
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('canceled')
      router.replace(url.pathname + (url.search ? url.search : ''), { scroll: false })
      
      return () => clearTimeout(timer)
    }
    
    if (canceled === 'true') {
      // Purchase canceled - just clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('canceled')
      router.replace(url.pathname + (url.search ? url.search : ''), { scroll: false })
    }
  }, [searchParams, router])

  const refreshUserData = async () => {
    try {
      // Get fresh user data including updated credits
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      
      if (sessionData?.user?.id) {
        const userResponse = await fetch(`/api/users/${sessionData.user.id}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setCredits(userData.credits)
          
          // Force a page refresh to update all credit displays
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  return <>{children}</>
}
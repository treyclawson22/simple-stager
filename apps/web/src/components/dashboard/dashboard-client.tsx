'use client'

import { useState, useEffect } from 'react'
import { TestWorkflowCreator } from '@/components/test/test-workflow-creator'
import { ReferralProgram } from '@/components/dashboard/referral-program'

interface DashboardUser {
  id: string
  name: string | null
  email: string
  credits: number
  referralCode: string
  referrals?: any[]
}

interface DashboardClientProps {
  initialUser: DashboardUser
  resumeWorkflowId?: string
}

export function DashboardClient({ initialUser, resumeWorkflowId }: DashboardClientProps) {
  const [user, setUser] = useState<DashboardUser>(initialUser)
  const [loading, setLoading] = useState(false)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      
      if (sessionData?.user?.id) {
        // Fetch updated user data including credits
        const userResponse = await fetch(`/api/users/${sessionData.user.id}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(prev => ({
            ...prev,
            credits: userData.credits
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch updated user data:', error)
    }
  }

  const handleCreditsUpdate = (newCredits: number) => {
    setUser(prev => ({
      ...prev,
      credits: newCredits
    }))
    
    // Also fetch fresh data from server to ensure consistency
    setTimeout(fetchUserData, 1000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <TestWorkflowCreator 
          userId={user.id} 
          userCredits={user.credits}
          onCreditsUpdate={handleCreditsUpdate}
          resumeWorkflowId={resumeWorkflowId}
        />
      </div>
      
      <div>
        <ReferralProgram 
          referralCode={user.referralCode} 
          referrals={user.referrals || []} 
        />
      </div>
    </div>
  )
}
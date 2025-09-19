'use client'

import { useState } from 'react'
import { User, Plan } from '@simple-stager/database'

interface SubscriptionManagementProps {
  user: (User & { plans: Plan[] }) | null
}

export function SubscriptionManagement({ user }: SubscriptionManagementProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const activePlan = user?.plans?.find(plan => plan.status === 'active')

  if (!activePlan || !activePlan.stripeSubscriptionId) {
    return null // Don't show if no active subscription
  }


  const handleManageSubscription = async () => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.href
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer portal session')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (error) {
      console.error('Failed to open subscription management:', error)
      alert('Failed to open subscription management. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Management</h3>
      
      <div className="space-y-4">
        {/* Current Plan Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900 capitalize">{activePlan.name} Plan</h4>
              <p className="text-sm text-gray-600">
                Status: <span className="capitalize font-medium">{activePlan.status}</span>
              </p>
              {activePlan.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  Next billing: {new Date(activePlan.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleManageSubscription}
            disabled={isProcessing}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Opening...' : '⚙️ Manage Subscription'}
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>• Manage subscription opens Stripe's secure portal</p>
          <p>• Update payment methods, view billing history, and cancel subscription</p>
          <p>• Cancellations take effect at the end of your billing period</p>
          <p>• You will keep all remaining credits after cancellation</p>
        </div>
      </div>
    </div>
  )
}
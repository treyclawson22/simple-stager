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

  const handleUpdatePaymentMethod = async () => {
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
      console.error('Failed to open payment management:', error)
      alert('Failed to open payment management. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    const confirmed = confirm(
      `Cancel Subscription\n\n` +
      `Are you sure you want to cancel your ${activePlan.name} subscription?\n\n` +
      `• Your subscription will remain active until ${new Date(activePlan.currentPeriodEnd || '').toLocaleDateString()}\n` +
      `• You will keep your remaining credits\n` +
      `• You can resubscribe anytime\n\n` +
      `This action cannot be undone. Continue?`
    )

    if (!confirmed) return

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: activePlan.stripeSubscriptionId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      alert('✅ Subscription canceled successfully.\n\nYour plan will remain active until your next billing date, and you will keep all remaining credits.')
      
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUpdatePaymentMethod}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Opening...' : '💳 Update Payment Method'}
          </button>

          <button
            onClick={handleCancelSubscription}
            disabled={isProcessing}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : '❌ Cancel Subscription'}
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>• Update payment method opens Stripe's secure portal</p>
          <p>• Cancellation takes effect at the end of your billing period</p>
          <p>• You will keep all remaining credits after cancellation</p>
        </div>
      </div>
    </div>
  )
}
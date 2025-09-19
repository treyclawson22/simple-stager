'use client'

import { useState } from 'react'
import { User, Plan } from '@simple-stager/database'

interface InteractivePlansProps {
  user: (User & { plans: Plan[] }) | null
}

interface PlanOption {
  name: string
  price: number
  credits: number
  description: string
  pricePerCredit: string
  badge?: string
  badgeColor?: string
}

const plans: PlanOption[] = [
  {
    name: 'Free Credits',
    price: 0,
    credits: 3,
    description: 'New users get 3 free credits to try virtual staging',
    pricePerCredit: 'No monthly billing'
  },
  {
    name: 'entry',
    price: 24,
    credits: 15,
    description: 'For new agents testing virtual staging',
    pricePerCredit: '$1.60/credit'
  },
  {
    name: 'showcase',
    price: 32,
    credits: 25,
    description: 'Great for agents listing multiple homes',
    pricePerCredit: '$1.28/credit'
  },
  {
    name: 'prime',
    price: 49,
    credits: 50,
    description: 'Best balance of value and volume',
    pricePerCredit: '$0.98/credit',
    badge: 'Most Popular',
    badgeColor: 'yellow'
  },
  {
    name: 'prestige',
    price: 89,
    credits: 100,
    description: 'For busy agents and boutique broker teams',
    pricePerCredit: '$0.89/credit'
  },
  {
    name: 'portfolio',
    price: 149,
    credits: 300,
    description: 'Scales for high-volume brokerages and teams',
    pricePerCredit: '$0.50/credit',
    badge: 'Best Value',
    badgeColor: 'green'
  }
]

export function InteractivePlans({ user }: InteractivePlansProps) {
  // Find the user's current plan - prioritize pending_downgrade, then active, then fallback to Free Credits
  const userPlans = user?.plans || []
  
  // Look for pending downgrade first (this takes priority for display purposes)
  const pendingDowngradePlan = userPlans.find((plan: any) => plan.status === 'pending_downgrade')
  
  // Look for active plan
  const activePlan = userPlans.find((plan: any) => plan.status === 'active')
  
  // Use pending downgrade plan if it exists, otherwise use active plan
  const displayPlan = pendingDowngradePlan || activePlan
  
  // For pending downgrades, we show the CURRENT plan name (what they're currently on)
  const currentPlanName = displayPlan?.name || 'Free Credits'
  const isFreePlan = displayPlan && !displayPlan.stripeSubscriptionId
  const isPendingDowngrade = displayPlan?.status === 'pending_downgrade'
  const pendingPlanName = displayPlan?.pendingPlan
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  // Check if user is eligible for referral discount
  // This would be set during signup and stored in user profile
  const isEligibleForReferralDiscount = (user as any)?.referralDiscount && !(user as any)?.hasUsedReferralDiscount && !activePlan

  const handlePlanSelect = (planName: string) => {
    if (planName === currentPlanName) {
      setSelectedPlan(null)
      return
    }
    setSelectedPlan(planName)
  }

  const handleConfirmChange = async () => {
    if (!selectedPlan) return
    
    // Get plan pricing info for confirmation
    const selectedPlanData = plans.find(p => p.name === selectedPlan)
    const currentPlan = user?.plans?.[0]
    
    if (currentPlan && selectedPlanData) {
      const currentPlanData = plans.find(p => p.name === currentPlan.name)
      if (currentPlanData) {
        const priceDifference = selectedPlanData.price - currentPlanData.price
        
        if (priceDifference > 0) {
          // Confirm upgrade charge
          const confirmed = confirm(
            `Upgrade Confirmation\n\n` +
            `You are upgrading from ${currentPlanData.name} ($${currentPlanData.price}/month) to ${selectedPlanData.name} ($${selectedPlanData.price}/month).\n\n` +
            `• You will be charged $${priceDifference} today (price difference)\n` +
            `• Your next billing cycle will be $${selectedPlanData.price}/month\n` +
            `• Your billing date remains unchanged\n\n` +
            `Continue with upgrade?`
          )
          
          if (!confirmed) {
            return
          }
        } else if (priceDifference < 0) {
          // Confirm downgrade
          const confirmed = confirm(
            `Downgrade Confirmation\n\n` +
            `You are downgrading from ${currentPlanData.name} ($${currentPlanData.price}/month) to ${selectedPlanData.name} ($${selectedPlanData.price}/month).\n\n` +
            `• No charge today\n` +
            `• Your next billing cycle will be $${selectedPlanData.price}/month\n` +
            `• You will keep your existing credits\n\n` +
            `Continue with downgrade?`
          )
          
          if (!confirmed) {
            return
          }
        }
      }
    }
    
    setIsConfirming(true)
    console.log('🔧 DEBUG: Starting checkout process for plan:', selectedPlan)
    
    try {
      // Map plan names to IDs for Stripe
      const planIdMap: Record<string, string> = {
        'entry': 'entry',
        'showcase': 'showcase', 
        'prime': 'prime',
        'prestige': 'prestige',
        'portfolio': 'portfolio'
      }
      
      const planId = planIdMap[selectedPlan]
      if (!planId) {
        throw new Error('Invalid plan selection')
      }

      // Create Stripe checkout session or update existing subscription
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          type: 'subscription'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.upgraded) {
        // Subscription was upgraded/downgraded without checkout
        alert(`✅ ${data.message}\n\n${data.nextInvoice}`)
        // Refresh the page to show updated plan
        window.location.reload()
      } else {
        // Redirect to Stripe checkout for new subscriptions
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to start checkout:', error)
      alert('Failed to start checkout. Please try again.')
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    setSelectedPlan(null)
  }

  const handleCancelDowngrade = async () => {
    setIsConfirming(true)
    console.log('🔧 DEBUG: Canceling downgrade')
    
    try {
      // Map current plan name back to subscription price
      const planIdMap: Record<string, string> = {
        'entry': 'entry',
        'showcase': 'showcase', 
        'prime': 'prime',
        'prestige': 'prestige',
        'portfolio': 'portfolio'
      }
      
      const currentPlanId = planIdMap[currentPlanName]
      if (!currentPlanId) {
        throw new Error('Invalid current plan')
      }

      // Call API to revert back to current plan and cancel downgrade
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: currentPlanId,
          type: 'subscription',
          cancelDowngrade: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel downgrade')
      }

      if (data.canceled) {
        alert(`✅ ${data.message}`)
        // Refresh the page to show updated plan
        window.location.reload()
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (error) {
      console.error('Failed to cancel downgrade:', error)
      alert('Failed to cancel downgrade. Please try again.')
      setIsConfirming(false)
    }
  }

  const getCardClasses = (plan: PlanOption) => {
    const isCurrentPlan = plan.name === currentPlanName
    const isSelected = plan.name === selectedPlan
    
    if (isCurrentPlan) {
      return 'border-2 border-teal-500 bg-teal-50'
    }
    
    if (isSelected) {
      return 'border-2 border-blue-500 bg-blue-50'
    }
    
    if (plan.badge === 'Most Popular') {
      return 'border-2 border-yellow-200 bg-yellow-50 hover:border-yellow-300'
    }
    
    if (plan.badge === 'Best Value') {
      return 'border-2 border-green-200 bg-green-50 hover:border-green-300'
    }
    
    return 'border-2 border-gray-200 hover:border-gray-300'
  }

  const getBadgeClasses = (badgeColor?: string) => {
    switch (badgeColor) {
      case 'yellow':
        return 'text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium'
      case 'green':
        return 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium'
      default:
        return 'text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium'
    }
  }

  const selectedPlanObj = plans.find((p: any) => p.name === selectedPlan)
  const currentPlanObj = plans.find((p: any) => p.name === currentPlanName)
  const isUpgrade = selectedPlanObj && currentPlanObj && selectedPlanObj.price > currentPlanObj.price
  const isDowngrade = selectedPlanObj && currentPlanObj && selectedPlanObj.price < currentPlanObj.price

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium" style={{ color: '#464646' }}>Subscription Plans</h3>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Choose the plan that best fits your needs. You have {user?.credits || 0} credits remaining.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: '#089AB2' }}>
            {user?.credits || 0}
          </div>
          <div className="text-sm" style={{ color: '#6B7280' }}>Credits remaining</div>
        </div>
      </div>
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan: any) => (
          <div
            key={plan.name}
            className={`${getCardClasses(plan)} p-4 cursor-pointer transition-all`}
            onClick={() => handlePlanSelect(plan.name)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">
                {plan.name === 'Free Credits' ? plan.name : plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} {plan.name === 'prime' && '⭐'} {plan.name === 'portfolio' && '🏆'}
              </h4>
              <div className="flex flex-col items-end">
                {plan.name === currentPlanName && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium mb-1 ${
                    isFreePlan 
                      ? 'bg-purple-100 text-purple-800' 
                      : isPendingDowngrade
                      ? 'bg-green-100 text-green-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {isFreePlan ? 'Free Plan' : isPendingDowngrade ? 'Current (until next cycle)' : 'Current'}
                  </span>
                )}
                {plan.name === pendingPlanName && isPendingDowngrade && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium mb-1">
                    Upcoming Plan
                  </span>
                )}
                {plan.name === selectedPlan && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium mb-1">Selected</span>
                )}
                {plan.badge && (
                  <span className={getBadgeClasses(plan.badgeColor)}>{plan.badge}</span>
                )}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {isEligibleForReferralDiscount && plan.price > 0 ? (
                <>
                  <span className="text-lg line-through text-gray-400 mr-2">${plan.price}</span>
                  <span className="text-green-600">${Math.round(plan.price * 0.75)}</span>
                  <span className="text-sm font-normal">/month</span>
                  <div className="text-xs text-green-600 font-medium">25% off first month!</div>
                </>
              ) : (
                <>
                  ${plan.price}{plan.price > 0 && <span className="text-sm font-normal">/month</span>}
                </>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mb-3">{plan.description}</div>
            
            <div className="text-sm text-gray-600">
              {plan.credits} credits{plan.price > 0 ? '/month' : ''} • {plan.pricePerCredit}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons - Show for new plan selection OR pending downgrade */}
      {(selectedPlan || isPendingDowngrade) && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isPendingDowngrade && !selectedPlan ? (
              <>You have a scheduled downgrade to {pendingPlanName} on your next billing cycle.</>
            ) : isUpgrade ? (
              <>Upgrades take effect immediately upon confirmation.{isEligibleForReferralDiscount && " Your 25% referral discount will be applied!"}</>
            ) : isDowngrade ? (
              <>Downgrades take effect on your next billing cycle.</>
            ) : (
              <>Ready to make changes to your plan.{isEligibleForReferralDiscount && " Your 25% referral discount will be applied!"}</>
            )}
          </div>
          
          <div className="flex space-x-3">
            {isPendingDowngrade && !selectedPlan ? (
              <button 
                onClick={handleCancelDowngrade}
                disabled={isConfirming}
                className="px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? 'Processing...' : 'Cancel Downgrade'}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleCancel}
                  disabled={isConfirming}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmChange}
                  disabled={isConfirming}
                  className="px-4 py-2 text-white text-sm font-medium rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{ backgroundColor: '#089AB2' }}
                >
                  {isConfirming ? 'Processing...' : isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Confirm Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
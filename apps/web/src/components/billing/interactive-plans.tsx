'use client'

import { useState } from 'react'
import { User, Plan } from '@simple-stager/database'

interface InteractivePlansProps {
  user: (User & { plan: Plan | null }) | null
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
    name: 'Entry',
    price: 24,
    credits: 15,
    description: 'For new agents testing virtual staging',
    pricePerCredit: '$1.60/credit'
  },
  {
    name: 'Showcase',
    price: 32,
    credits: 25,
    description: 'Great for agents listing multiple homes',
    pricePerCredit: '$1.28/credit'
  },
  {
    name: 'Prime',
    price: 49,
    credits: 50,
    description: 'Best balance of value and volume',
    pricePerCredit: '$0.98/credit',
    badge: 'Most Popular',
    badgeColor: 'yellow'
  },
  {
    name: 'Prestige',
    price: 89,
    credits: 100,
    description: 'For busy agents and boutique broker teams',
    pricePerCredit: '$0.89/credit'
  },
  {
    name: 'Portfolio',
    price: 149,
    credits: 300,
    description: 'Scales for high-volume brokerages and teams',
    pricePerCredit: '$0.50/credit',
    badge: 'Best Value',
    badgeColor: 'green'
  }
]

export function InteractivePlans({ user }: InteractivePlansProps) {
  const currentPlanName = user?.plan?.name || 'Free Credits'
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  // Check if user is eligible for referral discount
  // This would be set during signup and stored in user profile
  const isEligibleForReferralDiscount = (user as any)?.referralDiscount && !(user as any)?.hasUsedReferralDiscount && !user?.plan

  const handlePlanSelect = (planName: string) => {
    if (planName === currentPlanName) {
      setSelectedPlan(null)
      return
    }
    setSelectedPlan(planName)
  }

  const handleConfirmChange = async () => {
    if (!selectedPlan) return
    
    setIsConfirming(true)
    
    // TODO: Implement actual plan change API call
    try {
      console.log(`Changing plan from ${currentPlanName} to ${selectedPlan}`)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset state after successful change
      setSelectedPlan(null)
      
      // TODO: Show success message and refresh data
      alert(`Plan changed to ${selectedPlan} successfully!`)
    } catch (error) {
      console.error('Failed to change plan:', error)
      alert('Failed to change plan. Please try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    setSelectedPlan(null)
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
                {plan.name} {plan.name === 'Prime' && '⭐'} {plan.name === 'Portfolio' && '🏆'}
              </h4>
              <div className="flex flex-col items-end">
                {plan.name === currentPlanName && (
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-medium mb-1">Current</span>
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

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedPlan ? (
            isUpgrade ? (
              <>Upgrades take effect immediately upon confirmation.{isEligibleForReferralDiscount && " Your 25% referral discount will be applied!"}</>
            ) : isDowngrade ? (
              <>Downgrades take effect on your next billing cycle.</>
            ) : (
              <>Ready to make changes to your plan.{isEligibleForReferralDiscount && " Your 25% referral discount will be applied!"}</>
            )
          ) : (
            <>Select a different plan above to upgrade or downgrade.{isEligibleForReferralDiscount && " You have a 25% referral discount available!"}</>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleCancel}
            disabled={!selectedPlan || isConfirming}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmChange}
            disabled={!selectedPlan || isConfirming}
            className="px-4 py-2 text-white text-sm font-medium rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ backgroundColor: '#089AB2' }}
          >
            {isConfirming ? 'Processing...' : 'Confirm Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
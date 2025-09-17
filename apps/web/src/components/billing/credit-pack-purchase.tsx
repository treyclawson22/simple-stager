'use client'

import { useState } from 'react'

const creditPacks = [
  {
    id: 'pack_5',
    credits: 5,
    price: 15,
    pricePerCredit: '$3.00 per credit',
    description: 'Occasional use'
  },
  {
    id: 'pack_10', 
    credits: 10,
    price: 27,
    pricePerCredit: '$2.70 per credit',
    description: 'Good for single listings'
  },
  {
    id: 'pack_20',
    credits: 20,
    price: 45,
    pricePerCredit: '$2.25 per credit',
    description: 'Flexible for mid-sized projects'
  },
  {
    id: 'pack_50',
    credits: 50,
    price: 105,
    pricePerCredit: '$2.10 per credit',
    description: 'Bulk option without subscription'
  }
]

export function CreditPackPurchase() {
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async (packId: string) => {
    setIsLoading(true)
    setSelectedPack(packId)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: packId,
          type: 'credit_pack'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Failed to start checkout:', error)
      alert('Failed to start checkout. Please try again.')
      setIsLoading(false)
      setSelectedPack(null)
    }
  }

  return (
    <div className="space-y-3">
      {creditPacks.map((pack) => (
        <div 
          key={pack.id}
          className={`border rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors ${
            selectedPack === pack.id && isLoading ? 'bg-gray-50 border-gray-400' : ''
          }`}
          onClick={() => !isLoading && handlePurchase(pack.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">
                {pack.credits} Credits
                {selectedPack === pack.id && isLoading && (
                  <span className="ml-2 text-sm text-gray-500">Processing...</span>
                )}
              </div>
              <div className="text-sm text-gray-600">{pack.pricePerCredit}</div>
              <div className="text-xs text-gray-500">{pack.description}</div>
            </div>
            <div className="text-lg font-bold text-gray-900">${pack.price}</div>
          </div>
        </div>
      ))}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Credits never expire and can be used for any staging service
      </div>
    </div>
  )
}
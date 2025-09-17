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

  const handlePackSelect = (packId: string) => {
    if (isLoading) return
    setSelectedPack(selectedPack === packId ? null : packId)
  }

  const handlePurchase = async () => {
    if (!selectedPack) return
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPack,
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
    }
  }

  const selectedPackObj = creditPacks.find(pack => pack.id === selectedPack)

  return (
    <div className="space-y-3">
      {creditPacks.map((pack) => (
        <div 
          key={pack.id}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedPack === pack.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handlePackSelect(pack.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900 flex items-center">
                {pack.credits} Credits
                {selectedPack === pack.id && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Selected</span>
                )}
              </div>
              <div className="text-sm text-gray-600">{pack.pricePerCredit}</div>
              <div className="text-xs text-gray-500">{pack.description}</div>
            </div>
            <div className="text-lg font-bold text-gray-900">${pack.price}</div>
          </div>
        </div>
      ))}
      
      {/* Checkout Button */}
      {selectedPack && (
        <div className="mt-6 p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="font-medium text-gray-900">Selected: {selectedPackObj?.credits} Credits</div>
              <div className="text-sm text-gray-600">Total: ${selectedPackObj?.price}</div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={isLoading}
              className="px-6 py-2 text-white font-medium rounded-md hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#089AB2' }}
            >
              {isLoading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Credits never expire and can be used for any staging service
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'

const plans = [
  { id: 'entry', name: 'Entry', credits: 15, price: '$24' },
  { id: 'showcase', name: 'Showcase', credits: 25, price: '$32' },
  { id: 'prime', name: 'Prime', credits: 50, price: '$49' },
  { id: 'prestige', name: 'Prestige', credits: 100, price: '$89' },
  { id: 'portfolio', name: 'Portfolio', credits: 300, price: '$149' }
]

const durations = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '1 Year' },
  { months: 24, label: '2 Years' }
]

export function AdminPlanGranter() {
  const [formData, setFormData] = useState({
    userEmail: '',
    planName: 'showcase',
    durationMonths: 12
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/grant-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant plan')
      }

      setMessage({
        type: 'success',
        text: data.message
      })
      
      // Reset form
      setFormData({
        userEmail: '',
        planName: 'showcase',
        durationMonths: 12
      })

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to grant plan'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === formData.planName)

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Email */}
        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
            User Email
          </label>
          <input
            type="email"
            id="userEmail"
            required
            value={formData.userEmail}
            onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="user@example.com"
          />
        </div>

        {/* Plan Selection */}
        <div>
          <label htmlFor="planName" className="block text-sm font-medium text-gray-700">
            Plan to Grant
          </label>
          <select
            id="planName"
            value={formData.planName}
            onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {plan.credits} credits ({plan.price}/month value)
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration
          </label>
          <select
            id="duration"
            value={formData.durationMonths}
            onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {durations.map((duration) => (
              <option key={duration.months} value={duration.months}>
                {duration.label}
              </option>
            ))}
          </select>
        </div>

        {/* Summary */}
        {selectedPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <strong>Grant Summary:</strong>
              <br />
              Plan: {selectedPlan.name} ({selectedPlan.credits} credits)
              <br />
              Duration: {durations.find(d => d.months === formData.durationMonths)?.label}
              <br />
              Value: {selectedPlan.price} × {formData.durationMonths} months = ${parseInt(selectedPlan.price.replace('$', '')) * formData.durationMonths}
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Granting Plan...
            </div>
          ) : (
            'Grant Free Plan'
          )}
        </button>
      </form>
    </div>
  )
}
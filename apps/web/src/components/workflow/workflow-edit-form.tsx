'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Workflow } from '@simple-stager/database'
import { WorkflowGoal } from '@simple-stager/shared'

interface WorkflowEditFormProps {
  workflow: Workflow
}

export function WorkflowEditForm({ workflow }: WorkflowEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    goal: workflow.goal as WorkflowGoal,
    roomType: workflow.roomType || '',
    style: workflow.style || '',
    colorNotes: workflow.colorNotes || '',
    budgetVibe: workflow.budgetVibe || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow')
      }

      router.push(`/workflow/${workflow.id}`)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update workflow. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/workflow/${workflow.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700">Enhancement Goal</label>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {(['stage', 'declutter', 'improve'] as WorkflowGoal[]).map((option: any) => (
            <label key={option} className="relative">
              <input
                type="radio"
                name="goal"
                value={option}
                checked={formData.goal === option}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as WorkflowGoal })}
                className="sr-only"
              />
              <div className={`border-2 rounded-lg p-4 cursor-pointer text-center ${
                formData.goal === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}>
                <div className="text-sm font-medium text-gray-900">
                  {option === 'stage' && 'Stage'}
                  {option === 'declutter' && 'Declutter'}
                  {option === 'improve' && 'Improve'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {option === 'stage' && 'Add furniture'}
                  {option === 'declutter' && 'Remove clutter'}
                  {option === 'improve' && 'Light renovations'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Room Type */}
      <div>
        <label htmlFor="roomType" className="block text-sm font-medium text-gray-700">
          Room Type
        </label>
        <select
          id="roomType"
          value={formData.roomType}
          onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select room type...</option>
          <option value="living-room">Living Room</option>
          <option value="bedroom">Bedroom</option>
          <option value="kitchen">Kitchen</option>
          <option value="dining-room">Dining Room</option>
          <option value="bathroom">Bathroom</option>
          <option value="home-office">Home Office</option>
          <option value="basement">Basement</option>
          <option value="attic">Attic</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Style */}
      <div>
        <label htmlFor="style" className="block text-sm font-medium text-gray-700">
          Design Style
        </label>
        <select
          id="style"
          value={formData.style}
          onChange={(e) => setFormData({ ...formData, style: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select style...</option>
          <option value="modern">Modern</option>
          <option value="traditional">Traditional</option>
          <option value="contemporary">Contemporary</option>
          <option value="farmhouse">Farmhouse</option>
          <option value="scandinavian">Scandinavian</option>
          <option value="industrial">Industrial</option>
          <option value="bohemian">Bohemian</option>
          <option value="minimalist">Minimalist</option>
        </select>
      </div>

      {/* Budget/Vibe */}
      <div>
        <label htmlFor="budgetVibe" className="block text-sm font-medium text-gray-700">
          Budget/Vibe
        </label>
        <select
          id="budgetVibe"
          value={formData.budgetVibe}
          onChange={(e) => setFormData({ ...formData, budgetVibe: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select budget level...</option>
          <option value="budget-friendly">Budget-friendly</option>
          <option value="mid-range">Mid-range</option>
          <option value="luxury">Luxury</option>
          <option value="high-end">High-end</option>
        </select>
      </div>

      {/* Color Notes */}
      <div>
        <label htmlFor="colorNotes" className="block text-sm font-medium text-gray-700">
          Color Preferences & Additional Notes
        </label>
        <textarea
          id="colorNotes"
          rows={4}
          value={formData.colorNotes}
          onChange={(e) => setFormData({ ...formData, colorNotes: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Describe any color preferences, specific requirements, or additional context..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
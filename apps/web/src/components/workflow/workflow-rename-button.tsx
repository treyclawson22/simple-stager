'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit } from 'lucide-react'

interface WorkflowRenameButtonProps {
  workflowId: string
  currentName: string
}

export function WorkflowRenameButton({ workflowId, currentName }: WorkflowRenameButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || newName.trim() === currentName) {
      setIsOpen(false)
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim()
        }),
      })

      if (response.ok) {
        setIsOpen(false)
        router.refresh()
      } else {
        throw new Error('Failed to rename project')
      }
    } catch (error) {
      console.error('Rename error:', error)
      alert('Failed to rename project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        title="Rename project"
      >
        <Edit className="h-4 w-4" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Rename Project
            </h3>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
                maxLength={100}
                autoFocus
              />
              
              <div className="flex space-x-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim() || newName.trim() === currentName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
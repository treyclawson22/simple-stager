'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkflowDeleteButtonProps {
  workflowId: string
  workflowName: string
}

export function WorkflowDeleteButton({ workflowId, workflowName }: WorkflowDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent link navigation
    e.stopPropagation()

    if (!confirm(`Are you sure you want to delete "${workflowName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      // Refresh the page to update the workflow list
      router.refresh()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
      title={`Delete ${workflowName}`}
    >
      {isDeleting ? (
        <div className="w-4 h-4 border border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  )
}
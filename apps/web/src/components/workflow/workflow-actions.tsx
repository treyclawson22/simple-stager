'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Copy, Edit, Trash2, Download, Share } from 'lucide-react'
import { Workflow } from '@simple-stager/database'

interface WorkflowActionsProps {
  workflow: Workflow
}

export function WorkflowActions({ workflow }: WorkflowActionsProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDuplicate = async () => {
    setIsLoading(true)
    setShowMenu(false)
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to duplicate workflow')
      }
      
      const newWorkflow = await response.json()
      router.push(`/workflow/${newWorkflow.id}`)
    } catch (error) {
      console.error('Duplicate error:', error)
      alert('Failed to duplicate workflow. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return
    }
    
    setIsLoading(true)
    setShowMenu(false)
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }
      
      router.push('/history')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete workflow. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setShowMenu(false)
    router.push(`/workflow/${workflow.id}/edit`)
  }

  const handleShare = async () => {
    setShowMenu(false)
    
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Workflow link copied to clipboard!')
    } catch (error) {
      console.error('Share error:', error)
      alert('Failed to copy link. Please try again.')
    }
  }

  const handleDownloadAll = async () => {
    setShowMenu(false)
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/download-all`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to download all results')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `simplestager-workflow-${workflow.id}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Download all error:', error)
      alert('Failed to download all results. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              <button
                onClick={handleDuplicate}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Copy className="h-4 w-4 mr-3" />
                Duplicate
              </button>
              
              {workflow.status !== 'processing' && (
                <button
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 mr-3" />
                  Edit Settings
                </button>
              )}
              
              <button
                onClick={handleShare}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Share className="h-4 w-4 mr-3" />
                Share Link
              </button>
              
              {workflow.status === 'completed' && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Download className="h-4 w-4 mr-3" />
                  Download All
                </button>
              )}
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={handleDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Workflow, Result } from '@simple-stager/database'
import { WorkflowResults } from './workflow-results'
import { getWorkflowGoalDisplay } from '@simple-stager/shared'
import { WorkflowRenameButton } from './workflow-rename-button'

interface WorkflowLayoutProps {
  workflow: Workflow & { results: Result[] }
  user: any
}

export function WorkflowLayout({ workflow, user }: WorkflowLayoutProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (resultId: string) => {
    if (user.credits <= 0) {
      alert('You need credits to download. Please upgrade your plan.')
      return
    }

    setIsDownloading(true)
    
    try {
      const response = await fetch(`/api/results/${resultId}/download`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      const fileName = workflow.name 
        ? `${workflow.name} - Virtually Staged.jpg`
        : `Virtually Staged - ${resultId}.jpg`
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Update page
      window.location.reload()
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Name as Page Title */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {workflow.name || getWorkflowGoalDisplay(workflow.goal)}
          </h1>
          <WorkflowRenameButton 
            workflowId={workflow.id}
            currentName={workflow.name || getWorkflowGoalDisplay(workflow.goal)}
          />
          <span className="text-xs text-gray-400">(edit project name)</span>
        </div>
        
        {/* Generated Date and Re-Download Button */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Generated {new Date(workflow.createdAt).toLocaleDateString()}
          </div>
          {workflow.results.length > 0 && workflow.results[0].downloaded && (
            <button 
              onClick={() => handleDownload(workflow.results[0].id)}
              disabled={isDownloading}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {isDownloading ? 'Downloading...' : 'Re-Download'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Original</h3>
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={workflow.sourceImage} 
              alt="Original room"
              className="w-full h-64 object-cover"
            />
          </div>
        </div>
        
        {/* Staged Image */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Staged</h3>
            <button
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              View Large
            </button>
          </div>
          
          <WorkflowResults 
            workflow={workflow}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Download, RefreshCw, Eye, AlertCircle } from 'lucide-react'
import { Workflow, Result, User, Plan } from '@simple-stager/database'

interface WorkflowResultsProps {
  workflow: Workflow & { results: Result[] }
  user: User & { plan: Plan | null }
}

export function WorkflowResults({ workflow, user }: WorkflowResultsProps) {
  const [isPolling, setIsPolling] = useState(workflow.status === 'processing')
  const [results, setResults] = useState(workflow.results)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showLargeImage, setShowLargeImage] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')

  // Poll for updates when workflow is processing
  useEffect(() => {
    if (!isPolling) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/workflows/${workflow.id}/status`)
        const data = await response.json()
        
        if (data.status !== 'processing') {
          setIsPolling(false)
          // Refresh the page to get updated results
          window.location.reload()
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [isPolling, workflow.id])

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
      
      // Update credits count (you might want to refresh user data)
      window.location.reload()
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewLarge = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setShowLargeImage(true)
  }

  if (workflow.status === 'processing') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Generated Results</h3>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Generating your image...</p>
            <p className="text-xs text-gray-500 mt-1">This usually takes 30-60 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  if (workflow.status === 'failed') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Generated Results</h3>
        <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">Generation failed</p>
            <p className="text-xs text-red-500 mt-1">Please try again with a different prompt</p>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Generated Results</h3>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No results yet</p>
            <p className="text-xs text-gray-500 mt-1">Generate an image to see results here</p>
          </div>
        </div>
      </div>
    )
  }

  const isCompleted = results.some((result: any) => result.downloaded)

  return (
    <div className="space-y-4">
      {/* Simplified results - just the image */}
      {results.map((result: any) => (
        <div key={result.id}>
          <div 
            className="border rounded-lg overflow-hidden cursor-pointer relative h-64"
            onClick={() => handleViewLarge(result.watermarkedUrl)}
          >
            <img
              src={result.watermarkedUrl}
              alt="Generated result with watermark"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              style={{ userSelect: 'none' }}
            />
          </div>
        </div>
        ))}
        
      {/* Large Image Lightbox Modal */}
      {showLargeImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLargeImage(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setShowLargeImage(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ✕
            </button>
            <img 
              src={selectedImageUrl}
              alt="Large view of staged result"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ 
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                pointerEvents: 'auto'
              }}
              draggable={false}
            />
            
            {/* Overlay to prevent right-click on the image area */}
            <div 
              className="absolute inset-0 pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
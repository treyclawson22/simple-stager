'use client'

import { useState } from 'react'
import { WorkflowGoal } from '@simple-stager/shared'
import { LoadingSpinnerWithText } from '../ui/loading-spinner'

interface AuthenticatedResultsWithReenhancementProps {
  workflowId: string
  sourceImageUrl: string
  goal: WorkflowGoal
  onReset: () => void
  userCredits?: number
  onCreditsUpdate?: (newCredits: number) => void
  originalPrompt?: string
  projectName?: string
}

export function AuthenticatedResultsWithReenhancement({ 
  workflowId, 
  sourceImageUrl, 
  goal, 
  onReset,
  userCredits = 0,
  onCreditsUpdate,
  originalPrompt = '',
  projectName = ''
}: AuthenticatedResultsWithReenhancementProps) {
  const [showReenhancementForm, setShowReenhancementForm] = useState(false)
  const [reenhancementPrompt, setReenhancementPrompt] = useState('')
  const [isReenhancing, setIsReenhancing] = useState(false)
  const [reenhancedImageUrl, setReenhancedImageUrl] = useState<string>('')
  const [currentImageUrl, setCurrentImageUrl] = useState(`/uploads/${workflowId}/watermarked.jpg`)
  const [latestFullResUrl, setLatestFullResUrl] = useState(`/uploads/${workflowId}/generated.jpg`)
  const [showLargeImage, setShowLargeImage] = useState(false)
  const [editCount, setEditCount] = useState(0)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  
  const MAX_EDITS = 15
  const remainingEdits = MAX_EDITS - editCount
  const editsExhausted = editCount >= MAX_EDITS
  const DOWNLOAD_COST = 1
  const hasInsufficientCredits = userCredits < DOWNLOAD_COST

  const handleReenhancement = async () => {
    if (!reenhancementPrompt.trim()) return
    if (editsExhausted) return

    setIsReenhancing(true)
    
    try {
      // Use authenticated reenhancement endpoint
      const response = await fetch('/api/workflows/reenhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          prompt: reenhancementPrompt.trim(),
          baseImagePath: latestFullResUrl
        }),
      })

      if (!response.ok) {
        throw new Error('Re-enhancement failed')
      }

      const result = await response.json()
      
      // Update the displayed image
      const timestamp = Date.now()
      const newImageUrl = `/uploads/${workflowId}/watermarked.jpg?t=${timestamp}`
      const newFullResUrl = `/uploads/${workflowId}/reenhanced.jpg`
      
      setCurrentImageUrl(newImageUrl)
      setLatestFullResUrl(newFullResUrl)
      setReenhancedImageUrl(newImageUrl)
      setEditCount(prev => prev + 1)
      setShowReenhancementForm(false)
      setReenhancementPrompt('')
      
    } catch (error) {
      console.error('Re-enhancement error:', error)
      alert('Re-enhancement failed. Please try again.')
    } finally {
      setIsReenhancing(false)
    }
  }

  const handleDownload = async () => {
    if (hasInsufficientCredits) {
      alert(`You need ${DOWNLOAD_COST} credit${DOWNLOAD_COST === 1 ? '' : 's'} to download. You currently have ${userCredits} credit${userCredits === 1 ? '' : 's'}.`)
      return
    }

    if (hasDownloaded) {
      // Already downloaded, just download the file
      const link = document.createElement('a')
      link.href = latestFullResUrl
      link.download = `${projectName || 'staged-room'}-enhanced.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    try {
      // Process download and deduct credits using authenticated endpoint
      const response = await fetch('/api/workflows/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process download')
      }

      const result = await response.json()
      
      // Update credits
      if (onCreditsUpdate) {
        onCreditsUpdate(result.creditsRemaining)
      }
      
      setHasDownloaded(true)
      
      // Download the file
      const link = document.createElement('a')
      link.href = latestFullResUrl
      link.download = `${projectName || 'staged-room'}-enhanced.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Download error:', error)
      alert(error instanceof Error ? error.message : 'Failed to download image. Please try again.')
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return

    setIsSubmittingFeedback(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          feedback: feedbackText.trim(),
          originalPrompt,
          type: 'result_feedback'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setShowFeedbackModal(false)
      setFeedbackText('')
      alert('Thank you for your feedback! We appreciate it.')
      
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium" style={{ color: '#464646' }}>Original</h3>
          </div>
          <div className="relative rounded-lg overflow-hidden">
            <img 
              src={sourceImageUrl} 
              alt="Original room"
              className="w-full h-80 object-cover"
            />
          </div>
        </div>

        {/* Enhanced Image */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium" style={{ color: '#464646' }}>
              AI Staged Room {editCount > 0 && `(${editCount} edit${editCount === 1 ? '' : 's'})`}
            </h3>
            <button
              onClick={() => setShowLargeImage(true)}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              style={{ color: '#6B7280' }}
            >
              View Large
            </button>
          </div>
          <div className="relative rounded-lg overflow-hidden">
            {isReenhancing && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <LoadingSpinnerWithText 
                  text="Re-enhancing..." 
                  size="md"
                />
              </div>
            )}
            <img 
              src={currentImageUrl} 
              alt="AI staged room"
              className="w-full h-80 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!editsExhausted && (
          <button
            onClick={() => setShowReenhancementForm(!showReenhancementForm)}
            className="px-6 py-3 text-sm font-medium text-white rounded-md transition-colors"
            style={{ backgroundColor: '#089AB2' }}
          >
            {showReenhancementForm ? 'Cancel Refinement' : '✨ Refine Further'}
          </button>
        )}
        
        <button
          onClick={handleDownload}
          disabled={hasInsufficientCredits}
          className={`px-6 py-3 text-sm font-medium rounded-md transition-colors ${
            hasDownloaded 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : hasInsufficientCredits
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {hasDownloaded ? (
            '✓ Re-Download Enhanced Image'
          ) : hasInsufficientCredits ? (
            `Need ${DOWNLOAD_COST} Credit${DOWNLOAD_COST === 1 ? '' : 's'}`
          ) : (
            `📥 Download Enhanced Image (${DOWNLOAD_COST} credit${DOWNLOAD_COST === 1 ? '' : 's'})`
          )}
        </button>

        <button
          onClick={onReset}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Start New Project
        </button>
      </div>

      {/* Edit Counter */}
      {!editsExhausted && (
        <div className="text-center text-sm" style={{ color: '#6B7280' }}>
          {remainingEdits} refinement{remainingEdits === 1 ? '' : 's'} remaining for this project
        </div>
      )}

      {editsExhausted && (
        <div className="text-center text-sm text-red-600">
          You've reached the maximum number of edits for this project (15). 
          Download your result or start a new project.
        </div>
      )}

      {/* Refinement Form */}
      {showReenhancementForm && !editsExhausted && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h4 className="font-medium" style={{ color: '#464646' }}>Refine Your Staged Room</h4>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Describe how you'd like to modify the staging. Be specific about what you want to change.
          </p>
          
          <textarea
            value={reenhancementPrompt}
            onChange={(e) => setReenhancementPrompt(e.target.value)}
            placeholder="e.g., 'Make the lighting warmer', 'Add more plants', 'Change the sofa to a darker color'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowReenhancementForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReenhancement}
              disabled={!reenhancementPrompt.trim() || isReenhancing}
              className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#089AB2' }}
            >
              {isReenhancing ? 'Refining...' : 'Apply Refinement'}
            </button>
          </div>
        </div>
      )}

      {/* Large Image Modal */}
      {showLargeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowLargeImage(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              ✕
            </button>
            <img 
              src={currentImageUrl} 
              alt="Large view of staged room"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
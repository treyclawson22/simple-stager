'use client'

import { useState } from 'react'
import { WorkflowGoal } from '@simple-stager/shared'
import { LoadingSpinnerWithText } from '../ui/loading-spinner'

interface TestResultsWithReenhancementProps {
  workflowId: string
  sourceImageUrl: string
  goal: WorkflowGoal
  onReset: () => void
  userCredits?: number
  onCreditsUpdate?: (newCredits: number) => void
  originalPrompt?: string
  projectName?: string
  isAuthenticated?: boolean
}

export function TestResultsWithReenhancement({ 
  workflowId, 
  sourceImageUrl, 
  goal, 
  onReset,
  userCredits = 0,
  onCreditsUpdate,
  originalPrompt = '',
  projectName = '',
  isAuthenticated = false
}: TestResultsWithReenhancementProps) {
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
      if (isAuthenticated) {
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
      } else {
        // Create FormData to send the current enhanced image and new prompt
        const formData = new FormData()
        
        // Convert the current enhanced image to a blob and attach it
        const response = await fetch(`/uploads/${workflowId}/generated.jpg`)
        const imageBlob = await response.blob()
        formData.append('sourceImage', imageBlob, 'enhanced.jpg')
        formData.append('prompt', reenhancementPrompt)
        formData.append('goal', goal)
        formData.append('workflowId', workflowId)

        const enhanceResponse = await fetch('/api/test/workflows/reenhance', {
          method: 'POST',
          body: formData
        })

        if (!enhanceResponse.ok) {
          throw new Error('Re-enhancement failed')
        }

        const result = await enhanceResponse.json()
        
        // Update the current image URL to show the newly enhanced version
        setReenhancedImageUrl(result.watermarkedUrl)
        setCurrentImageUrl(result.watermarkedUrl)
        setLatestFullResUrl(result.imageUrl)
        setReenhancementPrompt('')
        setShowReenhancementForm(false)
        
        // Increment edit counter
        setEditCount(prev => prev + 1)
      }
      
    } catch (error) {
      console.error('Re-enhancement error:', error)
      alert('Re-enhancement failed. Please try again.')
    } finally {
      setIsReenhancing(false)
    }
  }

  const handleDownload = async () => {
    if (hasInsufficientCredits) {
      alert('Insufficient credits for download. Please upgrade your plan or purchase more credits.')
      return
    }

    if (hasDownloaded) {
      // Already downloaded, just download the file
      const link = document.createElement('a')
      link.href = latestFullResUrl
      const fileName = projectName.trim() 
        ? `${projectName.trim()} - Virtually Staged.jpg`
        : `Virtually Staged - ${workflowId}.jpg`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    try {
      if (isAuthenticated) {
        // Use authenticated download endpoint
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
        const fileName = projectName.trim() 
          ? `${projectName.trim()} - Virtually Staged.jpg`
          : `Virtually Staged - ${workflowId}.jpg`
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Use test download endpoint
        const response = await fetch('/api/test/workflows/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowId: workflowId
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          alert(result.error || 'Failed to process download')
          return
        }

        // Update credits in parent component if callback provided
        if (onCreditsUpdate) {
          console.log('Credit update callback exists, calling with:', result.creditsRemaining)
          onCreditsUpdate(result.creditsRemaining)
        } else {
          console.log('No credit update callback provided')
          // Fallback: refresh to show updated credits  
          window.location.reload()
        }

        setHasDownloaded(true)
        
        // Trigger the actual download
        const link = document.createElement('a')
        link.href = latestFullResUrl
        const fileName = projectName.trim() 
          ? `${projectName.trim()} - Virtually Staged.jpg`
          : `Virtually Staged - ${workflowId}.jpg`
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to process download. Please try again.')
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
          projectName,
          feedbackText: feedbackText.trim(),
          originalImageUrl: sourceImageUrl,
          stagedImageUrl: currentImageUrl,
          originalPrompt,
        }),
      })

      if (response.ok) {
        setShowFeedbackModal(false)
        setFeedbackText('')
        alert('Thank you for your feedback! We\'ll review it and get back to you soon.')
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhancement Complete Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Enhancement Complete</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your room has been enhanced with professional staging furniture while preserving the room's architecture and lighting.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Original</h3>
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={sourceImageUrl} 
              alt="Original room"
              className="w-full h-64 object-cover select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              style={{ userSelect: 'none' }}
            />
          </div>
          
          {/* Project Name Field */}
          {projectName && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm">
                {projectName}
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Image */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {reenhancedImageUrl ? 'Enhanced' : 'Staged'}
            </h3>
            <button
              onClick={() => setShowLargeImage(true)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              View Large
            </button>
          </div>
          <div className="border rounded-lg overflow-hidden cursor-pointer relative" onClick={() => setShowLargeImage(true)}>
            <img 
              src={currentImageUrl} 
              alt={reenhancedImageUrl ? 'AI enhanced room' : 'AI staged room'}
              className={`w-full h-64 object-cover hover:opacity-90 transition-opacity select-none ${
                isReenhancing ? 'blur-sm' : ''
              }`}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              style={{ userSelect: 'none' }}
            />
            {isReenhancing && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                <LoadingSpinnerWithText 
                  text="Refining your staging..." 
                  size="md"
                  className="py-4"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Re-enhancement section */}
      {!hasDownloaded && (
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Refine Staging</h3>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600">Make additional changes to the staging</p>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                remainingEdits <= 3 
                  ? 'bg-red-100 text-red-700' 
                  : remainingEdits <= 7 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {remainingEdits} edits remaining
              </div>
            </div>
          </div>
          {!showReenhancementForm && !editsExhausted && (
            <button
              onClick={() => {
                setShowReenhancementForm(true)
                // Auto-populate with original prompt when opening refinement form
                if (originalPrompt && !reenhancementPrompt) {
                  setReenhancementPrompt(originalPrompt)
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Refine Staging
            </button>
          )}
          {editsExhausted && (
            <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm font-medium">
              Edit Limit Reached
            </div>
          )}
        </div>


        {showReenhancementForm && (
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to change or improve?
              </label>
              {originalPrompt && (
                <p className="text-xs text-gray-500 mb-2">
                  Your original prompt has been loaded. Edit it to refine your staging.
                </p>
              )}
              <textarea
                value={reenhancementPrompt}
                onChange={(e) => setReenhancementPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="e.g., 'Add more plants', 'Change the lighting to be warmer', 'Remove the coffee table', 'Add artwork to the walls'..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleReenhancement}
                disabled={!reenhancementPrompt.trim() || isReenhancing || editsExhausted}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-w-[120px]"
              >
                {isReenhancing ? 'Refining...' : editsExhausted ? 'Edit Limit Reached' : 'Refine Staging'}
              </button>
              <button
                onClick={() => {
                  setShowReenhancementForm(false)
                  setReenhancementPrompt('')
                }}
                disabled={isReenhancing}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit limit reached notice */}
        {editsExhausted && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">Edit Limit Reached</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>You've used all 15 available refinements for this staging. To make more changes, please start a new workflow.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      )}
      
      {/* Action buttons */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={handleDownload}
            disabled={hasInsufficientCredits}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              hasInsufficientCredits 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {hasInsufficientCredits 
              ? 'Insufficient Credits' 
              : hasDownloaded 
                ? 'Re-download Enhanced Image'
                : `Download Enhanced Image (${DOWNLOAD_COST} Credit)`
            }
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
          >
            {hasDownloaded ? 'Stage Another Picture' : 'Start Over'}
          </button>
        </div>

        {/* Combined Info Box - MLS Reminder and Feedback */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          {/* MLS Staging Reminder */}
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Friendly reminder:</span> MLS rules require you to mark this image as virtually staged.
              </p>
            </div>
          </div>
          
          {/* Spacer */}
          <div className="my-4 border-t border-blue-200"></div>
          
          {/* Feedback Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Not getting the results you were wanting?</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Let us know what's not working and we'll help improve your staging
              </p>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Click here
            </button>
          </div>
        </div>
      </div>

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
              src={currentImageUrl}
              alt={reenhancedImageUrl ? 'Large view of enhanced room' : 'Large view of staged room'}
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tell us what's not working
              </h3>
              <p className="text-sm text-gray-600">
                Describe the issue with your staging results. We'll review it along with your images and prompt to help improve the outcome.
              </p>
            </div>
            
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="For example: 'The furniture is too modern for this space' or 'The room looks too cluttered' or 'The colors don't match the style I requested'..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim() || isSubmittingFeedback}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackText('')
                }}
                disabled={isSubmittingFeedback}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
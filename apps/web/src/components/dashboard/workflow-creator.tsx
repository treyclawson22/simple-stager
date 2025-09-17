'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { TestResultsWithReenhancement } from '../test/test-results-with-reenhancement'
import { LoadingSpinnerWithText } from '../ui/loading-spinner'
import { EnhancedPromptBuilder } from '../test/enhanced-prompt-builder'
import { WorkflowGoal } from '@simple-stager/shared'

interface WorkflowCreatorProps {
  userId: string
  userCredits?: number
  onCreditsUpdate?: (newCredits: number) => void
  resumeWorkflowId?: string
}

export function WorkflowCreator({ userId, userCredits = 0, onCreditsUpdate, resumeWorkflowId }: WorkflowCreatorProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'results'>('upload')
  const [workflowId, setWorkflowId] = useState<string>('')
  const goal = 'stage' as WorkflowGoal
  const [sourceImageUrl, setSourceImageUrl] = useState<string>('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [manualPrompt, setManualPrompt] = useState('')
  const [promptError, setPromptError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  // Handle resuming an existing workflow
  useEffect(() => {
    if (resumeWorkflowId) {
      const loadWorkflowData = async () => {
        try {
          // Fetch workflow data using authenticated endpoint
          const response = await fetch(`/api/workflows/${resumeWorkflowId}`)
          if (response.ok) {
            const workflow = await response.json()
            setWorkflowId(resumeWorkflowId)
            setSourceImageUrl(workflow.sourceImage)
            setProjectName(workflow.name || '')
            
            // If workflow has results, go to results step, otherwise configure step
            if (workflow.results && workflow.results.length > 0) {
              setCurrentStep('results')
            } else {
              setCurrentStep('configure')
            }
          }
        } catch (error) {
          console.error('Failed to load workflow data:', error)
          // Fallback to basic resume logic
          setWorkflowId(resumeWorkflowId)
          setSourceImageUrl(`/uploads/${resumeWorkflowId}/source.jpg`)
          setCurrentStep('configure')
        }
      }
      
      loadWorkflowData()
    }
  }, [resumeWorkflowId, router])

  const handleImageUploaded = (id: string) => {
    setWorkflowId(id)
    setSourceImageUrl(`/uploads/${id}/source.jpg`)
    setCurrentStep('configure')
  }

  const handleGenerate = () => {
    setCurrentStep('results')
    setIsGeneratingImage(false)
  }

  const handleGenerateWithPrompt = async (prompt: string) => {
    if (!prompt.trim()) {
      setPromptError('Please generate a staging prompt first')
      return
    }

    if (!projectName.trim()) {
      setPromptError('Please enter a project name first')
      return
    }

    setIsGeneratingImage(true)
    setPromptError(null)

    try {
      const response = await fetch('/api/workflows/generate-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          prompt: prompt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const result = await response.json()
      console.log('Image generation result:', result)
      
      // Add a small delay to ensure files are written before transition
      setTimeout(() => {
        console.log('Transitioning to results view...')
        handleGenerate()
      }, 1000)
      
    } catch (error) {
      console.error('Image generation error:', error)
      setPromptError('Failed to generate image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleChangePhoto = () => {
    setSourceImageUrl('')
    setWorkflowId('')
    setCurrentStep('upload')
    setManualPrompt('')
    setPromptError(null)
    setProjectName('')
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setWorkflowId('')
    setSourceImageUrl('')
    setIsGeneratingImage(false)
    setIsUploading(false)
    setUploadError(null)
    setManualPrompt('')
    setPromptError(null)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('goal', goal)

      // Use authenticated endpoint for workflow creation
      const response = await fetch('/api/workflows', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      handleImageUploaded(result.workflowId)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [goal])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  })

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium" style={{ color: '#464646' }}>Advanced AI Room Staging</h2>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            Upload a room photo and customize detailed staging options
          </p>
        </div>

        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center`} style={{ 
              color: currentStep === 'upload' ? '#089AB2' : workflowId ? '#10B981' : '#9CA3AF' 
            }}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium`} style={{
                backgroundColor: currentStep === 'upload' ? '#E6F7FA' : workflowId ? '#D1FAE5' : '#F3F4F6',
                color: currentStep === 'upload' ? '#089AB2' : workflowId ? '#10B981' : '#9CA3AF'
              }}>
                {workflowId && currentStep !== 'upload' ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Upload Photo</span>
            </div>
            
            <div className={`flex-1 h-px`} style={{ backgroundColor: workflowId ? '#A7F3D0' : '#E5E7EB' }}></div>
            
            <div className={`flex items-center`} style={{ 
              color: currentStep === 'configure' ? '#089AB2' : currentStep === 'results' ? '#10B981' : '#9CA3AF' 
            }}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium`} style={{
                backgroundColor: currentStep === 'configure' ? '#E6F7FA' : currentStep === 'results' ? '#D1FAE5' : '#F3F4F6',
                color: currentStep === 'configure' ? '#089AB2' : currentStep === 'results' ? '#10B981' : '#9CA3AF'
              }}>
                {currentStep === 'results' ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Write Prompt</span>
            </div>
            
            <div className={`flex-1 h-px`} style={{ backgroundColor: currentStep === 'results' ? '#A7F3D0' : '#E5E7EB' }}></div>
            
            <div className={`flex items-center`} style={{ 
              color: currentStep === 'results' ? '#089AB2' : '#9CA3AF' 
            }}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium`} style={{
                backgroundColor: currentStep === 'results' ? '#E6F7FA' : '#F3F4F6',
                color: currentStep === 'results' ? '#089AB2' : '#9CA3AF'
              }}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">View Staged Room</span>
            </div>
          </div>

          {/* Side-by-side image view - visible during upload and configure steps */}
          {currentStep !== 'results' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Original/Upload Image */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium" style={{ color: '#464646' }}>Original</h3>
                </div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg overflow-hidden h-64 flex items-center justify-center transition-colors ${
                    sourceImageUrl 
                      ? 'border-gray-300 bg-gray-50 cursor-pointer hover:border-indigo-400' 
                      : isDragActive
                      ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                      : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-25 cursor-pointer'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  {sourceImageUrl ? (
                    <img 
                      src={sourceImageUrl} 
                      alt="Uploaded room"
                      className="w-full h-full object-cover"
                    />
                  ) : isUploading ? (
                    <div className="text-center">
                      <LoadingSpinnerWithText 
                        text="Uploading image..." 
                        size="md"
                        className="py-4"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 p-4">
                      <svg
                        className="mx-auto h-12 w-12 mb-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-sm font-medium mb-1">
                        {isDragActive
                          ? 'Drop your room photo here'
                          : 'Drag and drop a room photo, or click to select'}
                      </p>
                      <p className="text-xs">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  )}
                </div>
                
                {/* Project Name - Always visible when we have an image */}
                {sourceImageUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="123 Main Street, Los Angeles, CA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Generated Image */}
              <div>
                <h3 className="text-lg font-medium mb-4" style={{ color: '#464646' }}>Staged Room</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 h-64 flex items-center justify-center relative">
                  <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-sm">Your staged room will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Upload Error Display */}
          {uploadError && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {uploadError}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content based on step */}
          {currentStep === 'configure' && workflowId && (
            <div className="space-y-6">
              <EnhancedPromptBuilder
                workflowId={workflowId}
                onPromptGenerated={(prompt) => {
                  if (!projectName.trim()) {
                    setPromptError('Please enter a project name first')
                    return
                  }
                  setManualPrompt(prompt)
                  // Automatically generate the image once prompt is ready
                  handleGenerateWithPrompt(prompt)
                }}
                onError={(error) => setPromptError(error)}
                isGeneratingImage={isGeneratingImage}
                projectName={projectName}
              />

              {/* Error Display */}
              {promptError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        {promptError}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'results' && workflowId && (
            <TestResultsWithReenhancement
              workflowId={workflowId}
              sourceImageUrl={sourceImageUrl}
              goal={goal}
              onReset={handleReset}
              userCredits={userCredits}
              onCreditsUpdate={onCreditsUpdate}
              originalPrompt={manualPrompt}
              projectName={projectName}
              isAuthenticated={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
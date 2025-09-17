'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/upload/image-uploader'
import { PromptBuilder } from '@/components/prompt-builder/prompt-builder'
import { WorkflowGoal } from '@simple-stager/shared'

interface WorkflowCreatorProps {
  userId: string
}

export function WorkflowCreator({ userId }: WorkflowCreatorProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure'>('upload')
  const [workflowId, setWorkflowId] = useState<string>('')
  const [goal, setGoal] = useState<WorkflowGoal>('stage')

  const handleImageUploaded = (id: string) => {
    setWorkflowId(id)
    setCurrentStep('configure')
  }

  const handleGenerate = () => {
    router.push(`/workflow/${workflowId}`)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Create New Workflow</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload a room photo and choose your enhancement goal
        </p>
      </div>

      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep === 'upload' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
              currentStep === 'upload' ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Upload Photo</span>
          </div>
          
          <div className="flex-1 h-px bg-gray-200"></div>
          
          <div className={`flex items-center ${currentStep === 'configure' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
              currentStep === 'configure' ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Configure</span>
          </div>
        </div>

        {/* Goal selection - always visible */}
        <div>
          <label className="text-sm font-medium text-gray-700">Enhancement Goal</label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(['stage', 'declutter', 'improve'] as WorkflowGoal[]).map((option) => (
              <label key={option} className="relative">
                <input
                  type="radio"
                  name="goal"
                  value={option}
                  checked={goal === option}
                  onChange={(e) => setGoal(e.target.value as WorkflowGoal)}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 cursor-pointer text-center ${
                  goal === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
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

        {/* Content based on step */}
        {currentStep === 'upload' && (
          <ImageUploader
            goal={goal}
            onSuccess={handleImageUploaded}
          />
        )}

        {currentStep === 'configure' && workflowId && (
          <PromptBuilder
            workflowId={workflowId}
            goal={goal}
            onGenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  )
}
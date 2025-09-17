'use client'

import { useState } from 'react'
import { WorkflowGoal, PromptAnswers } from '@simple-stager/shared'
import { LoadingSpinnerWithText } from '../ui/loading-spinner'

interface TestPromptBuilderProps {
  workflowId: string
  goal: WorkflowGoal
  onGenerate: () => void
  sourceImageUrl: string
  onGeneratingChange: (isGenerating: boolean) => void
}

export function TestPromptBuilder({ workflowId, goal, onGenerate, sourceImageUrl, onGeneratingChange }: TestPromptBuilderProps) {
  const [answers, setAnswers] = useState<PromptAnswers>({})
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const questions = getQuestionsForGoal(goal)

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const generatePrompt = async () => {
    setIsGeneratingPrompt(true)
    setError(null)

    try {
      const response = await fetch('/api/test/workflows/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          goal,
          answers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const result = await response.json()
      setGeneratedPrompt(result.prompt)
    } catch (error) {
      console.error('Prompt generation error:', error)
      setError('Failed to generate prompt. Please try again.')
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const generateImage = async () => {
    if (!generatedPrompt) return

    setIsGeneratingImage(true)
    onGeneratingChange(true)
    setError(null)

    try {
      const response = await fetch('/api/test/workflows/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          prompt: generatedPrompt,
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
        onGenerate()
      }, 1000)
    } catch (error) {
      console.error('Image generation error:', error)
      setError('Failed to generate image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
      onGeneratingChange(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Staging Preferences</h3>
        {questions.map((question: any) => (
          <div key={question.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {question.label}
            </label>
            {question.type === 'select' ? (
              <select
                value={answers[question.key] || ''}
                onChange={(e) => handleAnswerChange(question.key, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select an option</option>
                {question.options?.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={answers[question.key] || ''}
                onChange={(e) => handleAnswerChange(question.key, e.target.value)}
                placeholder={question.placeholder}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}
      </div>

      {/* Generate Prompt Button */}
      <div>
        <button
          onClick={generatePrompt}
          disabled={isGeneratingPrompt}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPrompt ? 'Generating Prompt...' : 'Generate AI Prompt'}
        </button>
      </div>

      {/* Generated Prompt Display */}
      {generatedPrompt && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated AI Prompt
            </label>
            <textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="AI-generated prompt will appear here..."
            />
            <p className="mt-1 text-xs text-gray-500">
              You can edit the prompt above before generating the image
            </p>
          </div>

          {/* Generate Image Button */}
          <button
            onClick={generateImage}
            disabled={!generatedPrompt.trim() || isGeneratingImage}
            className="w-full px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingImage ? 'Generating...' : 'Generate Staged Room'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
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
                {error}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getQuestionsForGoal(goal: WorkflowGoal) {
  return [
    {
      key: 'style',
      label: 'What style do you prefer?',
      type: 'select' as const,
      options: [
        { label: 'Modern', value: 'modern' },
        { label: 'Traditional', value: 'traditional' },
        { label: 'Contemporary', value: 'contemporary' },
        { label: 'Minimalist', value: 'minimalist' },
        { label: 'Rustic', value: 'rustic' },
      ]
    },
    {
      key: 'budget',
      label: 'What is your budget range?',
      type: 'select' as const,
      options: [
        { label: 'Budget-friendly', value: 'budget' },
        { label: 'Mid-range', value: 'mid' },
        { label: 'High-end', value: 'high' },
      ]
    },
    {
      key: 'roomType',
      label: 'What type of room is this?',
      type: 'select' as const,
      options: [
        { label: 'Living Room', value: 'living' },
        { label: 'Bedroom', value: 'bedroom' },
        { label: 'Kitchen', value: 'kitchen' },
        { label: 'Dining Room', value: 'dining' },
        { label: 'Office', value: 'office' },
        { label: 'Bathroom', value: 'bathroom' },
      ]
    },
    {
      key: 'notes',
      label: 'Additional context or specific requirements',
      type: 'textarea' as const,
      placeholder: 'Any additional details, preferences, or requirements...'
    }
  ]
}
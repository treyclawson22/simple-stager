'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Wand2, Loader2 } from 'lucide-react'
import { WorkflowGoal, promptAnswersSchema, type PromptAnswersInput } from '@simple-stager/shared'

interface PromptBuilderProps {
  workflowId: string
  goal: WorkflowGoal
  onGenerate: () => void
}

export function PromptBuilder({ workflowId, goal, onGenerate }: PromptBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PromptAnswersInput>({
    resolver: zodResolver(promptAnswersSchema),
  })

  const watchedValues = watch()

  const onSubmit = async (data: PromptAnswersInput) => {
    setIsGenerating(true)
    setError('')

    try {
      // First generate the prompt using ChatGPT
      const promptResponse = await fetch('/api/workflows/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          goal,
          answers: data,
        }),
      })

      if (!promptResponse.ok) {
        throw new Error('Failed to generate prompt')
      }

      const { prompt } = await promptResponse.json()
      setGeneratedPrompt(prompt)

      // Then generate the image
      const generateResponse = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          prompt,
        }),
      })

      if (!generateResponse.ok) {
        throw new Error('Failed to start generation')
      }

      onGenerate()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  const getQuestionsForGoal = (goal: WorkflowGoal) => {
    const baseQuestions = [
      {
        key: 'projectName' as const,
        label: 'Name Your Project (Optional)',
        placeholder: '123 Main Street, Los Angeles, CA',
        required: false,
      },
      {
        key: 'roomType' as const,
        label: 'Room Type',
        placeholder: 'e.g., Living room, Bedroom, Kitchen',
        required: true,
      },
    ]

    switch (goal) {
      case 'stage':
        return [
          ...baseQuestions,
          {
            key: 'style' as const,
            label: 'Staging Style',
            placeholder: 'e.g., Modern, Traditional, Minimalist, Scandinavian',
            required: false,
          },
          {
            key: 'buyerProfile' as const,
            label: 'Target Buyer',
            placeholder: 'e.g., Young professionals, Families, Executives',
            required: false,
          },
        ]
      
      case 'declutter':
        return [
          ...baseQuestions,
          {
            key: 'notes' as const,
            label: 'Specific Items to Remove',
            placeholder: 'e.g., Personal photos, excess furniture, clutter on surfaces',
            required: false,
          },
        ]
      
      case 'improve':
        return [
          ...baseQuestions,
          {
            key: 'palette' as const,
            label: 'Color Preferences',
            placeholder: 'e.g., Neutral tones, Warm colors, Cool colors',
            required: false,
          },
          {
            key: 'notes' as const,
            label: 'Improvement Focus',
            placeholder: 'e.g., Better lighting, wall color, flooring, fixtures',
            required: false,
          },
        ]
      
      default:
        return baseQuestions
    }
  }

  const questions = getQuestionsForGoal(goal)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Configure Your {goal.charAt(0).toUpperCase() + goal.slice(1)} Request
        </h3>
        <p className="text-sm text-gray-600">
          Answer a few questions to help AI create the perfect transformation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {questions.map((question) => (
          <div key={question.key}>
            <label htmlFor={question.key} className="block text-sm font-medium text-gray-700 mb-2">
              {question.label} {question.required && <span className="text-red-500">*</span>}
            </label>
            
            {question.key === 'notes' ? (
              <textarea
                id={question.key}
                {...register(question.key)}
                placeholder={question.placeholder}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <input
                id={question.key}
                type="text"
                {...register(question.key)}
                placeholder={question.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
            
            {errors[question.key] && (
              <p className="mt-1 text-sm text-red-600">
                {errors[question.key]?.message}
              </p>
            )}
          </div>
        ))}

        {generatedPrompt && (
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Generated Prompt:</h4>
            <p className="text-sm text-blue-800">{generatedPrompt}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="-ml-1 mr-2 h-5 w-5" />
                Generate {goal.charAt(0).toUpperCase() + goal.slice(1)}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
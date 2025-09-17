'use client'

import { useState } from 'react'
import { LoadingSpinnerWithText } from '../ui/loading-spinner'

interface EnhancedPromptBuilderProps {
  workflowId: string
  onPromptGenerated: (prompt: string) => void
  onError: (error: string) => void
  isGeneratingImage?: boolean
  projectName?: string
}

type RoomStyle = 'modern' | 'minimal' | 'traditional' | 'contemporary' | 'rustic' | 'industrial' | 'scandinavian' | 'bohemian' | 'luxury' | 'transitional'
type RoomType = 'living-room' | 'bedroom' | 'kitchen' | 'dining-room' | 'home-office' | 'bathroom' | 'entryway' | 'family-room' | 'guest-room' | 'den'

const ROOM_STYLES: { value: RoomStyle; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Clean lines, sleek furniture, neutral colors' },
  { value: 'minimal', label: 'Minimalist', description: 'Simple, uncluttered, essential furniture only' },
  { value: 'traditional', label: 'Traditional', description: 'Classic, timeless pieces with rich colors' },
  { value: 'contemporary', label: 'Contemporary', description: 'Current trends, mixed textures, bold accents' },
  { value: 'rustic', label: 'Rustic', description: 'Natural materials, warm wood, cozy atmosphere' },
  { value: 'industrial', label: 'Industrial', description: 'Metal, exposed elements, urban feel' },
  { value: 'scandinavian', label: 'Scandinavian', description: 'Light colors, natural wood, hygge comfort' },
  { value: 'bohemian', label: 'Bohemian', description: 'Eclectic, colorful, layered textures' },
  { value: 'luxury', label: 'Luxury', description: 'High-end finishes, elegant furniture, sophistication' },
  { value: 'transitional', label: 'Transitional', description: 'Blend of traditional and contemporary elements' }
]

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'living-room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'dining-room', label: 'Dining Room' },
  { value: 'home-office', label: 'Home Office' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'entryway', label: 'Entryway/Foyer' },
  { value: 'family-room', label: 'Family Room' },
  { value: 'guest-room', label: 'Guest Room' },
  { value: 'den', label: 'Den/Study' }
]

export function EnhancedPromptBuilder({ 
  workflowId, 
  onPromptGenerated, 
  onError,
  isGeneratingImage = false,
  projectName = ''
}: EnhancedPromptBuilderProps) {
  const [roomStyle, setRoomStyle] = useState<RoomStyle>('modern')
  const [roomType, setRoomType] = useState<RoomType>('living-room')
  const [additionalRequirements, setAdditionalRequirements] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [showEditPrompt, setShowEditPrompt] = useState(false)

  const handleGeneratePrompt = async () => {
    setIsGenerating(true)
    onError('')

    try {
      const response = await fetch('/api/test/workflows/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          goal: 'stage',
          answers: {
            roomType: roomType,
            style: roomStyle,
            palette: 'neutral',
            buyerProfile: 'general buyers',
            notes: additionalRequirements.trim(),
            projectName: projectName?.trim() || ''
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const result = await response.json()
      setGeneratedPrompt(result.prompt)
      setShowEditPrompt(true)
      
    } catch (error) {
      console.error('Prompt generation error:', error)
      onError('Failed to generate staging prompt. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUsePrompt = () => {
    onPromptGenerated(generatedPrompt)
  }

  const selectedStyle = ROOM_STYLES.find(style => style.value === roomStyle)

  // Show configuration form initially, then replace with prompt text area after generation
  if (showEditPrompt && generatedPrompt) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Staging Prompt</h3>
          <p className="text-sm text-gray-600 mb-6">
            Review and edit the generated staging prompt below, then proceed with staging
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Generated Staging Prompt</label>
            <textarea
              value={generatedPrompt}
              onChange={(e) => setGeneratedPrompt(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="mt-1 text-xs text-blue-600">
              Review and edit the prompt above if needed, then use it for staging.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleUsePrompt}
              disabled={isGeneratingImage}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isGeneratingImage ? (
                <div className="flex items-center">
                  <LoadingSpinnerWithText 
                    text="Generating..." 
                    size="sm"
                    className="py-0"
                  />
                </div>
              ) : (
                'Generate Staged Room'
              )}
            </button>
            <button
              onClick={handleGeneratePrompt}
              disabled={isGenerating || isGeneratingImage}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-w-[140px]"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full border-2 border-gray-300 border-t-gray-700 w-3 h-3 flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Generating...</span>
                </div>
              ) : (
                'Regenerate Prompt'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while generating prompt
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Staging Prompt</h3>
          <p className="text-sm text-gray-600 mb-6">
            Creating your personalized staging prompt...
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center">
          <LoadingSpinnerWithText 
            text="Generating staging prompt..." 
            size="md"
            className="py-4"
          />
        </div>
      </div>
    )
  }

  // Show initial configuration form
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Staging Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select your preferences and we'll create an optimized staging prompt using AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What type of room is this?
          </label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as RoomType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {ROOM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Style Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What style do you want?
          </label>
          <select
            value={roomStyle}
            onChange={(e) => setRoomStyle(e.target.value as RoomStyle)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {ROOM_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
          {selectedStyle && (
            <p className="mt-1 text-xs text-gray-500">
              {selectedStyle.description}
            </p>
          )}
        </div>
      </div>


      {/* Additional Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Requirements (Optional)
        </label>
        <textarea
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder="Any specific requests? e.g., 'Include plants', 'Use warm colors', 'Add artwork', 'Keep it budget-friendly'..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Generate Prompt Button */}
      <button
        onClick={handleGeneratePrompt}
        disabled={isGenerating}
        className="w-full px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Staging Prompt
      </button>
    </div>
  )
}
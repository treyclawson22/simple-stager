import Anthropic from '@anthropic-ai/sdk'
import { WorkflowGoal, PromptAnswers } from '@simple-stager/shared'
import { buildPromptWithGemini } from './gemini'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null

export async function buildPrompt(
  goal: WorkflowGoal,
  answers: PromptAnswers,
  sourceImageUrl?: string
): Promise<string> {
  const { roomType, style, palette, buyerProfile, notes } = answers

  // Convert room type value to display label
  const roomTypeMap: Record<string, string> = {
    'living': 'living room',
    'bedroom': 'bedroom', 
    'kitchen': 'kitchen',
    'dining': 'dining room',
    'office': 'office',
    'bathroom': 'bathroom'
  }
  const roomTypeLabel = roomType ? roomTypeMap[roomType] || roomType : 'room'

  const systemPrompts = {
    stage: `You are an expert real estate staging consultant. Create a detailed prompt for AI image generation to ONLY ADD furniture and decor to an empty or sparse room. Focus on:
- Adding furniture that fits the space and room type
- Creating an inviting, move-in ready atmosphere
- Using neutral, broadly appealing color schemes unless specified
- Making the space feel lived-in but not cluttered

CRITICAL REQUIREMENTS - The generated image must preserve 100% of the existing structure:
- DO NOT change, move, or modify ANY light fixtures, lamps, or lighting
- DO NOT change, add, remove, or modify ANY walls, wall colors, or paint
- DO NOT change ANY windows, doors, or architectural features
- DO NOT change ANY flooring, ceiling, or structural elements
- DO NOT change ANY built-in features like cabinets, counters, or fixtures
- DO NOT modify the room's layout, proportions, or spatial arrangement
- ONLY ADD removable furniture and decor items like chairs, tables, rugs, pillows, artwork, plants, and decorative accessories`,

    declutter: `You are an expert real estate photographer and home stager. Create a detailed prompt for AI image generation to remove clutter and personal items from a room. Focus on:
- Removing personal photos, excess decorative items, and clutter
- Keeping essential furniture and functional items
- Maintaining the room's character and purpose
- Creating clean, organized surfaces
- Preserving the room's scale and proportions`,

    improve: `You are an expert interior designer specializing in home improvements. Create a detailed prompt for AI image generation to make light renovations and improvements to a room. Focus on:
- Improving paint colors, lighting, or minor fixtures
- Updating dated elements while keeping structural features
- Enhancing the room's best features
- Creating modern, appealing aesthetics
- Making cost-effective visual improvements`
  }

  const userPrompt = `Write ONLY the AI image prompt. No preamble, no analysis, no formatting. Start directly with: "Modify this image of a ${roomTypeLabel} to ${goal === 'stage' ? 'add furniture and staging elements' : goal === 'declutter' ? 'remove clutter and personal items' : 'make improvements'}."

Include: ${style || 'modern'} style furniture, ${palette || 'neutral'} colors, appropriate for ${buyerProfile || 'general buyers'}.${notes ? ' Also: ' + notes : ''}

${goal === 'stage' ? 'Must end with: "PRESERVE ALL existing walls, flooring, lighting, and architectural features - only add furniture and decor."' : ''}
  `.trim()

  try {
    // Use Gemini as primary prompt generator
    console.log('Using Gemini for prompt generation...')
    return await buildPromptWithGemini(goal, answers, sourceImageUrl)
    
  } catch (error) {
    console.error('Gemini prompt generation error:', error)
    
    // Try Claude as fallback
    try {
      console.log('Falling back to Claude API...')
      if (!anthropic) {
        throw new Error('Claude API not configured')
      }
      
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompts[goal],
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })

      const generatedPrompt = response.content[0]?.type === 'text' ? response.content[0].text.trim() : null
      
      if (!generatedPrompt) {
        throw new Error('No prompt generated')
      }

      return generatedPrompt
    } catch (claudeError) {
      console.error('Claude fallback also failed:', claudeError)
      
      // Final fallback prompts when both Claude and Gemini fail
      const fallbackPrompts = {
        stage: `${sourceImageUrl ? 'Modify this image of a ' + roomTypeLabel + ' to add' : 'Add'} ${style || 'modern'} furniture and decor${sourceImageUrl ? '' : ' to this ' + roomTypeLabel}. Include appropriate seating, storage, and decorative elements. Keep the space feeling open and inviting with neutral colors that appeal to potential buyers. PRESERVE ALL existing walls, flooring, lighting, and architectural features - only add furniture and decor.`,
        
        declutter: `${sourceImageUrl ? 'Modify this image of a ' + roomTypeLabel + ' to remove' : 'Remove'} personal items, excess decorations, and clutter${sourceImageUrl ? '' : ' from this ' + roomTypeLabel}. Keep essential furniture and create organized, clean surfaces while maintaining the room's functionality.`,
        
        improve: `${sourceImageUrl ? 'Modify this image of a ' + roomTypeLabel + ' to improve it with' : 'Improve this ' + roomTypeLabel + ' with'} ${palette || 'modern'} colors and updated elements. Focus on better lighting, fresh paint, and contemporary touches while preserving the room's character and architecture.`
      }
      
      return fallbackPrompts[goal]
    }
  }
}
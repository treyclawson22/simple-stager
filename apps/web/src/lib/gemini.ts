import { WorkflowGoal, PromptAnswers } from '@simple-stager/shared'

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
  }[]
}

export async function buildPromptWithGemini(
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
    stage: `You are an expert real estate staging consultant. Create a detailed prompt for AI image generation to ONLY ADD furniture and decor to an empty or sparse room. 

CRITICAL STAGING CONSTRAINTS:
- NEVER change walls, lighting fixtures, flooring, windows, doors, or any architectural features
- ONLY add removable furniture like sofas, chairs, tables, rugs, artwork, plants, pillows
- Focus on adding furniture that fits the space and room type
- Create an inviting, move-in ready atmosphere with neutral colors
- Make the space feel lived-in but not cluttered
- IMPORTANT: If placing furniture near windows, use "near window" not "in front of window" to avoid blocking views
- CRITICAL: When adding artwork to walls, always include "and do not obstruct any windows" in the instruction (e.g., "Add two pieces of modern artwork on the walls, keeping the style neutral and sophisticated and do not obstruct any windows")`,

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

  const userPrompt = `${systemPrompts[goal]}

Write ONLY the AI image prompt. No preamble, no analysis. Start directly with: "${goal === 'stage' ? 'Act as a virtual stager. Your only job is to place furniture and décor. You must not modify architecture. ' : ''}Modify this image of a ${roomTypeLabel} to ${goal === 'stage' ? 'add furniture and staging elements' : goal === 'declutter' ? 'remove clutter and personal items' : 'make improvements'}."

Include: ${style || 'modern'} style furniture, ${palette || 'neutral'} colors, appropriate for ${buyerProfile || 'general buyers'}.${notes ? ' Also: ' + notes : ''}
  `.trim()

  // Try Claude 3.5 Sonnet first for better prompt generation
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (anthropicApiKey) {
    try {
      console.log('Using Claude 3.5 Sonnet for advanced staging prompt generation...')
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 800,
          temperature: 0.3,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const generatedPrompt = data.content?.[0]?.text?.trim()
        
        if (generatedPrompt) {
          console.log('Claude 3.5 Sonnet prompt generated successfully')
          return generatedPrompt
        }
      } else {
        console.error('Claude API error:', response.status, await response.text())
      }
    } catch (claudeError) {
      console.error('Claude 3.5 Sonnet prompt generation error:', claudeError)
    }
  }

  // Fallback to Gemini if Claude fails
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Both Claude and Gemini API keys not configured')
  }

  try {
    console.log('Falling back to Gemini 1.5 Flash for prompt generation...')
    
    let requestBody: any = {
      contents: [{
        parts: [{
          text: userPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    }

    // Skip image analysis for now to avoid timeout issues
    // The prompt generation works fine without analyzing the actual image
    console.log('Skipping source image analysis to improve speed')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiResponse = await response.json()
    const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    if (!generatedPrompt) {
      throw new Error('No prompt generated from Gemini')
    }

    return generatedPrompt
    
  } catch (error) {
    console.error('Gemini API error:', error)
    
    // Fallback prompts if Gemini fails
    const fallbackPrompts = {
      stage: `Act as a virtual stager. Your only job is to place furniture and décor. You must not modify architecture. Modify this image of a ${roomTypeLabel} to add ${style || 'modern'} furniture and staging elements. Include appropriate seating, storage, and decorative elements. Keep the space feeling open and inviting with neutral colors that appeal to potential buyers. If placing furniture near windows, position items "near window" not "in front of window" to preserve natural light and views. When adding artwork to walls, ensure it does not obstruct any windows.`,
      
      declutter: `Modify this image of a ${roomTypeLabel} to remove personal items, excess decorations, and clutter. Keep essential furniture and create organized, clean surfaces while maintaining the room's functionality.`,
      
      improve: `Modify this image of a ${roomTypeLabel} to improve it with ${palette || 'modern'} colors and updated elements. Focus on better lighting, fresh paint, and contemporary touches while preserving the room's character and architecture.`
    }
    
    return fallbackPrompts[goal]
  }
}


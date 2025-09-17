import { readFile } from 'fs/promises'
import { join } from 'path'

interface NanoBananaResponse {
  success: boolean
  imageUrl?: string
  error?: string
  jobId?: string
}

export async function generateImage(
  sourceImageUrl: string,
  prompt: string,
  seed?: number
): Promise<NanoBananaResponse> {
  console.log('🎨 Starting Gemini 2.5 Flash image generation')
  console.log('Source image:', sourceImageUrl)
  console.log('Prompt:', prompt.slice(0, 100) + '...')
  console.log('🔄 Updated at:', new Date().toISOString())
  
  const geminiApiKey = process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY not found in environment variables')
    return { success: false, error: 'Gemini API key not configured' }
  }

  return await generateWithGemini(sourceImageUrl, prompt, geminiApiKey)
}


async function generateWithGemini(sourceImageUrl: string, prompt: string, apiKey: string): Promise<NanoBananaResponse> {
  try {
    // Read and encode the source image
    let base64SourceImage: string
    
    if (sourceImageUrl.startsWith('/uploads/')) {
      // Relative local file path
      const fullPath = join(process.cwd(), 'public', sourceImageUrl)
      console.log('Reading source image from filesystem (relative path):', fullPath)
      
      try {
        const imageBuffer = await readFile(fullPath)
        base64SourceImage = imageBuffer.toString('base64')
        console.log('Successfully read local source image from filesystem')
      } catch (fileError) {
        console.error('Failed to read local source image:', fileError)
        throw new Error('Failed to read source image')
      }
    } else if (sourceImageUrl.startsWith('/') || sourceImageUrl.includes(process.cwd())) {
      // Absolute local file path (from reenhancement)
      console.log('Reading source image from filesystem (absolute path):', sourceImageUrl)
      
      try {
        const imageBuffer = await readFile(sourceImageUrl)
        base64SourceImage = imageBuffer.toString('base64')
        console.log('Successfully read local source image from absolute filesystem path')
      } catch (fileError) {
        console.error('Failed to read local source image:', fileError)
        throw new Error('Failed to read source image')
      }
    } else {
      // External URL - fetch and convert
      console.log('Fetching source image from URL:', sourceImageUrl)
      const imageResponse = await fetch(sourceImageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }
      const imageBuffer = await imageResponse.arrayBuffer()
      base64SourceImage = Buffer.from(imageBuffer).toString('base64')
      console.log('Successfully fetched external source image')
    }

    console.log('Making Gemini 2.5 Flash image generation API request...')
    
    // For image-to-image generation with source image + text prompt
    const imageToImageRequestBody = {
      contents: [{
        parts: [
          { text: prompt },
          { 
            inline_data: { 
              mime_type: "image/jpeg", 
              data: base64SourceImage 
            } 
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],  // Critical: Must include both
        temperature: 0.4,
        maxOutputTokens: 2048
      }
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageToImageRequestBody),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini 2.5 Flash image generation API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini 2.5 Flash API response received')

    // Process the response according to official documentation
    const candidates = data.candidates?.[0]
    if (!candidates?.content?.parts) {
      throw new Error('Invalid response structure from Gemini API')
    }

    // Extract image data from the response using the correct property names
    let imageData: string | null = null
    let mimeType: string = 'image/png'

    for (const part of candidates.content.parts) {
      // Check for inline_data (API response format)
      if (part.inline_data?.data) {
        imageData = part.inline_data.data
        mimeType = part.inline_data.mimeType || 'image/png'
        console.log('Found image data in response (inline_data format)')
      }
      // Also check for inlineData (alternative format)
      else if (part.inlineData?.data) {
        imageData = part.inlineData.data
        mimeType = part.inlineData.mimeType || 'image/png'
        console.log('Found image data in response (inlineData format)')
      }
      
      if (part.text) {
        console.log('Found text response:', part.text.slice(0, 100) + '...')
      }
    }

    if (!imageData) {
      console.error('No image data found in response. Response structure:', JSON.stringify(data, null, 2))
      throw new Error('No image data found in Gemini response')
    }

    // Convert base64 image data to data URL with correct mime type
    const imageUrl = `data:${mimeType};base64,${imageData}`
    
    console.log('✅ Gemini 2.5 Flash image generation successful')
    return {
      success: true,
      imageUrl: imageUrl,
      jobId: 'gemini-2.5-flash-' + Date.now()
    }

  } catch (error) {
    console.error('Gemini image generation error:', error)
    throw error
  }
}

// For development/testing, create a mock function
export async function mockGenerateImage(
  sourceImageUrl: string,
  prompt: string,
  seed?: number
): Promise<NanoBananaResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  console.log('Mock generation with source image:', sourceImageUrl)
  console.log('Mock generation with prompt:', prompt?.slice(0, 100) + '...')
  
  // For demo purposes, we'll return the original image with a demo overlay
  // indicating what type of staging was applied
  let goalType = 'staged'
  let overlayText = 'STAGING DEMO'
  let overlayColor = '4ade80' // green
  
  if (prompt.toLowerCase().includes('declutter') || prompt.toLowerCase().includes('clean') || prompt.toLowerCase().includes('remove')) {
    goalType = 'decluttered'
    overlayText = 'DECLUTTER DEMO'
    overlayColor = '3b82f6' // blue
  } else if (prompt.toLowerCase().includes('improve') || prompt.toLowerCase().includes('renovate') || prompt.toLowerCase().includes('update')) {
    goalType = 'improved'
    overlayText = 'IMPROVE DEMO'
    overlayColor = 'f59e0b' // amber
  }
  
  // Check if we have a valid source image URL
  if (sourceImageUrl && sourceImageUrl.startsWith('/uploads/')) {
    // For demo purposes, we'll use the source image with an overlay
    // In a real implementation, this would be the AI-generated result
    const demoImageUrl = `https://placehold.co/1024x768/${overlayColor}/ffffff?text=${encodeURIComponent(overlayText)}`
    
    console.log(`Demo mode: returning placeholder for ${goalType} with overlay`)
    
    return {
      success: true,
      imageUrl: demoImageUrl,
      jobId: 'demo-job-' + Date.now()
    }
  }
  
  // Fallback to curated room images if no source image
  const stageImages = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1024&h=768&fit=crop&crop=center', 
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1024&h=768&fit=crop&crop=center',
  ]
  
  const declutterImages = [
    'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1558618406-fcd25c85cd64?w=1024&h=768&fit=crop&crop=center',
  ]
  
  const improveImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1024&h=768&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1024&h=768&fit=crop&crop=center',
  ]
  
  let imagePool = stageImages
  if (goalType === 'decluttered') {
    imagePool = declutterImages
  } else if (goalType === 'improved') {
    imagePool = improveImages
  }
  
  // Select random image from appropriate pool
  const randomIndex = Math.floor(Math.random() * imagePool.length)
  const selectedImage = imagePool[randomIndex]
  
  console.log(`Selected ${goalType} fallback image:`, selectedImage)
  
  // Test if the Unsplash image is accessible, if not use fallback
  try {
    const testResponse = await fetch(selectedImage, { method: 'HEAD' })
    if (testResponse.ok) {
      return {
        success: true,
        imageUrl: selectedImage,
        jobId: 'mock-job-' + Date.now()
      }
    }
  } catch (error) {
    console.warn('Unsplash image not accessible, using fallback')
  }
  
  // Final fallback to a reliable placeholder service
  const fallbackUrl = `https://placehold.co/1024x768/${overlayColor}/ffffff?text=${encodeURIComponent(overlayText + ' FALLBACK')}`
  console.log(`Using final fallback image:`, fallbackUrl)
  
  return {
    success: true,
    imageUrl: fallbackUrl,
    jobId: 'mock-job-' + Date.now()
  }
}
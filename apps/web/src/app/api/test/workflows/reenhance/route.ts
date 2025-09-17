import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { generateImage } from '@/lib/nano-banana'
import { addWatermark, createThumbnail } from '@/lib/watermark'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sourceImage = formData.get('sourceImage') as File
    const prompt = formData.get('prompt') as string
    const goal = formData.get('goal') as string
    const workflowId = formData.get('workflowId') as string

    if (!sourceImage || !prompt || !workflowId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify workflow exists
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Convert the uploaded file to a buffer and save it temporarily
    const imageBuffer = await sourceImage.arrayBuffer()
    
    // Create workflow directory if it doesn't exist
    const workflowDir = join(process.cwd(), 'public/uploads', workflowId)
    if (!existsSync(workflowDir)) {
      await mkdir(workflowDir, { recursive: true })
    }

    // Save the source image temporarily
    const tempSourcePath = join(workflowDir, 'temp_source.jpg')
    await writeFile(tempSourcePath, Buffer.from(imageBuffer))

    // Create enhanced prompt for re-enhancement with strict staging constraints
    const enhancedPrompt = `Based on the existing staged room, make these specific changes to the FURNITURE AND DECOR ONLY: ${prompt}. 

IMPORTANT PLACEMENT INSTRUCTIONS:
- When placing NEW furniture, consider the ENTIRE room layout and place items in the most logical and visually appealing positions
- Do NOT automatically place furniture in the same location where previous furniture was located
- Consider traffic flow, natural lighting, and room proportions when positioning furniture
- If furniture placement is specified (e.g., "place sofa on the left wall", "put table near the window"), follow those instructions exactly
- Vary furniture arrangements to create fresh, appealing layouts

Maintain the overall style and quality while implementing only the requested furniture/decor changes. PRESERVE ALL existing walls, flooring, lighting, and architectural features - only modify furniture and decor.`

    try {
      // Generate new enhanced image using the previous enhanced image as source
      // Pass the full filesystem path since nano-banana.ts now handles local files
      const result = await generateImage(tempSourcePath, enhancedPrompt)
      
      if (!result.success || !result.imageUrl) {
        throw new Error('Re-enhancement generation failed')
      }

      // Handle the generated image (data URL from Gemini)
      let newImageBuffer: Buffer
      
      if (result.imageUrl.startsWith('data:')) {
        // Handle base64 data URL from Gemini
        const base64Data = result.imageUrl.split(',')[1]
        newImageBuffer = Buffer.from(base64Data, 'base64')
        console.log('Processing re-enhanced base64 image from Gemini, size:', newImageBuffer.byteLength, 'bytes')
      } else {
        // Handle external URL (fallback case)
        const response = await fetch(result.imageUrl)
        if (!response.ok) {
          console.error('Failed to fetch re-enhanced image from:', result.imageUrl, 'Status:', response.status)
          throw new Error(`Failed to download re-enhanced image: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        newImageBuffer = Buffer.from(arrayBuffer)
      }
      
      if (newImageBuffer.byteLength === 0) {
        throw new Error('Re-enhanced image is empty')
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const reenhancedFileName = `reenhanced_${timestamp}.jpg`
      const watermarkedFileName = `reenhanced_watermarked_${timestamp}.jpg`

      // Save the re-enhanced image
      const reenhancedPath = join(workflowDir, reenhancedFileName)
      await writeFile(reenhancedPath, Buffer.from(newImageBuffer))

      // Create watermarked version
      const watermarkedPath = join(workflowDir, watermarkedFileName)
      await addWatermark(reenhancedPath, watermarkedPath)

      // Create thumbnail
      const thumbnailPath = join(workflowDir, `reenhanced_thumb_${timestamp}.jpg`)
      await createThumbnail(watermarkedPath, 200)

      const reenhancedUrl = `/uploads/${workflowId}/${reenhancedFileName}`
      const watermarkedUrl = `/uploads/${workflowId}/${watermarkedFileName}`

      // Create result record for re-enhancement
      const dbResult = await prisma.result.create({
        data: {
          workflowId,
          jobId: 'reenhance-job-' + timestamp,
          watermarkedUrl,
          fullresUrl: reenhancedUrl,
        },
      })

      // Update workflow with latest preview
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { 
          previewUrl: watermarkedUrl,
        },
      })

      return NextResponse.json({ 
        resultId: dbResult.id,
        imageUrl: reenhancedUrl,
        watermarkedUrl: watermarkedUrl,
        message: 'Re-enhancement completed successfully' 
      })

    } catch (error) {
      console.error('Re-enhancement failed:', error)
      throw error
    }

  } catch (error) {
    console.error('Re-enhancement error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process re-enhancement' },
      { status: 500 }
    )
  }
}
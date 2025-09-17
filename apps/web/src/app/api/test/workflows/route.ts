import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@simple-stager/database'
import { WorkflowGoal } from '@simple-stager/shared'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    // Get test user
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      return NextResponse.json({ error: 'Test user not found' }, { status: 404 })
    }

    // Get workflows with results for this user
    const workflows = await prisma.workflow.findMany({
      where: { 
        userId: testUser.id,
        status: 'completed'
      },
      include: {
        results: {
          where: {
            downloaded: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    return NextResponse.json({ 
      workflows: workflows.map(workflow => ({
        id: workflow.id,
        goal: workflow.goal,
        sourceImage: workflow.sourceImage,
        thumbnailUrl: workflow.thumbnailUrl,
        previewUrl: workflow.previewUrl,
        createdAt: workflow.createdAt,
        downloaded: workflow.results.length > 0
      }))
    })

  } catch (error) {
    console.error('Workflow history fetch error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get test user instead of requiring auth
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      return NextResponse.json({ error: 'Test user not found' }, { status: 404 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const goal = formData.get('goal') as WorkflowGoal

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Create workflow in database
    const workflow = await prisma.workflow.create({
      data: {
        userId: testUser.id,
        goal: goal || 'stage',
        status: 'ready',
        sourceImage: '', // Will be updated after file processing
      },
    })

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public/uploads', workflow.id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Process and save the image
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate source image path
    const sourceImagePath = join(uploadDir, 'source.jpg')
    const publicSourcePath = `/uploads/${workflow.id}/source.jpg`

    // Process image with Sharp
    await sharp(buffer)
      .jpeg({ quality: 90 })
      .resize(1024, 1024, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toFile(sourceImagePath)

    // Generate thumbnail
    const thumbnailPath = join(uploadDir, 'thumb.jpg')
    const publicThumbnailPath = `/uploads/${workflow.id}/thumb.jpg`

    await sharp(buffer)
      .jpeg({ quality: 80 })
      .resize(200, 200, { 
        fit: 'cover' 
      })
      .toFile(thumbnailPath)

    // Update workflow with file paths
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        sourceImage: publicSourcePath,
        thumbnailUrl: publicThumbnailPath,
      },
    })

    return NextResponse.json({ 
      workflowId: workflow.id,
      message: 'Workflow created successfully' 
    })

  } catch (error) {
    console.error('Test workflow creation error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
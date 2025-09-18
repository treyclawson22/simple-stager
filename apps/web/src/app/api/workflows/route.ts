import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { WorkflowGoal } from '@simple-stager/shared'
import sharp from 'sharp'
import { getR2Storage, isR2Configured } from '@/lib/r2-storage'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
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
        userId: user.id,
        goal: goal || 'stage',
        status: 'ready',
        sourceImage: '', // Will be updated after file processing
      },
    })

    // Process and save the image
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let publicSourcePath: string
    let publicThumbnailPath: string

    if (isR2Configured()) {
      // Use R2 cloud storage
      const r2Storage = getR2Storage()

      // Process source image
      const sourceBuffer = await sharp(buffer)
        .jpeg({ quality: 90 })
        .resize(1024, 1024, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .toBuffer()

      // Process thumbnail
      const thumbnailBuffer = await sharp(buffer)
        .jpeg({ quality: 80 })
        .resize(200, 200, { 
          fit: 'cover' 
        })
        .toBuffer()

      // Upload to R2
      const sourceKey = `workflows/${workflow.id}/original/source.jpg`
      const thumbnailKey = `workflows/${workflow.id}/thumbnail/thumb.jpg`

      publicSourcePath = await r2Storage.uploadFile(sourceKey, sourceBuffer, 'image/jpeg')
      publicThumbnailPath = await r2Storage.uploadFile(thumbnailKey, thumbnailBuffer, 'image/jpeg')

    } else {
      // Fallback to local storage (for development)
      const uploadDir = join(process.cwd(), 'public/uploads', workflow.id)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      const sourceImagePath = join(uploadDir, 'source.jpg')
      const thumbnailPath = join(uploadDir, 'thumb.jpg')
      
      publicSourcePath = `/uploads/${workflow.id}/source.jpg`
      publicThumbnailPath = `/uploads/${workflow.id}/thumb.jpg`

      // Process and save locally
      await sharp(buffer)
        .jpeg({ quality: 90 })
        .resize(1024, 1024, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .toFile(sourceImagePath)

      await sharp(buffer)
        .jpeg({ quality: 80 })
        .resize(200, 200, { 
          fit: 'cover' 
        })
        .toFile(thumbnailPath)
    }

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
    console.error('Workflow creation error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ workflows })

  } catch (error) {
    console.error('Workflows fetch error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
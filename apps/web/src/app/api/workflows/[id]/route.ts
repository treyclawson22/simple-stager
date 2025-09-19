import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'
import { fileStorage } from '@/lib/file-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const resolvedParams = await params
    
    // Find workflow and verify ownership
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
      include: {
        results: true,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)

  } catch (error) {
    console.error('Workflow fetch error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const resolvedParams = await params
    
    // Find workflow and verify ownership
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id,
      },
      include: {
        results: true,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Delete associated files from storage
    try {
      // Delete source image if it exists
      if (workflow.sourceImage) {
        await fileStorage.deleteFile(workflow.sourceImage)
      }

      // Delete preview image if it exists
      if (workflow.previewUrl) {
        await fileStorage.deleteFile(workflow.previewUrl)
      }

      // Delete all result images
      for (const result of workflow.results) {
        if (result.watermarkedUrl) {
          await fileStorage.deleteFile(result.watermarkedUrl)
        }
        if (result.fullresUrl) {
          await fileStorage.deleteFile(result.fullresUrl)
        }
      }
    } catch (fileError) {
      console.warn('Error deleting files during workflow deletion:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete all results first (foreign key constraint)
    await prisma.result.deleteMany({
      where: {
        workflowId: resolvedParams.id,
      },
    })

    // Delete the workflow
    await prisma.workflow.delete({
      where: {
        id: resolvedParams.id,
      },
    })

    return NextResponse.json({ 
      message: 'Workflow deleted successfully',
      workflowId: resolvedParams.id
    })

  } catch (error) {
    console.error('Workflow deletion error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
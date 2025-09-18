import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@simple-stager/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 NEW DOWNLOAD LOGIC: Free re-downloads enabled (v2.0)')
    const user = await requireAuth()

    const resolvedParams = await params
    
    // Find the result and verify ownership
    const result = await prisma.result.findFirst({
      where: {
        id: resolvedParams.id,
      },
      include: {
        workflow: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!result || result.workflow.userId !== user.id) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    // Check if this is a first-time download or re-download
    const isFirstTimeDownload = !result.downloaded

    // Only check credits and charge for first-time downloads
    if (isFirstTimeDownload) {
      // Check if user has credits for first-time download
      if (user.credits <= 0) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        )
      }
      // Deduct credit and mark as downloaded (transaction)
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { credits: { decrement: 1 } },
        }),
        prisma.creditLedger.create({
          data: {
            userId: user.id,
            delta: -1,
            reason: 'download',
            meta: JSON.stringify({ resultId: result.id }),
          },
        }),
        prisma.result.update({
          where: { id: resolvedParams.id },
          data: { downloaded: true },
        }),
      ])
    }
    // For re-downloads, skip credit deduction - user already paid for this download

    // Get the full resolution image without watermark
    if (!result.fullresUrl) {
      return NextResponse.json(
        { error: 'Full resolution image not available' },
        { status: 500 }
      )
    }

    // For local files, read from the filesystem
    if (result.fullresUrl.startsWith('/uploads/')) {
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', result.fullresUrl)
      
      try {
        const imageBuffer = await fs.readFile(filePath)
        
        return new Response(new Uint8Array(imageBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `attachment; filename="simplestager-${result.id}.jpg"`,
          },
        })
      } catch (fsError) {
        console.error('File read error:', fsError)
        // Fallback to URL fetch
      }
    }

    // Fallback: fetch from URL
    const imageResponse = await fetch(result.fullresUrl)
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 500 }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="simplestager-${result.id}.jpg"`,
      },
    })

  } catch (error) {
    console.error('Download error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}
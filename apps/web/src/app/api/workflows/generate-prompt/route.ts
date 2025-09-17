import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { buildPrompt } from '@/lib/openai'
import { prisma } from '@simple-stager/database'
import { WorkflowGoal, PromptAnswers } from '@simple-stager/shared'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    const body = await request.json()
    const { workflowId, goal, answers } = body as {
      workflowId: string
      goal: WorkflowGoal
      answers: PromptAnswers
    }

    if (!workflowId || !goal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate workflow name based on project name
    let workflowName = 'Virtually Staged 1'
    
    if (answers.projectName && answers.projectName.trim()) {
      workflowName = answers.projectName.trim()
    } else {
      // Get count of existing workflows for this user to increment the number
      const existingCount = await prisma.workflow.count({
        where: { 
          userId: user.id,
          name: {
            startsWith: 'Virtually Staged'
          }
        }
      })
      workflowName = `Virtually Staged ${existingCount + 1}`
    }

    // Update workflow with name and other details
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name: workflowName,
        roomType: answers.roomType,
        style: answers.style,
        colorNotes: answers.notes,
      }
    })

    // Generate prompt using OpenAI
    const prompt = await buildPrompt(goal, answers)

    return NextResponse.json({ 
      prompt,
      message: 'Prompt generated successfully' 
    })

  } catch (error) {
    console.error('Prompt generation error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    )
  }
}
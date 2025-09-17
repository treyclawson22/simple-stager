import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/claude'
import { WorkflowGoal, PromptAnswers } from '@simple-stager/shared'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
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

    // Get workflow data to access the source image
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Generate prompt using OpenAI/Gemini with image context
    const prompt = await buildPrompt(goal, answers, workflow.sourceImage)

    // Update workflow with project name if provided
    if (answers.projectName && answers.projectName.trim()) {
      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          name: answers.projectName.trim()
        }
      })
    }

    return NextResponse.json({ 
      prompt,
      message: 'Prompt generated successfully' 
    })

  } catch (error) {
    console.error('Test prompt generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    )
  }
}
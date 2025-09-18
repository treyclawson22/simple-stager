import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { prisma } from '@simple-stager/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      workflowId, 
      projectName, 
      feedbackText, 
      originalImageUrl, 
      stagedImageUrl, 
      originalPrompt 
    } = body

    if (!feedbackText?.trim()) {
      return NextResponse.json({ error: 'Feedback text is required' }, { status: 400 })
    }

    // Prepare email content
    const emailContent = {
      to: 'support@simplestager.com',
      subject: `Staging Feedback - ${projectName || 'Workflow ' + workflowId}`,
      html: `
        <h2>New Staging Feedback Received</h2>
        
        <h3>Project Details:</h3>
        <ul>
          <li><strong>Project Name:</strong> ${projectName || 'Not specified'}</li>
          <li><strong>Workflow ID:</strong> ${workflowId}</li>
          <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        </ul>
        
        <h3>User Feedback:</h3>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-style: italic;">
          "${feedbackText}"
        </p>
        
        <h3>Original Prompt Used:</h3>
        <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;">
          ${originalPrompt || 'No prompt available'}
        </p>
        
        <h3>Images:</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div>
            <h4>Original Image:</h4>
            <img src="${process.env.PUBLIC_URL || 'https://app.simplestager.com'}${originalImageUrl}" 
                 alt="Original room" 
                 style="max-width: 300px; border: 1px solid #ccc; border-radius: 5px;" />
          </div>
          <div>
            <h4>Staged Result:</h4>
            <img src="${process.env.PUBLIC_URL || 'https://app.simplestager.com'}${stagedImageUrl}" 
                 alt="Staged room" 
                 style="max-width: 300px; border: 1px solid #ccc; border-radius: 5px;" />
          </div>
        </div>
        
        <hr style="margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">
          This feedback was automatically generated from the SimpleStager platform.
        </p>
      `,
      text: `
New Staging Feedback Received

Project Name: ${projectName || 'Not specified'}
Workflow ID: ${workflowId}
Timestamp: ${new Date().toISOString()}

User Feedback:
"${feedbackText}"

Original Prompt Used:
${originalPrompt || 'No prompt available'}

Original Image: ${process.env.PUBLIC_URL || 'https://app.simplestager.com'}${originalImageUrl}
Staged Result: ${process.env.PUBLIC_URL || 'https://app.simplestager.com'}${stagedImageUrl}
      `
    }

    // For now, just log the email content since the email service isn't set up yet
    console.log('📧 FEEDBACK EMAIL TO SEND:')
    console.log('============================')
    console.log('To:', emailContent.to)
    console.log('Subject:', emailContent.subject)
    console.log('Content:', emailContent.text)
    console.log('============================')

    // TODO: When email service is ready, send the actual email here
    // Example with a service like SendGrid, Mailgun, or Resend:
    // await sendEmail(emailContent)

    // Save feedback to a log file for now
    const feedbackDir = join(process.cwd(), 'feedback-logs')
    if (!existsSync(feedbackDir)) {
      mkdirSync(feedbackDir, { recursive: true })
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      workflowId,
      projectName,
      feedbackText,
      originalImageUrl,
      stagedImageUrl,
      originalPrompt
    }

    const logFile = join(feedbackDir, `feedback-${Date.now()}.json`)
    await writeFile(logFile, JSON.stringify(logEntry, null, 2))

    // Update workflow status to support_ticket when feedback is submitted
    if (workflowId) {
      try {
        await prisma.workflow.update({
          where: { id: workflowId },
          data: { 
            status: 'support_ticket',
            updatedAt: new Date()
          }
        })
        console.log(`✅ Workflow ${workflowId} status updated to support_ticket`)
      } catch (dbError) {
        console.error('Failed to update workflow status:', dbError)
        // Don't fail the whole request if workflow update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received successfully' 
    })

  } catch (error) {
    console.error('Feedback API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'

// For this example, I'll create a simple email structure
// You can integrate with services like SendGrid, Resend, or similar
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, email, phone, message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Log the support request (you can replace this with actual email sending)
    console.log('🎯 SUPPORT REQUEST:')
    console.log('==================')
    console.log(`From: ${firstName} ${lastName}`)
    console.log(`Email: ${email}`)
    console.log(`Phone: ${phone || 'Not provided'}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Message: ${message}`)
    console.log('==================')

    // In a real implementation, you would send an email here
    // Example with a hypothetical email service:
    /*
    await sendEmail({
      to: 'support@simplestager.com',
      subject: `Support Request from ${firstName} ${lastName}`,
      html: `
        <h3>New Support Request</h3>
        <p><strong>From:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        
        <hr>
        <p><small>Sent from Simple Stager Support System</small></p>
      `
    })
    */

    // For now, we'll just log it and return success
    // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Support request received successfully' 
    })

  } catch (error) {
    console.error('Error processing support request:', error)
    return NextResponse.json({ 
      error: 'Failed to process support request' 
    }, { status: 500 })
  }
}